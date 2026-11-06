import * as THREE from 'three';
import { angleDelta, clamp, dampAngle, pointInArc } from '../core/MathUtils';
import type {
  AttackMove,
  BossPhase,
  CombatHit,
  DamageResult,
  EnemyDef,
  StatusKind,
  Vec3Data,
} from '../types';
import type { AudioEngine } from './AudioEngine';
import type { CameraRig } from './CameraRig';
import { CharacterRig } from './CharacterRig';
import type { Effects } from './Effects';
import type { EventBus } from '../core/EventBus';
import type { Player } from './Player';

export interface EnemyTerrain {
  heightAt(x: number, z: number): number;
  inBounds(x: number, z: number, margin?: number): boolean;
  readonly waterLevel?: number | null;
}

export interface EnemyHooks {
  onDeath?: (enemy: Enemy) => void;
  onBossPhase?: (enemy: Enemy, index: number, phase: BossPhase) => void;
  onBark?: (enemy: Enemy, text: string) => void;
}

export interface EnemyContext {
  scene: THREE.Scene;
  terrain: EnemyTerrain;
  effects: Effects;
  audio: AudioEngine;
  events: EventBus;
  player: Player;
  hooks?: EnemyHooks;
}

type AiMode = 'idle' | 'patrol' | 'chase' | 'strafe' | 'guard' | 'return';

interface ActiveAttack {
  move: AttackMove;
  elapsed: number;
  total: number;
  hitDone: boolean;
  fired: boolean;
  aoeStarted: boolean;
}

interface StatusTimer {
  kind: StatusKind;
  remaining: number;
  magnitude: number;
}

const DEFAULT_DETECTION = 20;

const AURA_COLORS: Record<string, string> = {
  fire: '#ff7a3c',
  frost: '#bfe8ff',
  poison: '#9ad06a',
  sound: '#c9e4e0',
  sand: '#ffd27a',
  none: '#ffffff',
};

const AURA_TYPES: Record<string, string> = {
  fire: 'fire',
  frost: 'frost',
  poison: 'poison',
  sound: 'sound',
  sand: 'physical',
  none: 'physical',
};

/**
 * One enemy, from a shore ronin to the Hollow Crown.
 *
 * The AI is a readable state machine: notice → approach → telegraph → strike →
 * recover. Every attack exposes its windup, so the player can learn it. Bosses
 * add phase thresholds, an arena leash, aura hazards and bark lines.
 */
export class Enemy {
  readonly def: EnemyDef;
  readonly group = new THREE.Group();
  readonly position = new THREE.Vector3();
  readonly home = new THREE.Vector3();
  readonly rig: CharacterRig;
  id: string;
  hp: number;
  maxHp: number;
  posture: number;
  maxPosture: number;
  postureBroken = false;
  brokenTimer = 0;
  dead = false;
  deathTimer = 0;
  removed = false;
  yaw = 0;
  aggro = false;
  guarding = false;
  activeAttack: ActiveAttack | null = null;
  phaseIndex = 0;
  phaseName = '';
  arena: { x: number; z: number; r: number } | null = null;
  readonly radius: number;
  readonly height: number;
  private readonly ctx: EnemyContext;
  private mode: AiMode = 'idle';
  private attackCooldown = 0.4;
  private moveCooldowns = new Map<string, number>();
  private staggerTimer = 0;
  private patrolTarget = new THREE.Vector3();
  private patrolWait = 0;
  private patrolStep = 0;
  private thinkTimer = 0;
  private speedMul = 1;
  private damageMul = 1;
  private auraTimer = 2;
  private statuses: StatusTimer[] = [];
  private lastHitAgo = 99;
  private flash = 0;
  private gait = 0;
  private barkCooldown = 0;
  private chainQueued = false;
  private lastMoveId = '';
  private spawnGrace = 0.9;
  private lookTarget = new THREE.Vector3();

  constructor(ctx: EnemyContext, def: EnemyDef, x: number, z: number, yaw = 0) {
    this.ctx = ctx;
    this.def = def;
    this.id = `${def.id}_${Math.floor(Math.random() * 1e9).toString(36)}`;
    this.radius = def.radius;
    this.height = def.height;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.posture = 0;
    this.maxPosture = def.posture;
    this.yaw = yaw;
    this.home.set(x, ctx.terrain.heightAt(x, z), z);
    this.position.copy(this.home);
    this.patrolTarget.copy(this.home);

    this.rig = new CharacterRig({
      palette: {
        primary: def.colors.robe,
        secondary: def.colors.armor,
        skin: def.colors.skin,
        hair: def.colors.armor,
        accent: def.colors.accent,
        blade: def.colors.weapon,
      },
      weapon: def.weapon,
      scale: def.scale ?? 1,
      build: def.kind === 'beast' ? 'human' : def.kind === 'spirit' ? 'monk' : 'samurai',
      boss: !!def.isBoss,
      motif: def.motif,
      glow: def.colors.accent,
    });
    this.group.add(this.rig.group);
    this.group.position.copy(this.position);
    this.group.rotation.y = yaw;
    this.group.userData.enemy = this;
    ctx.scene.add(this.group);

    this.phaseName = def.phases?.[0]?.name ?? '';
    this.speedMul = def.phases?.[0]?.speedMultiplier ?? 1;
    this.damageMul = def.phases?.[0]?.damageMultiplier ?? 1;
    this.choosePatrolTarget();

    if (def.isBoss) {
      this.ctx.events.emit('boss:start', { boss: def });
      this.ctx.audio.sfx('boss_roar', 1);
      if (def.intro) this.bark(def.intro, 4.2);
    }
  }

  get isBoss(): boolean {
    return !!this.def.isBoss;
  }

  get healthFraction(): number {
    return clamp(this.hp / this.maxHp, 0, 1);
  }

  get postureFraction(): number {
    return clamp(this.posture / this.maxPosture, 0, 1);
  }

  get canDeathblow(): boolean {
    return this.postureBroken && this.brokenTimer > 0 && !this.dead;
  }

  get moveName(): string {
    return this.activeAttack?.move.name ?? '';
  }

  setArena(arena: { x: number; z: number; r: number } | null): void {
    this.arena = arena;
  }

  totalMoveDistance(): number {
    return this.activeAttack ? this.activeAttack.move.range : 0;
  }

  update(dt: number, time: number, playerPos: THREE.Vector3, playerDead: boolean): void {
    if (this.removed) return;
    this.spawnGrace = Math.max(0, this.spawnGrace - dt);
    this.barkCooldown = Math.max(0, this.barkCooldown - dt);
    this.flash = Math.max(0, this.flash - dt * 4);
    this.lastHitAgo += dt;

    if (this.dead) {
      this.deathTimer += dt;
      this.rig.update(dt, time, { speed: 0, dead: true, deadTime: this.deathTimer });
      const ground = this.ctx.terrain.heightAt(this.position.x, this.position.z);
      this.position.y = Math.max(ground, this.position.y - dt * 2.2);
      this.group.position.copy(this.position);
      if (this.deathTimer > 3.2) this.removed = true;
      return;
    }

    this.updateStatuses(dt);
    this.tickCooldowns(dt);

    if (this.postureBroken) {
      this.brokenTimer -= dt;
      this.staggerTimer = Math.max(this.staggerTimer, 0.05);
      if (this.brokenTimer <= 0) {
        this.postureBroken = false;
        this.posture = this.maxPosture * 0.42;
        this.staggerTimer = 0;
        this.ctx.events.emit('enemy:posture', {
          id: this.id,
          value: this.posture,
          max: this.maxPosture,
          broken: false,
        });
      }
    }

    if (this.staggerTimer > 0) {
      this.staggerTimer -= dt;
      this.rig.update(dt, time, { speed: 0, hurt: 0.8, guard: false });
      this.group.position.copy(this.position);
      this.group.rotation.y = this.yaw;
      return;
    }

    if (this.activeAttack) {
      this.updateAttack(dt, time, playerPos);
      return;
    }

    // Posture recovers when the pressure lets up.
    if (this.lastHitAgo > 2.4 && !this.postureBroken) {
      const rate = this.isBoss ? this.maxPosture * 0.055 : this.maxPosture * 0.16;
      this.posture = Math.max(0, this.posture - rate * dt);
    }

    if (playerDead || this.spawnGrace > 0) {
      this.mode = 'idle';
      this.rig.update(dt, time, { speed: 0, guard: false });
      return;
    }

    this.thinkTimer -= dt;
    const dist = Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z);
    if (!this.aggro && this.thinkTimer <= 0) {
      this.thinkTimer = 0.22;
      this.considerDetection(dist, playerPos);
    }

    if (this.aggro) {
      this.combatMovement(dt, time, playerPos, dist);
    } else {
      this.idleMovement(dt, time);
    }

    this.applyGravityAndBounds(dt, time);
    if (this.def.isBoss && this.aggro && this.barkCooldown <= 0) {
      this.maybeBark();
    }
  }

  private considerDetection(dist: number, playerPos: THREE.Vector3): void {
    if (this.def.behavior === 'passive') return;
    const player = this.ctx.player;
    let range = this.def.detection ?? DEFAULT_DETECTION;
    if (player.crouching) range *= 0.55;
    else if (player.sprinting) range *= 1.25;
    if (this.def.behavior === 'ambush') range *= 0.7;
    const toPlayer = Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z);
    if (Math.abs(angleDelta(this.yaw, toPlayer)) > 2.1) range *= 0.7;
    if (dist < range) {
      this.aggro = true;
      this.mode = 'chase';
      this.ctx.audio.sfx(this.isBoss ? 'boss_roar' : 'roar', this.isBoss ? 1 : 0.4);
      if (!this.isBoss && this.def.kind !== 'spirit' && this.barkCooldown <= 0) {
        this.barkCooldown = 18;
        this.bark(this.def.title ? `${this.def.name}. ${this.def.title}.` : this.def.name, 1.8);
      }
    }
  }

  private idleMovement(dt: number, time: number): void {
    const behavior = this.def.behavior;
    if (behavior === 'guard' || behavior === 'ranged' || behavior === 'passive') {
      this.mode = 'idle';
      this.rig.update(dt, time, { speed: 0, guard: behavior === 'guard', sit: behavior === 'passive' });
      this.group.position.copy(this.position);
      this.group.rotation.y = this.yaw;
      return;
    }

    if (behavior === 'patrol' || behavior === 'ambush') {
      if (this.patrolWait > 0) {
        this.patrolWait -= dt;
        this.rig.update(dt, time, { speed: 0, guard: this.def.kind === 'monk' });
        this.group.position.copy(this.position);
        this.group.rotation.y = this.yaw;
        return;
      }
      const dx = this.patrolTarget.x - this.position.x;
      const dz = this.patrolTarget.z - this.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 1.2) {
        this.patrolWait = 1.2 + Math.random() * 2.4;
        this.choosePatrolTarget();
        return;
      }
      const speed = (this.def.speed ?? 3.2) * 0.42;
      this.yaw = dampAngle(this.yaw, Math.atan2(dx, dz), 3, dt);
      this.position.x += Math.sin(this.yaw) * speed * dt;
      this.position.z += Math.cos(this.yaw) * speed * dt;
      this.gait += dt * speed;
      this.rig.update(dt, time, { speed, guard: false });
      this.group.position.copy(this.position);
      this.group.rotation.y = this.yaw;
      return;
    }

    this.rig.update(dt, time, { speed: 0 });
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
  }

  private combatMovement(dt: number, time: number, playerPos: THREE.Vector3, dist: number): void {
    const speed = (this.def.speed ?? 3.2) * this.speedMul * this.slowFactor();
    const toPlayer = Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z);
    this.yaw = dampAngle(this.yaw, toPlayer, this.isBoss ? 5.5 : 7.5, dt);

    const attacks = this.availableAttacks();
    const nearest = attacks.length
      ? attacks.reduce((best, move) => (move.range < best.range ? move : best), attacks[0])
      : null;
    const desiredRange = nearest ? nearest.range * 0.72 : 2.6;

    let vx = 0;
    let vz = 0;
    let moving = false;

    if (this.def.behavior === 'ranged' && dist < 6.5) {
      vx = -Math.sin(toPlayer) * speed;
      vz = -Math.cos(toPlayer) * speed;
      moving = true;
      this.mode = 'strafe';
    } else if (this.def.behavior === 'guard' && dist < 6 && this.attackCooldown > 0.6) {
      this.guarding = true;
      this.mode = 'guard';
    } else if (dist > desiredRange + 0.35) {
      vx = Math.sin(toPlayer) * speed;
      vz = Math.cos(toPlayer) * speed;
      moving = true;
      this.mode = 'chase';
      this.guarding = false;
    } else if (this.attackCooldown > 0) {
      this.mode = 'strafe';
      const side = Math.sin(time * 0.7 + this.home.x) > 0 ? 1 : -1;
      const strafe = Math.cos(toPlayer) * side;
      vx = Math.sin(toPlayer + Math.PI / 2) * speed * 0.28 * side;
      vz = Math.cos(toPlayer + Math.PI / 2) * speed * 0.28 * side;
      moving = Math.abs(strafe) > 0;
      this.guarding = this.def.behavior === 'guard' && dist < 4.6;
    } else if (this.attackCooldown <= 0 && nearest) {
      this.startAttack(this.pickAttack(attacks, dist));
      return;
    }

    if (this.def.behavior === 'ranged' && dist > 7 && dist < 24 && this.attackCooldown <= 0) {
      const picked = this.pickAttack(attacks, dist);
      if (picked) {
        this.startAttack(picked);
        return;
      }
    }

    if (moving) {
      const nx = this.position.x + vx * dt;
      const nz = this.position.z + vz * dt;
      if (this.canStand(nx, nz)) {
        this.position.x = nx;
        this.position.z = nz;
        this.gait += dt * speed;
      }
    }

    this.rig.update(dt, time, {
      speed: moving ? speed : 0,
      sprint: moving && dist > 9,
      guard: this.guarding,
      cast: this.def.behavior === 'ranged' && !moving && this.attackCooldown > 0.9,
    });
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;

    if (dist < 3.6 && this.def.behavior !== 'ranged' && this.attackCooldown <= 0 && nearest) {
      this.startAttack(this.pickAttack(attacks, dist));
    }
  }

  private availableAttacks(): AttackMove[] {
    const phase = this.def.phases?.[this.phaseIndex];
    if (!phase) return this.def.attacks;
    const allowed = this.def.attacks.filter((a) => phase.moves.includes(a.id));
    return allowed.length ? allowed : this.def.attacks;
  }

  private pickAttack(attacks: AttackMove[], dist: number): AttackMove | null {
    const usable = attacks.filter((a) => (this.moveCooldowns.get(a.id) ?? 0) <= 0 && a.damage > 0);
    if (!usable.length) return null;
    const inRange = usable.filter((a) => dist <= a.range + 0.5 && dist >= (a.aoe ? 0 : 0.6));
    const pool = inRange.length ? inRange : usable;
    const weighted: AttackMove[] = [];
    for (const move of pool) {
      if (move.id === this.lastMoveId) weighted.push(move);
      else weighted.push(move, move, move);
    }
    return weighted[Math.floor(Math.random() * weighted.length)] ?? pool[0] ?? null;
  }

  private startAttack(move: AttackMove | null): void {
    if (!move) return;
    this.activeAttack = {
      move,
      elapsed: 0,
      total: move.windup + move.active + move.recover,
      hitDone: false,
      fired: false,
      aoeStarted: false,
    };
    this.lastMoveId = move.id;
    this.guarding = false;
    this.chainQueued = false;
    this.attackCooldown = (move.cooldown ?? 0) > 0 ? 0.15 : 0.55 + Math.random() * 0.7;
    this.ctx.audio.sfx(this.isBoss ? 'sword_heavy' : 'sword_light', 0.7);

    const telegraph = move.telegraph ?? (move.perilous ? 'red' : 'none');
    if (telegraph !== 'none') {
      const color = telegraph === 'red' ? '#ff4a3c' : '#ffd27a';
      this.ctx.effects.ring(
        { x: this.position.x, y: this.position.y + 0.1, z: this.position.z },
        Math.max(1.6, move.range * 0.5),
        color,
        0.55,
        0.2,
      );
      this.ctx.effects.spark(
        { x: this.position.x, y: this.position.y + this.height * 0.75, z: this.position.z },
        color,
        8,
        2.4,
      );
    }
  }

  private updateAttack(dt: number, time: number, playerPos: THREE.Vector3): void {
    const a = this.activeAttack!;
    const move = a.move;
    a.elapsed += dt;
    const activeStart = move.windup;
    const activeEnd = move.windup + move.active;

    if (a.elapsed < activeEnd) {
      const dist = Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z);
      if (dist < 16) {
        this.yaw = dampAngle(
          this.yaw,
          Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z),
          a.elapsed < activeStart ? 6.5 : 2.2,
          dt,
        );
      }
    }

    if (move.lunge !== 0 && a.elapsed < activeEnd) {
      const nx = this.position.x + Math.sin(this.yaw) * move.lunge * dt;
      const nz = this.position.z + Math.cos(this.yaw) * move.lunge * dt;
      if (this.canStand(nx, nz)) {
        this.position.x = nx;
        this.position.z = nz;
      }
    }

    if (move.dash && a.elapsed >= move.windup * 0.7 && !a.fired) {
      const nx = this.position.x + Math.sin(this.yaw) * move.dash;
      const nz = this.position.z + Math.cos(this.yaw) * move.dash;
      if (this.canStand(nx, nz)) {
        this.position.x = nx;
        this.position.z = nz;
      }
    }

    if (a.elapsed >= activeStart) {
      if (move.projectile && !a.fired) {
        a.fired = true;
        const dir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
        this.ctx.effects.spawnProjectile(
          this.position.clone(),
          dir,
          move.projectile,
          move.damage * this.damageMul,
          'enemy',
          this.id,
        );
        this.ctx.audio.sfx(move.projectile.ring ? 'projectile' : move.sfx ?? 'bow');
      }

      if (move.aoe && !a.aoeStarted) {
        a.aoeStarted = true;
        const target = playerPos.clone();
        const dist = Math.hypot(target.x - this.position.x, target.z - this.position.z);
        if (dist > move.range + 2) {
          target.set(
            this.position.x + Math.sin(this.yaw) * (move.range * 0.8),
            this.position.y,
            this.position.z + Math.cos(this.yaw) * (move.range * 0.8),
          );
        }
        const aoe = move.aoe;
        this.ctx.effects.spawnAoe(target, aoe, () => {
          if (this.dead) return;
          const p = this.ctx.player;
          const d = Math.hypot(p.position.x - target.x, p.position.z - target.z);
          if (d <= aoe.radius) this.landHit(move, p.position);
          if (aoe.linger) {
            this.ctx.effects.addHazard(
              target,
              aoe.radius * 0.7,
              aoe.linger,
              move.damage * 0.24 * this.damageMul,
              aoe.color ?? '#ff7a3c',
              this.id,
              aoe.damageType ?? 'fire',
            );
          }
        });
        this.ctx.audio.sfx('explosion', 0.6);
      }

      if (!a.hitDone && !move.projectile && !move.aoe) {
        const p = this.ctx.player;
        const vertical = Math.abs(p.position.y - this.position.y);
        if (
          vertical < 3.2 &&
          pointInArc(
            this.position.x,
            this.position.z,
            this.yaw,
            p.position.x,
            p.position.z,
            move.range,
            move.arc,
          )
        ) {
          a.hitDone = true;
          this.landHit(move, p.position);
        }
      }
    }

    if (a.elapsed >= a.total) {
      const chain = move.chain?.length && Math.random() < (this.isBoss ? 0.62 : 0.32);
      if (chain) {
        const nextId = move.chain![Math.floor(Math.random() * move.chain!.length)];
        const next = this.def.attacks.find((m) => m.id === nextId);
        if (next) {
          this.startAttack(next);
          return;
        }
      }
      this.activeAttack = null;
      this.attackCooldown = Math.max(this.attackCooldown, 0.45 + Math.random() * 0.7);
      return;
    }

    this.rig.update(dt, time, {
      speed: 0,
      attackType: move.anim ?? 'slash',
      attackT: clamp(a.elapsed / a.total, 0, 1),
      cast: move.anim === 'cast',
      hurt: this.flash,
    });
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
  }

  private landHit(move: AttackMove, playerPos: THREE.Vector3): void {
    const player = this.ctx.player;
    const hit: CombatHit & { perilous?: boolean } = {
      attacker: 'enemy',
      damage: move.damage * this.damageMul,
      posture: move.posture * this.damageMul,
      damageType: move.damageType ?? 'physical',
      status: move.status,
      knockback: move.knockback,
      hitstop: move.hitstop,
      parried: false,
      perilous: move.perilous === true,
      sourceId: this.id,
      position: { x: this.position.x, y: this.position.y + this.height * 0.6, z: this.position.z },
    };
    const result = player.takeHit(hit, this.position);
    const position: Vec3Data = {
      x: playerPos.x,
      y: playerPos.y + 1.3,
      z: playerPos.z,
    };
    if (result.parried) {
      this.staggerTimer = Math.max(this.staggerTimer, 0.85);
      this.posture = Math.min(this.maxPosture, this.posture + 12);
      this.ctx.effects.spark(position, '#ffe8a8', 18, 6);
      this.ctx.audio.sfx('parry');
      this.ctx.events.emit('combat:hitstop', { duration: 0.09 });
      this.ctx.events.emit('enemy:posture', {
        id: this.id,
        value: this.posture,
        max: this.maxPosture,
        broken: this.posture >= this.maxPosture,
      });
    } else if (result.blocked) {
      this.ctx.effects.spark(position, '#ffd8a0', 10, 3.5);
      this.ctx.events.emit('combat:hitstop', { duration: 0.05 });
    } else {
      this.ctx.effects.blood(position, this.def.kind === 'spirit' ? '#bcd8d4' : '#a8322a', 10);
      this.ctx.events.emit('combat:hitstop', { duration: move.hitstop || 0.04 });
      if (result.killed) this.ctx.audio.sfx('deathblow', 0.35);
    }
    this.ctx.events.emit('combat:hit', { result, position });
  }

  private applyGravityAndBounds(dt: number, time: number): void {
    const ground = this.ctx.terrain.heightAt(this.position.x, this.position.z);
    this.position.y = ground;
    if (this.arena) {
      const dx = this.position.x - this.arena.x;
      const dz = this.position.z - this.arena.z;
      const d = Math.hypot(dx, dz);
      if (d > this.arena.r - 1) {
        this.position.x = this.arena.x + (dx / d) * (this.arena.r - 1);
        this.position.z = this.arena.z + (dz / d) * (this.arena.r - 1);
      }
    }
    if (!this.ctx.terrain.inBounds(this.position.x, this.position.z, 3)) {
      this.position.x = clamp(this.position.x, -220, 220);
      this.position.z = clamp(this.position.z, -220, 220);
    }
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
    this.lookTarget.set(
      this.ctx.player.position.x,
      this.ctx.player.position.y + 1.3,
      this.ctx.player.position.z,
    );
    if (this.aggro && !this.dead) {
      this.rig.group.rotation.y = 0;
    }
    this.gait += dt * 0.2;
  }

  private canStand(x: number, z: number): boolean {
    if (!this.ctx.terrain.inBounds(x, z, 3)) return false;
    const water = this.ctx.terrain.waterLevel;
    if (water !== null && water !== undefined && this.ctx.terrain.heightAt(x, z) < water - 0.9) return false;
    if (this.arena) {
      const d = Math.hypot(x - this.arena.x, z - this.arena.z);
      if (d > this.arena.r - 0.6) return false;
    }
    return true;
  }

  private choosePatrolTarget(): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 8;
    this.patrolTarget.set(
      this.home.x + Math.sin(angle) * radius,
      this.home.y,
      this.home.z + Math.cos(angle) * radius,
    );
    this.patrolStep += 1;
  }

  private updateStatuses(dt: number): void {
    for (let i = this.statuses.length - 1; i >= 0; i--) {
      const s = this.statuses[i];
      s.remaining -= dt;
      if (s.kind === 'burn' || s.kind === 'poison') {
        this.hp = Math.max(0, this.hp - dt * (s.kind === 'burn' ? 3.2 : 1.6) * (1 + s.magnitude * 0.02));
        if (this.hp <= 0) {
          this.die();
          return;
        }
      }
      if (s.remaining <= 0) this.statuses.splice(i, 1);
    }
  }

  private slowFactor(): number {
    let factor = 1;
    for (const s of this.statuses) {
      if (s.kind === 'frostbite' || s.kind === 'slow') factor *= 0.68;
      if (s.kind === 'stagger') factor *= 0.5;
    }
    return factor;
  }

  private tickCooldowns(dt: number): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    for (const [id, value] of this.moveCooldowns) {
      if (value <= 0) continue;
      const next = value - dt;
      if (next <= 0) this.moveCooldowns.delete(id);
      else this.moveCooldowns.set(id, next);
    }
  }

  applyStatus(kind: StatusKind, amount: number): void {
    const existing = this.statuses.find((s) => s.kind === kind);
    if (existing) {
      existing.remaining = Math.max(existing.remaining, 3 + amount * 0.12);
      existing.magnitude = Math.max(existing.magnitude, amount);
    } else {
      this.statuses.push({ kind, remaining: 3 + amount * 0.12, magnitude: amount });
    }
    if (kind === 'stagger') this.staggerTimer = Math.max(this.staggerTimer, 0.4);
  }

  /** Called by Game when the player's active hit window overlaps this enemy. */
  receiveHit(hit: CombatHit, fromPos: THREE.Vector3): DamageResult {
    const result: DamageResult = {
      damage: 0,
      posture: 0,
      blocked: false,
      parried: false,
      killed: false,
      postureBroken: false,
      critical: !!hit.critical,
    };
    if (this.dead) return result;
    this.aggro = true;
    this.lastHitAgo = 0;
    this.flash = 1;

    const toAttacker = Math.atan2(fromPos.x - this.position.x, fromPos.z - this.position.z);
    const facing = Math.abs(angleDelta(this.yaw, toAttacker)) < 1.85;
    const perilous = (hit as CombatHit & { perilous?: boolean }).perilous === true;
    const physical = hit.damageType === 'physical';

    if (
      physical &&
      facing &&
      !hit.critical &&
      !perilous &&
      !hit.parried &&
      (this.def.parryChance ?? 0) > 0 &&
      Math.random() < (this.def.parryChance ?? 0) * (this.isBoss ? 1.35 : 1)
    ) {
      result.parried = true;
      this.ctx.audio.sfx('parry');
      this.ctx.effects.spark(
        { x: this.position.x, y: this.position.y + this.height * 0.8, z: this.position.z },
        '#ffe8a8',
        16,
        5,
      );
      this.ctx.events.emit('combat:hitstop', { duration: 0.1 });
      return result;
    }

    if (facing && this.guarding && !hit.critical && !perilous) {
      result.blocked = true;
      const chip = hit.damage * 0.12;
      this.hp = Math.max(0, this.hp - chip);
      this.posture = Math.min(this.maxPosture, this.posture + hit.posture * 0.55);
      result.damage = chip;
      result.posture = hit.posture * 0.55;
      this.ctx.audio.sfx('hit_metal');
      this.ctx.effects.spark(
        { x: this.position.x, y: this.position.y + this.height * 0.7, z: this.position.z },
        '#ffd8a0',
        9,
        3.5,
      );
      this.ctx.events.emit('combat:hitstop', { duration: 0.05 });
      this.checkBreak();
      if (this.hp <= 0) this.die();
      result.killed = this.dead;
      return result;
    }

    const multiplier = hit.critical ? 1.4 : hit.backstab ? 1.3 : 1;
    const damage = hit.damage * multiplier;
    this.hp = Math.max(0, this.hp - damage);
    this.posture = Math.min(this.maxPosture, this.posture + hit.posture * (hit.critical ? 1.4 : 1.1));
    result.damage = damage;
    result.posture = hit.posture;
    if (hit.status) this.applyStatus(hit.status.kind, hit.status.amount);
    this.staggerTimer = Math.max(this.staggerTimer, hit.critical ? 0.6 : 0.18);
    this.guarding = false;
    this.checkBreak();
    if (this.hp <= 0) this.die();
    result.killed = this.dead;
    result.postureBroken = this.postureBroken;
    return result;
  }

  private checkBreak(): void {
    if (this.posture >= this.maxPosture && !this.postureBroken) {
      this.postureBroken = true;
      this.brokenTimer = this.isBoss ? 3.2 : 4.6;
      this.staggerTimer = this.isBoss ? 1.9 : 2.5;
      this.activeAttack = null;
      this.guarding = false;
      this.ctx.audio.sfx('gong');
      this.ctx.effects.ring(
        { x: this.position.x, y: this.position.y + 0.4, z: this.position.z },
        2.4,
        '#ffd27a',
        0.8,
        0.18,
      );
      this.ctx.events.emit('enemy:posture', {
        id: this.id,
        value: this.posture,
        max: this.maxPosture,
        broken: true,
      });
      if (this.isBoss) this.ctx.events.emit('ui:toast', { title: 'POSTURE BROKEN', text: 'Deathblow available.', kind: 'boss', duration: 1600 });
    }
  }

  /** A deathblow is a cinematic execution: lethal to grunts, costly to bosses. */
  deathblow(fromPos: THREE.Vector3): boolean {
    if (!this.canDeathblow || this.dead) return false;
    this.yaw = Math.atan2(fromPos.x - this.position.x, fromPos.z - this.position.z);
    this.postureBroken = false;
    this.brokenTimer = 0;
    this.posture = 0;
    this.staggerTimer = 1.8;
    this.flash = 1;
    this.ctx.audio.sfx('deathblow');
    this.ctx.effects.spark(
      { x: this.position.x, y: this.position.y + 1.1, z: this.position.z },
      '#ffd27a',
      38,
      9,
    );
    this.ctx.effects.ring(
      { x: this.position.x, y: this.position.y + 0.2, z: this.position.z },
      1.6,
      '#ffd27a',
      0.7,
      0.22,
    );
    this.ctx.events.emit('combat:hitstop', { duration: 0.18 });
    this.ctx.events.emit('player:deathblow', { target: this.id });
    if (this.isBoss) {
      const damage = Math.max(this.maxHp * 0.16, 65);
      this.hp = Math.max(0, this.hp - damage);
      this.ctx.events.emit('enemy:damage', {
        id: this.id,
        amount: damage,
        position: { x: this.position.x, y: this.position.y + 1.2, z: this.position.z },
        critical: true,
      });
      if (this.hp <= 0) this.die();
      else this.updatePhase();
    } else {
      this.hp = 0;
      this.die();
    }
    return true;
  }

  private die(): void {
    if (this.dead) return;
    this.dead = true;
    this.deathTimer = 0;
    this.activeAttack = null;
    this.guarding = false;
    this.postureBroken = false;
    this.ctx.audio.sfx('death', 0.8);
    this.ctx.effects.deathDissolve(
      { x: this.position.x, y: this.position.y + this.height * 0.5, z: this.position.z },
      this.def.colors.accent,
    );
    this.ctx.effects.spark(
      { x: this.position.x, y: this.position.y + this.height * 0.6, z: this.position.z },
      this.def.colors.accent,
      this.isBoss ? 40 : 16,
      this.isBoss ? 8 : 4,
    );
    this.ctx.events.emit('enemy:death', {
      id: this.def.id,
      kind: this.def.kind,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      boss: !!this.def.isBoss,
    });
    this.ctx.hooks?.onDeath?.(this);
  }

  private updatePhase(): void {
    if (!this.def.phases || this.def.phases.length <= 1) return;
    const fraction = this.healthFraction;
    let target = 0;
    for (let i = 0; i < this.def.phases.length; i++) {
      if (fraction <= this.def.phases[i].threshold) target = i;
    }
    if (target <= this.phaseIndex) return;
    this.phaseIndex = target;
    const phase = this.def.phases[target];
    this.phaseName = phase.name;
    this.speedMul = phase.speedMultiplier ?? 1;
    this.damageMul = phase.damageMultiplier ?? 1;
    this.posture = 0;
    this.moveCooldowns.clear();
    this.ctx.events.emit('boss:phase', { boss: this.def.id, phase: target, name: phase.name });
    this.ctx.hooks?.onBossPhase?.(this, target, phase);
    if (phase.line) this.bark(phase.line, 4.6);
    this.ctx.audio.sfx('boss_roar');
    this.ctx.effects.ring(
      { x: this.position.x, y: this.position.y + 0.6, z: this.position.z },
      4.5,
      AURA_COLORS[phase.aura ?? 'none'] ?? '#ffd27a',
      1.1,
      0.16,
    );
    this.auraTimer = 0.3;
  }

  private maybeBark(): void {
    const phase = this.def.phases?.[this.phaseIndex];
    if (phase?.line) {
      this.bark(phase.line, 4.2);
      this.barkCooldown = 24;
      return;
    }
    if (this.healthFraction < 0.35) {
      this.bark(`${this.def.name} is faltering.`, 2.4);
      this.barkCooldown = 28;
    }
  }

  private bark(text: string, duration: number): void {
    this.ctx.hooks?.onBark?.(this, text);
    this.ctx.events.emit('ui:subtitle', { speaker: this.def.name, text, duration });
  }

  /** Boss aura hazards and phase checks, called once per frame after update. */
  postUpdate(dt: number): void {
    if (this.dead) return;
    if (this.isBoss) {
      this.updatePhase();
      const phase = this.def.phases?.[this.phaseIndex];
      const aura = phase?.aura && phase.aura !== 'none' ? phase.aura : null;
      if (aura && this.aggro) {
        this.auraTimer -= dt;
        if (this.auraTimer <= 0) {
          this.auraTimer = 2.6;
          this.ctx.effects.addHazard(
            { x: this.position.x, y: this.position.y + 0.02, z: this.position.z },
            Math.max(2.2, this.radius * 2.4),
            2.8,
            3 + this.damageMul * 2,
            AURA_COLORS[aura] ?? '#ff7a3c',
            this.id,
            AURA_TYPES[aura] ?? 'fire',
          );
        }
      }
    }
  }

  /** UI-facing snapshot. */
  snapshot(): {
    name: string;
    title: string;
    hp: number;
    maxHp: number;
    posture: number;
    maxPosture: number;
    phase: string;
    phaseIndex: number;
    boss: boolean;
  } {
    return {
      name: this.def.name,
      title: this.def.title ?? this.def.kind,
      hp: this.hp,
      maxHp: this.maxHp,
      posture: this.posture,
      maxPosture: this.maxPosture,
      phase: this.phaseName,
      phaseIndex: this.phaseIndex,
      boss: this.isBoss,
    };
  }

  /** Project a point above the head for the lock-on reticle. */
  headPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return target.set(
      this.position.x,
      this.position.y + this.height * (this.def.scale ?? 1) + 0.45,
      this.position.z,
    );
  }

  worldPosition(target = new THREE.Vector3()): THREE.Vector3 {
    return target.copy(this.position);
  }

  faceTowards(x: number, z: number, dt: number): void {
    this.yaw = dampAngle(this.yaw, Math.atan2(x - this.position.x, z - this.position.z), 8, dt);
  }

  dispose(): void {
    this.ctx.scene.remove(this.group);
    this.rig.dispose();
  }

  /** Reserved for future camera-aware boss barks. */
  lookAt(_camera: CameraRig): void {
    // Bosses intentionally do not track the camera; their silhouettes read better.
  }
}
