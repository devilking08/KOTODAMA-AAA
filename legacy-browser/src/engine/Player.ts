import * as THREE from 'three';
import type { EventBus } from '../core/EventBus';
import { angleDelta, clamp, dampAngle, lerp } from '../core/MathUtils';
import type { AttackMove, CombatHit, DamageResult, SaveData, SettingsData, WeaponDef } from '../types';
import { ARTS, PLAYER_MOVES, SKILLS, WEAPONS } from '../content/weapons';
import type { AudioEngine } from './AudioEngine';
import type { CameraRig } from './CameraRig';
import { CharacterRig } from './CharacterRig';
import type { Input } from './Input';

export interface PlayerTerrain {
  heightAt(x: number, z: number): number;
  isUnderWater(x: number, z: number): boolean;
  inBounds(x: number, z: number, margin?: number): boolean;
  readonly waterLevel: number | null;
  readonly half: number;
}

interface ActiveAttack {
  move: AttackMove;
  elapsed: number;
  total: number;
  kind: 'light' | 'heavy' | 'art';
  comboIndex: number;
  hits: Set<string>;
}

const DIFFICULTY_TAKEN = { story: 0.55, warrior: 1, nameless: 1.55 };
const DIFFICULTY_DEALT = { story: 1.15, warrior: 1, nameless: 0.88 };

export class Player {
  readonly group = new THREE.Group();
  readonly position = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  rig: CharacterRig;
  yaw = Math.PI;
  stats: SaveData['stats'];
  save: SaveData;
  weapon: WeaponDef;
  settings: SettingsData;
  events: EventBus;
  audio: AudioEngine;

  // movement / combat state
  activeAttack: ActiveAttack | null = null;
  guarding = false;
  guardTimer = 99;
  crouching = false;
  sprinting = false;
  invuln = 0;
  hurtTimer = 0;
  staggerTimer = 0;
  dead = false;
  deadTime = 0;
  flowReady = false;
  private time = 0;
  private comboTimer = 0;
  private comboIndex = -1;
  private queuedLight = false;
  private queuedHeavy = false;
  private guardReleased = 0;
  private dodgeCooldown = 0;
  private dodgeTimer = 0;
  private dodgeDir = new THREE.Vector3();
  private healTimer = 0;
  private attackBuffer = 0;
  private footstepTimer = 0;
  private postureCooldown = 0;
  private flowTimer = 0;
  private buffTimer = 0;
  private grapple: { from: THREE.Vector3; to: THREE.Vector3; t: number; duration: number } | null = null;
  private arena: { x: number; z: number; r: number } | null = null;
  private lockTarget: THREE.Vector3 | null = null;
  private lastGroundedY = 0;
  private wasMoving = false;
  public stealth = true;

  constructor(
    scene: THREE.Scene,
    save: SaveData,
    settings: SettingsData,
    events: EventBus,
    audio: AudioEngine,
  ) {
    this.save = save;
    this.stats = save.stats;
    this.settings = settings;
    this.events = events;
    this.audio = audio;
    this.weapon = WEAPONS[save.weapon] ?? WEAPONS.katana;
    this.rig = this.makeRig();
    this.group.add(this.rig.group);
    scene.add(this.group);
    this.recomputeStats();
    this.stats.health = Math.min(this.stats.health || this.stats.maxHealth, this.stats.maxHealth);
  }

  private makeRig(): CharacterRig {
    const weapon = this.weapon;
    return new CharacterRig({
      weapon: weapon.model === 'greatsword' ? 'greatsword' : (weapon.model as 'katana' | 'odachi' | 'spear' | 'dual'),
      palette: {
        primary: '#3b332c',
        secondary: '#4e423a',
        skin: '#c9a17d',
        hair: '#1b1613',
        accent: weapon.colors.wrap,
        blade: weapon.colors.blade,
      },
      build: 'samurai',
      scale: 1,
    });
  }

  get forward(): THREE.Vector3 {
    return new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
  }

  get isAttacking(): boolean {
    return !!this.activeAttack;
  }

  get isBusy(): boolean {
    return !!this.activeAttack || this.staggerTimer > 0 || this.healTimer > 0 || this.dodgeTimer > 0 || this.dead || !!this.grapple;
  }

  get parryWindow(): number {
    return 0.16 + this.skillRank('wind_reading') * 0.035 + (this.settings.difficulty === 'story' ? 0.08 : 0);
  }

  get dodgeWindow(): number {
    return 0.26 + this.skillRank('swift_step') * 0.03 + (this.settings.difficulty === 'story' ? 0.08 : 0);
  }

  skillRank(id: string): number {
    return this.save.skills[id] ?? 0;
  }

  recomputeStats(): void {
    const s = this.stats;
    const levelBonus = (s.level - 1) * 5;
    s.maxHealth = 120 + levelBonus + this.skillRank('vitality') * 10 + Number(this.save.flags['bonus_health'] ?? 0);
    s.maxPosture = 100 + this.skillRank('iron_posture') * 10 + Number(this.save.flags['bonus_posture'] ?? 0);
    s.maxResolve = 3 + (this.skillRank('deep_reserve') > 0 ? 1 : 0);
    s.maxGourds = 3 + this.skillRank('gourd_blessing');
    s.health = Math.min(s.health, s.maxHealth);
    s.posture = Math.min(s.posture, s.maxPosture);
    s.resolve = Math.min(s.resolve, s.maxResolve);
    s.gourds = Math.min(s.gourds, s.maxGourds);
  }

  get attackMultiplier(): number {
    return (1 + this.skillRank('tempered_edge') * 0.06) * this.weapon.damage * (this.buffTimer > 0 ? 1.2 : 1) * (this.flowReady ? 1.15 : 1);
  }

  get postureMultiplier(): number {
    return (1 + this.skillRank('deep_cut') * 0.08) * this.weapon.posture;
  }

  get artMultiplier(): number {
    return (1 + this.skillRank('executioner') * 0.12) * (this.flowReady ? 1.2 : 1);
  }

  get moveSpeed(): number {
    let speed = 5.1 * (1 + this.skillRank('fleet_foot') * 0.05) * (this.weapon.speed * 0.35 + 0.65);
    if (this.sprinting) speed *= 1.62;
    if (this.crouching) speed *= 0.48;
    if (this.guarding) speed *= 0.44;
    return speed;
  }

  get flow(): number {
    return this.stats.flow;
  }

  setSettings(settings: SettingsData): void {
    this.settings = settings;
  }

  setLockTarget(target: THREE.Vector3 | null): void {
    this.lockTarget = target;
  }

  get lockedTarget(): THREE.Vector3 | null {
    return this.lockTarget;
  }

  setArena(center: { x: number; z: number; r: number } | null): void {
    this.arena = center;
  }

  teleport(x: number, z: number, yaw: number, terrain: PlayerTerrain): void {
    this.position.set(x, terrain.heightAt(x, z), z);
    this.yaw = yaw;
    this.group.position.copy(this.position);
    this.group.rotation.y = yaw;
    this.velocity.set(0, 0, 0);
    this.activeAttack = null;
    this.dead = false;
    this.deadTime = 0;
    this.grapple = null;
  }

  respawn(terrain: PlayerTerrain): void {
    this.dead = false;
    this.deadTime = 0;
    this.stats.health = this.stats.maxHealth;
    this.stats.posture = this.stats.maxPosture;
    this.stats.gourds = this.stats.maxGourds;
    this.stats.resolve = Math.max(1, Math.floor(this.stats.maxResolve / 2));
    this.activeAttack = null;
    this.grapple = null;
    this.hurtTimer = 0;
    this.staggerTimer = 0;
    this.invuln = 1.4;
    this.position.y = terrain.heightAt(this.position.x, this.position.z);
  }

  update(
    dt: number,
    input: Input,
    camera: CameraRig,
    terrain: PlayerTerrain,
    boundsActive = true,
  ): void {
    this.time += dt;
    this.attackBuffer = Math.max(0, this.attackBuffer - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt * 2.5);
    this.staggerTimer = Math.max(0, this.staggerTimer - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    this.flowTimer = Math.max(0, this.flowTimer - dt);
    this.buffTimer = Math.max(0, this.buffTimer - dt);
    this.guardReleased = Math.max(0, this.guardReleased - dt);
    this.guardTimer += dt;
    this.deadTime = this.dead ? this.deadTime + dt : 0;

    if (this.dead) {
      this.rig.update(dt, this.time, { speed: 0, dead: true, deadTime: this.deadTime });
      this.group.position.copy(this.position);
      return;
    }

    this.updateGrapple(dt, terrain);
    if (this.grapple) {
      this.rig.update(dt, this.time, { speed: 0, cast: true });
      this.group.position.copy(this.position);
      this.group.rotation.y = this.yaw;
      return;
    }

    if (this.healTimer > 0) this.healTimer -= dt;
    if (this.dodgeTimer > 0) this.dodgeTimer -= dt;

    const canAct = this.staggerTimer <= 0 && this.healTimer <= 0;
    const move = input.moveAxis;
    const { forward, right } = camera.getBasis();
    const wish = new THREE.Vector3()
      .addScaledVector(forward, -move.y)
      .addScaledVector(right, move.x);
    const wishLen = wish.length();
    if (wishLen > 0.001) wish.normalize();

    // Guard
    if (canAct && input.wasPressed('guard') && !this.activeAttack) {
      this.guarding = true;
      this.guardTimer = 0;
    }
    if (!input.isDown('guard') || !canAct) {
      if (this.guarding) this.guardReleased = 0.28;
      this.guarding = false;
    }

    if (canAct && !this.guarding && this.dodgeTimer <= 0 && this.dodgeCooldown <= 0 && input.wasPressed('dodge')) {
      this.startDodge(wish, terrain);
    }

    if (canAct && !this.guarding && input.wasPressed('light')) this.queueOrStartAttack('light', input);
    if (canAct && !this.guarding && input.wasPressed('heavy')) this.queueOrStartAttack('heavy', input);
    if (canAct && !this.guarding && input.wasPressed('special')) this.startArt();

    if (canAct && input.wasPressed('crouch')) this.crouching = !this.crouching;
    if (canAct && input.wasPressed('heal') && this.healTimer <= 0) this.useGourd();

    // Lock-on facing and camera-relative movement.
    this.sprinting = canAct && input.isDown('sprint') && wishLen > 0.1 && !this.crouching && !this.guarding && !this.activeAttack && move.y < -0.2;
    if (this.sprinting) this.crouching = false;

    let targetYaw = this.yaw;
    if (this.lockTarget) {
      targetYaw = Math.atan2(this.lockTarget.x - this.position.x, this.lockTarget.z - this.position.z);
      if (!this.activeAttack && !this.sprinting) this.yaw = dampAngle(this.yaw, targetYaw, 8, dt);
    } else if (wishLen > 0.1 && !this.activeAttack) {
      targetYaw = Math.atan2(wish.x, wish.z);
      this.yaw = dampAngle(this.yaw, targetYaw, 11, dt);
    }

    if (this.dodgeTimer > 0) {
      const speed = 11.5 * (this.dodgeTimer / 0.42);
      this.velocity.copy(this.dodgeDir).multiplyScalar(speed);
    } else if (this.activeAttack) {
      const m = this.activeAttack.move;
      const inWindup = this.activeAttack.elapsed < m.windup + m.active;
      const lunge = inWindup ? m.lunge : 0;
      this.velocity.set(Math.sin(this.yaw) * lunge, 0, Math.cos(this.yaw) * lunge);
    } else if (this.healTimer > 0) {
      this.velocity.multiplyScalar(0.85);
    } else if (canAct) {
      const speed = this.moveSpeed * (this.crouching ? 0.65 : 1) * (this.sprinting ? 1 : 1);
      const slowdown = terrain.isUnderWater(this.position.x, this.position.z) ? 0.55 : 1;
      this.velocity.x = wish.x * speed * slowdown;
      this.velocity.z = wish.z * speed * slowdown;
    } else {
      this.velocity.multiplyScalar(0.8);
    }

    // Update attack timeline & combo buffering.
    if (this.activeAttack) {
      const a = this.activeAttack;
      a.elapsed += dt;
      if (a.elapsed > a.total * 0.56) {
        if (input.wasPressed('light')) this.queuedLight = true;
        if (input.wasPressed('heavy')) this.queuedHeavy = true;
      }
      if (a.kind === 'light' && this.queuedLight && a.elapsed >= a.total) {
        this.queuedLight = false;
        this.startLight(0.88);
      } else if (a.kind === 'light' && this.queuedHeavy && a.elapsed >= a.total) {
        this.queuedHeavy = false;
        this.startHeavy();
      } else if (a.elapsed >= a.total) {
        this.comboIndex = a.kind === 'light' ? a.comboIndex : -1;
        this.comboTimer = 0.92;
        this.activeAttack = null;
        this.queuedLight = false;
        this.queuedHeavy = false;
      }
    }

    // Apply velocity.
    const nextX = this.position.x + this.velocity.x * dt;
    const nextZ = this.position.z + this.velocity.z * dt;
    let targetX = nextX;
    let targetZ = nextZ;
    if (boundsActive && !terrain.inBounds(targetX, targetZ, 4)) {
      targetX = this.position.x;
      targetZ = this.position.z;
    }
    if (this.arena) {
      const dx = targetX - this.arena.x;
      const dz = targetZ - this.arena.z;
      const d = Math.hypot(dx, dz);
      if (d > this.arena.r) {
        targetX = this.arena.x + (dx / d) * this.arena.r;
        targetZ = this.arena.z + (dz / d) * this.arena.r;
      }
    }
    const groundY = terrain.heightAt(targetX, targetZ);
    const water = terrain.waterLevel;
    if (water !== null && groundY < water - 1.7) {
      // Deep water is a soft wall; the coast stays readable.
      targetX = this.position.x;
      targetZ = this.position.z;
    }
    this.position.x = targetX;
    this.position.z = targetZ;
    this.position.y = groundY;
    if (this.position.y < this.lastGroundedY - 2.5) this.invuln = Math.max(this.invuln, 0.2);
    this.lastGroundedY = this.position.y;

    // posture recovery, flow decay, footsteps
    this.postureCooldown = Math.max(0, this.postureCooldown - dt);
    if (this.postureCooldown <= 0 && !this.guarding) {
      this.stats.posture = Math.min(this.stats.maxPosture, this.stats.posture + dt * 11);
    }
    if (this.guarding) this.stats.posture = Math.min(this.stats.maxPosture, this.stats.posture + dt * 3);
    if (this.flowTimer <= 0 && this.stats.flow > 0) this.stats.flow = Math.max(0, this.stats.flow - dt * 7);
    if (this.stats.flow >= 100) this.flowReady = true;
    if (this.stats.flow < 40) this.flowReady = false;

    const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (planarSpeed > 1 && this.dodgeTimer <= 0) {
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0) {
        this.footstepTimer = this.sprinting ? 0.28 : 0.44;
        this.audio.sfx('footstep', this.crouching ? 0.4 : 1);
      }
    }
    this.wasMoving = planarSpeed > 0.3;

    if (this.stats.posture >= this.stats.maxPosture && this.staggerTimer <= 0) {
      this.staggerTimer = 1.25;
      this.stats.posture = this.stats.maxPosture * 0.55;
      this.activeAttack = null;
      this.events.emit('ui:toast', { title: 'POSTURE BROKEN', text: 'Recover your footing.', kind: 'warning' });
      this.audio.sfx('gong');
    }

    // Stealth: crouching or far from enemies; Game reads this for detection.
    this.stealth = this.crouching || (!this.sprinting && planarSpeed < 2.8);

    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
    this.rig.update(dt, this.time, {
      speed: planarSpeed,
      sprint: this.sprinting,
      crouch: this.crouching || this.dodgeTimer > 0,
      guard: this.guarding,
      dead: this.dead,
      deadTime: this.deadTime,
      hurt: this.hurtTimer,
      attackType: this.activeAttack?.move.anim,
      attackT: this.activeAttack ? clamp(this.activeAttack.elapsed / this.activeAttack.total, 0, 1) : undefined,
      cast: this.healTimer > 0,
    });
  }

  private queueOrStartAttack(kind: 'light' | 'heavy', input: Input): void {
    if (this.activeAttack) {
      if (this.activeAttack.elapsed > this.activeAttack.total * 0.55) {
        if (kind === 'light') this.queuedLight = true;
        else this.queuedHeavy = true;
      }
      return;
    }
    this.crouching = false;
    this.guarding = false;
    if (kind === 'light') {
      if (input.wasPressed('sprint')) this.startLight(1, true);
      else this.startLight();
    } else {
      this.startHeavy();
    }
  }

  private startLight(damageScale = 1, dash = false): void {
    const combo = this.weapon.combo;
    let idx = 0;
    if (this.comboTimer > 0 && this.comboIndex >= 0) idx = (this.comboIndex + 1) % combo.length;
    const base = PLAYER_MOVES[combo[idx]] ?? PLAYER_MOVES.k1;
    const move: AttackMove = { ...base, damage: base.damage * damageScale + (dash ? 4 : 0) };
    this.beginAttack(move, 'light', idx);
    this.audio.sfx(move.sfx ?? 'sword_light');
    if (this.lockTarget) this.yaw = Math.atan2(this.lockTarget.x - this.position.x, this.lockTarget.z - this.position.z);
  }

  private startHeavy(): void {
    const key = this.weapon.heavy;
    const base = PLAYER_MOVES[key] ?? PLAYER_MOVES.heavy;
    this.beginAttack({ ...base }, 'heavy', -1);
    this.audio.sfx(base.sfx ?? 'sword_heavy');
    if (this.lockTarget) this.yaw = Math.atan2(this.lockTarget.x - this.position.x, this.lockTarget.z - this.position.z);
  }

  private startArt(): void {
    const artId = this.weapon.art;
    const art = ARTS[artId];
    if (!art) return;
    if (this.stats.resolve < art.cost) {
      this.events.emit('ui:toast', { title: 'No Resolve', text: 'Land hits and parries to build Resolve.', kind: 'warning', duration: 1500 });
      return;
    }
    const base = PLAYER_MOVES[art.move];
    if (!base) return;
    this.stats.resolve -= art.cost;
    this.beginAttack({ ...base, damage: base.damage * this.artMultiplier }, 'art', -1);
    this.audio.sfx('art_release');
    if (this.lockTarget) this.yaw = Math.atan2(this.lockTarget.x - this.position.x, this.lockTarget.z - this.position.z);
    if (this.flowReady) {
      this.save.flags['flow_art'] = true;
      this.stats.flow = 0;
      this.flowReady = false;
    }
  }

  private beginAttack(move: AttackMove, kind: 'light' | 'heavy' | 'art', comboIndex: number): void {
    const total = move.windup + move.active + move.recover;
    this.activeAttack = { move, elapsed: 0, total, kind, comboIndex, hits: new Set() };
    this.queuedLight = false;
    this.queuedHeavy = false;
    this.stats.posture = Math.max(0, this.stats.posture - 2);
  }

  private startDodge(wish: THREE.Vector3, terrain: PlayerTerrain): void {
    const dir = wish.lengthSq() > 0.01 ? wish.clone() : new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    dir.y = 0;
    dir.normalize();
    this.dodgeDir.copy(dir);
    this.dodgeTimer = 0.42;
    this.dodgeCooldown = 0.58;
    this.invuln = Math.max(this.invuln, this.dodgeWindow);
    this.guarding = false;
    this.audio.sfx('dodge');
    this.events.emit('player:dodge', { perfect: false });
    if (terrain.isUnderWater(this.position.x, this.position.z)) this.dodgeTimer *= 0.7;
  }

  useGourd(): void {
    if (this.stats.gourds <= 0) {
      this.events.emit('ui:toast', { title: 'No Gourds', text: 'Rest at a shrine to refill.', kind: 'warning', duration: 1400 });
      return;
    }
    this.stats.gourds -= 1;
    const heal = Math.round(this.stats.maxHealth * 0.42);
    this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + heal);
    this.healTimer = 0.75;
    this.guarding = false;
    this.activeAttack = null;
    this.audio.sfx('heal');
    this.events.emit('player:heal', { amount: heal, health: this.stats.health });
    this.save.flags['gourds_used'] = Number(this.save.flags['gourds_used'] ?? 0) + 1;
    if (Number(this.save.flags['gourds_used']) >= 30) this.save.flags['gourds_30'] = true;
  }

  consumeItem(id: string): boolean {
    const inv = this.save.inventory;
    if (!inv[id] || inv[id] <= 0) return false;
    const def = (id === 'incense'
      ? { effect: 'heal', amount: 40, duration: undefined }
      : id === 'talisman'
        ? { effect: 'attack', amount: 0.2, duration: 25 }
        : id === 'smoke_bomb'
          ? { effect: 'smoke', amount: 6, duration: 6 }
          : id === 'snow_lotus'
            ? { effect: 'health', amount: 8, duration: undefined }
            : id === 'dune_glass'
              ? { effect: 'posture', amount: 8, duration: undefined }
              : null);
    if (!def) return false;
    inv[id] -= 1;
    switch (def.effect) {
      case 'heal':
        this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + (def.amount ?? 0));
        this.events.emit('player:heal', { amount: def.amount ?? 0, health: this.stats.health });
        break;
      case 'attack':
        this.buffTimer = def.duration ?? 20;
        break;
      case 'smoke':
        this.invuln = def.duration ?? 6;
        this.save.flags['smoke_active'] = true;
        break;
      case 'health':
        this.save.flags['bonus_health'] = Number(this.save.flags['bonus_health'] ?? 0) + (def.amount ?? 0);
        this.recomputeStats();
        this.stats.health = this.stats.maxHealth;
        break;
      case 'posture':
        this.save.flags['bonus_posture'] = Number(this.save.flags['bonus_posture'] ?? 0) + (def.amount ?? 0);
        this.recomputeStats();
        this.stats.posture = this.stats.maxPosture;
        break;
      default:
        break;
    }
    this.audio.sfx('pickup');
    this.events.emit('world:pickup', { name: def.effect, item: id, count: 1 });
    return true;
  }

  /** Resolve an incoming hit. The attacker's position is used for facing. */
  takeHit(hit: CombatHit, attackerPos: THREE.Vector3): DamageResult {
    const result: DamageResult = {
      damage: 0, posture: 0, blocked: false, parried: false, killed: false, postureBroken: false, critical: !!hit.critical,
    };
    if (this.dead) return result;

    if (this.invuln > 0 || this.dodgeTimer > 0) {
      result.parried = true;
      result.damage = 0;
      this.gainFlow(6);
      this.events.emit('player:dodge', { perfect: true });
      return result;
    }

    const toAttacker = Math.atan2(attackerPos.x - this.position.x, attackerPos.z - this.position.z);
    const facing = Math.abs(angleDelta(this.yaw, toAttacker)) < 1.75;
    const parryable = hit.damageType !== 'sound' && !hit.parried && (hit as CombatHit & { perilous?: boolean }).perilous !== true;

    if (this.guarding && facing && !hit.critical) {
      if (parryable && this.guardTimer <= this.parryWindow && hit.damageType !== 'sound') {
        result.parried = true;
        result.posture = 0;
        this.gainFlow(13);
        this.stats.resolve = Math.min(this.stats.maxResolve, this.stats.resolve + 0.5);
        this.stats.posture = Math.min(this.stats.maxPosture, this.stats.posture + 5);
        this.save.parries += 1;
        this.guardTimer = 99;
        this.audio.sfx('parry');
        this.events.emit('player:parry', { perfect: true, position: { x: this.position.x, y: this.position.y, z: this.position.z } });
        return result;
      }
      result.blocked = true;
      const guardDamage = hit.damage * 0.18 * (hit.damageType === 'physical' ? 1 : 1.15);
      this.damage(Math.max(1, guardDamage));
      result.damage = guardDamage;
      result.posture = hit.posture * 1.55;
      this.applyPosture(result.posture);
      this.stats.resolve = Math.min(this.stats.maxResolve, this.stats.resolve + 0.15);
      this.audio.sfx('hit_metal');
      this.events.emit('ui:damage', { amount: result.damage, position: { x: this.position.x, y: this.position.y + 1.6, z: this.position.z }, kind: 'player' });
      return result;
    }

    const backstab = Math.abs(angleDelta(this.yaw, toAttacker)) > 2.4;
    result.critical = result.critical || backstab;
    const taken = hit.damage * DIFFICULTY_TAKEN[this.settings.difficulty] * (result.critical ? 1.35 : 1);
    result.damage = taken;
    this.damage(taken);
    result.posture = hit.posture;
    this.applyPosture(result.posture);
    this.hurtTimer = Math.min(1, this.hurtTimer + 0.55);
    this.guarding = false;
    this.activeAttack = null;
    this.postureCooldown = 1.1;
    this.audio.sfx('hit_flesh');
    this.events.emit('ui:damage', { amount: taken, position: { x: this.position.x, y: this.position.y + 1.7, z: this.position.z }, kind: 'player' });
    this.events.emit('player:damage', { amount: taken, health: this.stats.health });
    result.postureBroken = result.posture > 0 && this.stats.posture >= this.stats.maxPosture;
    result.killed = this.stats.health <= 0;
    if (result.killed) this.die();
    return result;
  }

  addPosture(amount: number): void {
    this.stats.posture = Math.min(this.stats.maxPosture, this.stats.posture + amount);
    this.postureCooldown = 1.4;
  }

  private applyPosture(amount: number): void {
    this.stats.posture = Math.min(this.stats.maxPosture, this.stats.posture + amount);
    this.postureCooldown = 1.35;
  }

  private damage(amount: number): void {
    const defense = 1 - Math.min(0.35, this.stats.defense * 0.008);
    this.stats.health = Math.max(0, this.stats.health - amount * defense);
    this.flowTimer = 3;
    this.stats.flow = Math.max(0, this.stats.flow - 20);
  }

  private die(): void {
    if (this.dead) return;
    this.dead = true;
    this.deadTime = 0;
    this.activeAttack = null;
    this.guarding = false;
    this.save.deaths += 1;
    this.audio.sfx('death');
    this.events.emit('game:death', { deaths: this.save.deaths });
  }

  gainFlow(amount: number): void {
    const bonus = 1 + this.skillRank('flow_state') * 0.2;
    this.stats.flow = clamp(this.stats.flow + amount * bonus, 0, 100);
    this.flowTimer = 4.5;
    if (this.stats.flow >= 100) this.flowReady = true;
  }

  gainResolve(amount: number): void {
    this.stats.resolve = Math.min(this.stats.maxResolve, this.stats.resolve + amount);
  }

  gainEssence(amount: number): void {
    const bonus = 1 + this.skillRank('essence_flow') * 0.15;
    this.stats.essence += Math.round(amount * bonus);
  }

  addXp(amount: number): void {
    this.stats.xp += amount;
    while (this.stats.xp >= this.stats.xpNext) {
      this.stats.xp -= this.stats.xpNext;
      this.stats.level += 1;
      this.stats.xpNext = Math.round(this.stats.xpNext * 1.28);
      this.stats.skillPoints += 1;
      this.stats.maxHealth += 5;
      this.stats.health = this.stats.maxHealth;
      this.stats.attack += 1;
      this.audio.sfx('level');
      this.events.emit('player:level', { level: this.stats.level });
      this.events.emit('ui:toast', { title: 'LEVEL UP', text: `Level ${this.stats.level} — the sword remembers more of you.`, kind: 'achievement', duration: 2600 });
    }
  }

  purchaseSkill(id: string): boolean {
    const def = SKILLS[id];
    if (!def) return false;
    const rank = this.skillRank(id);
    if (rank >= def.maxRank) return false;
    if (def.requires?.some((r) => this.skillRank(r) <= 0)) return false;
    if (this.stats.skillPoints < def.cost) return false;
    this.stats.skillPoints -= def.cost;
    this.save.skills[id] = rank + 1;
    this.recomputeStats();
    this.audio.sfx('level');
    return true;
  }

  equipWeapon(id: string): boolean {
    if (!this.save.unlockedWeapons.includes(id)) return false;
    const weapon = WEAPONS[id];
    if (!weapon) return false;
    this.weapon = weapon;
    this.save.weapon = id;
    this.save.equippedArt = weapon.art;
    this.group.remove(this.rig.group);
    this.rig.dispose();
    this.rig = this.makeRig();
    this.group.add(this.rig.group);
    this.activeAttack = null;
    this.events.emit('player:weapon', { weapon });
    return true;
  }

  unlockWeapon(id: string): boolean {
    if (!WEAPONS[id] || this.save.unlockedWeapons.includes(id)) return false;
    this.save.unlockedWeapons.push(id);
    this.save.flags[`weapon_${id}`] = true;
    return true;
  }

  rest(): void {
    this.stats.health = this.stats.maxHealth;
    this.stats.posture = this.stats.maxPosture;
    this.stats.gourds = this.stats.maxGourds;
    this.stats.resolve = Math.max(this.stats.resolve, 1.5);
    this.stats.flow = 0;
    this.dead = false;
    this.deadTime = 0;
    this.staggerTimer = 0;
    this.hurtTimer = 0;
  }

  startGrapple(target: THREE.Vector3, terrain: PlayerTerrain): void {
    if (this.isBusy || this.dead) return;
    const to = target.clone();
    to.y = Math.max(terrain.heightAt(to.x, to.z), target.y);
    this.grapple = { from: this.position.clone(), to, t: 0, duration: 0.56 };
    this.invuln = Math.max(this.invuln, 0.7);
    this.guarding = false;
    this.audio.sfx('dodge');
  }

  private updateGrapple(dt: number, terrain: PlayerTerrain): void {
    if (!this.grapple) return;
    this.grapple.t += dt / this.grapple.duration;
    const t = clamp(this.grapple.t, 0, 1);
    this.position.lerpVectors(this.grapple.from, this.grapple.to, t);
    this.position.y += Math.sin(t * Math.PI) * 3.2;
    this.position.y = Math.max(this.position.y, terrain.heightAt(this.position.x, this.position.z));
    if (t >= 1) {
      this.position.y = terrain.heightAt(this.position.x, this.position.z);
      this.grapple = null;
    }
  }

  get activeHitWindow(): boolean {
    if (!this.activeAttack) return false;
    const a = this.activeAttack;
    return a.elapsed >= a.move.windup && a.elapsed <= a.move.windup + a.move.active;
  }

  canHit(id: string): boolean {
    return !!this.activeAttack && !this.activeAttack.hits.has(id);
  }

  markHit(id: string): void {
    this.activeAttack?.hits.add(id);
  }

  get attackFacing(): number {
    return this.yaw;
  }

  get inCombat(): boolean {
    return !!this.activeAttack || this.hurtTimer > 0 || this.staggerTimer > 0;
  }

  get isMoving(): boolean {
    return this.wasMoving;
  }

  playDeathblowPose(): void {
    this.activeAttack = null;
    this.guarding = false;
    this.healTimer = 0;
    this.dodgeTimer = 0;
    this.comboTimer = 0;
  }
}
