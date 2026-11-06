import * as THREE from 'three';
import { ACHIEVEMENTS } from '../content/achievements';
import { CINEMATICS } from '../content/cinematics';
import { CODEX } from '../content/codex';
import { DIALOGUE, getDialogue } from '../content/dialogue';
import { ENDINGS, pickEnding, trueEndingAvailable } from '../content/endings';
import { ALL_ENEMIES, BOSSES } from '../content/enemies';
import { ALL_QUESTS } from '../content/quests';
import { REGIONS } from '../content/regions';
import { CHAPTERS } from '../content/chapters';
import { ITEMS, SKILL_TREES, SKILLS, WEAPONS, WEAPON_ORDER } from '../content/weapons';
import type { DialogueChoice, DialogueEffect, DialogueNode, DialogueTree, GameMode, SaveData, SettingsData } from '../types';
import { EventBus } from '../core/EventBus';
import { createNewSave, DEFAULT_SETTINGS, SaveSystem } from '../core/SaveSystem';
import { AudioEngine } from './AudioEngine';
import { CameraRig } from './CameraRig';
import { Effects } from './Effects';
import { Enemy, type EnemyContext } from './Enemy';
import { Engine } from './Engine';
import { Input } from './Input';
import { Player } from './Player';
import { QuestSystem } from './QuestSystem';
import { Terrain } from './Terrain';
import { Weather } from './Weather';
import { World } from './World';
import type { UI } from '../ui/UI';

const AUTOSAVE_INTERVAL = 75;
const BOSS_BAR_REFRESH = 0.12;

export interface GameOptions {
  canvas: HTMLCanvasElement;
  ui: UI;
}

type CinematicStepState = { index: number; done: boolean };

export class Game {
  readonly events = new EventBus();
  readonly saves = SaveSystem.browser();
  engine!: Engine;
  terrain!: Terrain;
  world!: World;
  weather!: Weather;
  effects!: Effects;
  camera!: CameraRig;
  player!: Player;
  input!: Input;
  audio = new AudioEngine();
  quests!: QuestSystem;
  mode: GameMode = 'boot';
  settings: SettingsData = { ...DEFAULT_SETTINGS };
  save!: SaveData;

  private enemies: Enemy[] = [];
  private readonly ui: UI;
  private readonly canvas: HTMLCanvasElement;
  private clock = new THREE.Clock();
  private elapsed = 0;
  private autosaveTimer = 0;
  private bossTimer = 0;
  private activeBoss: Enemy | null = null;
  private prevArenaFog: string | null = null;
  private chapterQueued = -1;
  private deathTimer = 0;
  private cinematic: { def: (typeof CINEMATICS)[string]; t: number; steps: CinematicStepState[]; onEnd: () => void } | null = null;
  private dialogue: {
    tree: DialogueTree;
    node: string;
    queue: { speaker: string; text: string; duration: number }[];
    timer: number;
    nextNode?: string;
    endNode?: boolean;
    choiceEffects?: DialogueChoice[];
    npcId?: string;
  } | null = null;
  private consumable = 'incense';
  private hiddenHud = false;
  private trailGhostTimer = 0;
  private swingFanActive = false;
  private slashArcDone = false;
  private heroFill: THREE.DirectionalLight | null = null;
  private heroRim: THREE.DirectionalLight | null = null;

  /** Scene-level key/fill/rim lights that follow the camera basis so the
   *  hero stays readable even against strong backlight. */
  private ensureHeroLights(): void {
    if (this.heroFill && this.heroRim) return;
    this.heroFill = new THREE.DirectionalLight('#cfe2ff', 0.85);
    this.engine.scene.add(this.heroFill);
    this.heroRim = new THREE.DirectionalLight('#ffcf9a', 0.8);
    this.engine.scene.add(this.heroRim);
  }

  private updateHeroLights(): void {
    if (!this.heroFill || !this.heroRim) return;
    const cam = this.camera.camera;
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    const back = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 2);
    const fwd = back.clone().negate();
    const target = this.player.position;
    this.heroFill.position.copy(target).addScaledVector(right, -3.4).addScaledVector(up, 1.7).addScaledVector(fwd, -2.6);
    this.heroFill.target.position.copy(target);
    this.heroRim.position.copy(target).addScaledVector(right, 3.0).addScaledVector(up, 2.1).addScaledVector(fwd, 2.8);
    this.heroRim.target.position.copy(target);
    this.engine.scene.add(this.heroFill.target);
    this.engine.scene.add(this.heroRim.target);
  }
  private frames = 0;
  private fpsTimer = 0;
  private fpsValue = 0;
  private inBossFight = false;
  private lockTarget: Enemy | null = null;
  private checkpoint = { shrine: 'shore_first', x: 0, z: 120 };

  constructor(opts: GameOptions) {
    this.canvas = opts.canvas;
    this.ui = opts.ui;
    this.settings = this.saves.loadSettings();
    this.input = new Input(this.canvas);
    this.input.sensitivity = this.settings.sensitivity;
    this.input.invertY = this.settings.invertY;
    this.events.on('audio:boss', () => undefined);
    this.events.on('input:action', () => undefined);
    this.events.on('debug:teleport', (p) => this.teleport(p.x, p.z));
  }

  /* ── Boot & title ────────────────────────────────────────────────────── */

  async start(): Promise<void> {
    const region = REGIONS.shore;
    this.engine = new Engine(this.canvas, region.theme, this.settings.quality);
    this.effects = new Effects(this.engine.scene);
    this.camera = new CameraRig(this.engine.camera);
    this.camera.setReducedMotion(this.settings.reduceMotion);
    await this.audio.ensure();
    this.audio.applySettings(this.settings);
    this.audio.setMood('title');
    this.ui.attach(this);
    this.input.bindTouchControls(this.ui.root);
    this.ui.showTitle();
    this.mode = 'title';
    this.loop();
  }

  newGame(slot = 1): void {
    this.save = createNewSave(slot);
    this.runIntro();
  }

  loadGame(save: SaveData): void {
    this.save = save;
    this.settings = this.saves.loadSettings();
    this.loadChapter(save.chapter, save.spawn);
    this.mode = 'playing';
  }

  continueGame(): void {
    const latest = this.saves.latest();
    if (latest) this.loadGame(latest.data);
    else this.newGame(1);
  }

  private runIntro(): void {
    const def = CINEMATICS.cine_prologue;
    this.loadChapter(0, 'shore_start', () => {
      this.playCinematic(def, () => {
        this.mode = 'playing';
        this.ui.hideLetterbox();
      });
    });
  }

  /* ── Chapter / region lifecycle ──────────────────────────────────────── */

  private loadChapter(chapter: number, spawn: string, after?: () => void): void {
    const def = CHAPTERS[chapter];
    if (!def) return;
    const region = REGIONS[def.region];
    if (!region) return;

    this.disposeWorld();
    this.ui.hideAllScreens();

    this.save.chapter = chapter;
    this.save.region = region.id;
    this.save.spawn = spawn;
    if (!this.save.visitedRegions.includes(region.id)) this.save.visitedRegions.push(region.id);

    this.engine.setTheme(region.theme);
    this.terrain = new Terrain(region);
    this.engine.scene.add(this.terrain.mesh);

    this.quests = new QuestSystem({
      save: this.save,
      events: this.events,
      grant: (quest, reward) => this.grantQuestRewards(quest, reward),
      onDirty: () => this.autosave(true),
    });
    this.quests.ensureChapterMain(chapter);

    this.world = new World({
      scene: this.engine.scene,
      region,
      terrain: this.terrain,
      events: this.events,
      chapter,
      flags: () => this.save.flags,
      outlines: this.settings.outlines,
    });
    this.engine.scene.add(this.world.group);

    this.weather = new Weather(this.engine.scene, region.theme.particle, region.theme.weather, region.theme.wind);

    const wasDead = this.player?.dead ?? false;
    if (!this.player || wasDead) {
      this.player = new Player(this.engine.scene, this.save, this.settings, this.events, this.audio);
    } else {
      this.player.save = this.save;
      this.player.recomputeStats();
    }
    this.player.setSettings(this.settings);
    this.ensureHeroLights();

    const spawnPoint = region.spawns.find((s) => s.id === spawn) ?? region.spawns[0];
    if (spawnPoint) {
      this.player.teleport(spawnPoint.x, spawnPoint.z, spawnPoint.rot, this.terrain);
    }
    this.checkpoint = { shrine: region.shrines[0]?.id ?? 'shore_first', x: spawnPoint?.x ?? 0, z: spawnPoint?.z ?? 0 };

    this.spawnEnemies(region.id, chapter);
    this.resetBossState();
    this.audio.setAmbience(region.ambience.wind + region.ambience.water * 0.5 + region.ambience.crowd * 0.3);
    this.audio.setMood(this.moodFor(region.id));

    this.player.events = this.events;
    this.events.emit('game:chapter', { chapter: def, index: chapter });
    this.events.emit('game:region', { region });
    this.ui.setObjective(def.objective, region.subtitle);
    this.ui.showHud();
    this.mode = 'playing';
    this.ui.chapterCard(def);
    this.autosave(true);
    after?.();
  }

  private moodFor(regionId: string): 'shore' | 'snow' | 'desert' | 'bamboo' | 'crown' {
    switch (regionId) {
      case 'shore': return 'shore';
      case 'bell_island': return 'shore';
      case 'snow': return 'snow';
      case 'desert': return 'desert';
      case 'bamboo': return 'bamboo';
      case 'crown': return 'crown';
      default: return 'shore';
    }
  }

  private spawnEnemies(regionId: string, chapter: number): void {
    const region = REGIONS[regionId];
    const ctx = this.enemyContext();
    for (const spawn of region.enemies) {
      if (spawn.chapter !== undefined && spawn.chapter > chapter) continue;
      const def = ALL_ENEMIES[spawn.enemy];
      if (!def || def.isBoss) continue;
      const count = spawn.count ?? 1;
      const radius = spawn.radius ?? 4;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = radius > 0 ? Math.random() * radius : 0;
        const x = spawn.x + Math.sin(a) * r;
        const z = spawn.z + Math.cos(a) * r;
        if (!this.terrain.inBounds(x, z, 6)) continue;
        const enemy = new Enemy(ctx, def, x, z, Math.random() * Math.PI * 2);
        if (spawn.patrol) enemy.faceTowards(this.player.position.x, this.player.position.z, 0.1);
        this.enemies.push(enemy);
      }
    }
  }

  private enemyContext(): EnemyContext {
    return {
      scene: this.engine.scene,
      terrain: this.terrain,
      effects: this.effects,
      audio: this.audio,
      events: this.events,
      player: this.player,
      hooks: {
        onDeath: (enemy) => this.onEnemyDeath(enemy),
        onBossPhase: (enemy, index, phase) => {
          this.events.emit('boss:phase', { boss: enemy.def.id, phase: index, name: phase.name });
          this.audio.sfx('boss_roar');
        },
        onBark: (enemy, text) => {
          this.ui.subtitle(enemy.def.name, text, 4.2);
        },
      },
    };
  }

  private resetBossState(): void {
    this.activeBoss = null;
    this.inBossFight = false;
    this.lockTarget = null;
    this.player?.setArena(null);
    if (this.prevArenaFog) {
      (this.engine.scene.fog as THREE.FogExp2).color.set(this.prevArenaFog);
      this.prevArenaFog = null;
    }
    this.ui.bossBar(null);
  }

  private disposeWorld(): void {
    for (const enemy of this.enemies) enemy.dispose();
    this.enemies = [];
    this.effects?.projectiles.forEach((_, i) => this.effects.removeProjectile(i));
    this.effects?.hazards.forEach((_, i) => this.effects.removeHazard(i));
    this.world?.dispose(this.engine.scene);
    this.weather?.dispose();
    if (this.terrain) {
      this.engine.scene.remove(this.terrain.mesh);
      this.terrain.mesh.geometry.dispose();
      (this.terrain.mesh.material as THREE.Material).dispose();
    }
    this.resetBossState();
  }

  /* ── Rewards & progression ───────────────────────────────────────────── */

  private grantQuestRewards(quest: (typeof ALL_QUESTS)[string], reward: { xp?: number; essence?: number; skillPoints?: number; items?: { id: string; count: number }[] }): void {
    if (reward.xp) this.player.addXp(reward.xp);
    if (reward.essence) this.player.gainEssence(reward.essence);
    if (reward.skillPoints) this.save.stats.skillPoints += reward.skillPoints;
    if (reward.items) {
      for (const item of reward.items) {
        this.save.inventory[item.id] = (this.save.inventory[item.id] ?? 0) + item.count;
      }
    }
    if (quest.id === 'mq_prologue') {
      this.onChapterStoryGate(0);
    }
  }

  private onChapterStoryGate(chapter: number): void {
    if (chapter !== this.save.chapter) return;
    if (chapter === 0) {
      this.advanceChapter(0);
    }
  }

  private onEnemyDeath(enemy: Enemy): void {
    const def = enemy.def;
    this.save.kills += 1;
    this.quests.onEnemyKilled(def.id, !!def.isBoss);
    if (def.isBoss) {
      this.save.flags[`boss_${def.id}`] = true;
      this.save.bossMemory.push(def.id);
      this.onBossDefeated(enemy);
    }
    this.events.emit('enemy:death', {
      id: def.id,
      kind: def.kind,
      position: { x: enemy.position.x, y: enemy.position.y, z: enemy.position.z },
      boss: !!def.isBoss,
    });
    this.autosave(true);
  }

  private onBossDefeated(enemy: Enemy): void {
    const def = enemy.def;
    const chapterDef = CHAPTERS[this.save.chapter];
    if (chapterDef?.boss === def.id) {
      this.audio.sfx('shrine');
      this.ui.bossBar(null);
      const outro = chapterDef.outro ? CINEMATICS[chapterDef.outro] : null;
      const advance = (): void => this.advanceChapter(this.save.chapter);
      if (outro) {
        this.playCinematic(outro, advance);
      } else {
        window.setTimeout(advance, 600);
      }
    }
  }

  private advanceChapter(fromChapter: number): void {
    const completed = CHAPTERS[fromChapter];
    if (completed) {
      if (completed.completeFlags) {
        for (const [flag, value] of Object.entries(completed.completeFlags)) this.save.flags[flag] = value;
      }
      if (completed.rewards) this.grantQuestRewards({ id: completed.id } as never, completed.rewards);
    }
    const next = fromChapter + 1;
    const def = CHAPTERS[next];
    if (!def) {
      this.finishGame();
      return;
    }
    this.chapterQueued = next;
  }

  private loadQueuedChapter(): void {
    if (this.chapterQueued < 0) return;
    const idx = this.chapterQueued;
    this.chapterQueued = -1;
    const def = CHAPTERS[idx];
    this.loadChapter(idx, def.spawn);
    this.ui.hideLetterbox();
  }

  private finishGame(): void {
    this.save.flags['nameless_clear'] = this.settings.difficulty === 'nameless' ? true : this.save.flags['nameless_clear'];
    this.mode = 'cinematic';
    const chapterDef = CHAPTERS[10];
    const endingCine = chapterDef.outro ? CINEMATICS[chapterDef.outro] : null;
    const openChoice = (): void => {
      this.openEndingChoice();
    };
    if (endingCine) this.playCinematic(endingCine, openChoice);
    else openChoice();
  }

  private openEndingChoice(): void {
    this.quests.recomputeTrueEnding();
    const tree = DIALOGUE.ending_choice;
    if (tree) {
      this.openDialogue(tree);
    }
  }

  private applyEndingChoice(): void {
    const choice = String(this.save.flags['ending_choice'] ?? 'speak');
    const ending = ENDINGS[choice] ?? pickEnding(this.save.flags);
    this.save.ending = ending.id;
    for (const [flag, value] of Object.entries(ending.flags)) this.save.flags[flag] = value;
    this.audio.setMood('ending');
    this.mode = 'ending';
    this.ui.showEnding(ending, this.save.chapter >= 10);
    this.autosave(true);
  }

  beginNewGamePlus(): void {
    const base = this.save;
    const next = createNewSave(1);
    next.newGamePlus = base.newGamePlus + 1;
    next.unlockedWeapons = [...base.unlockedWeapons];
    next.weapon = base.weapon;
    next.equippedArt = base.equippedArt;
    next.skills = { ...base.skills };
    next.codex = [...base.codex];
    next.achievements = [...base.achievements];
    next.flags['ng_plus_started'] = true;
    next.flags['true_ending_unlocked'] = base.flags['true_ending_unlocked'];
    next.stats.essence = base.stats.essence;
    next.stats.skillPoints = Math.max(1, base.stats.skillPoints);
    this.save = next;
    this.runIntro();
  }

  /* ── Boss triggers ───────────────────────────────────────────────────── */

  private checkBossTriggers(): void {
    if (this.inBossFight || this.activeBoss) return;
    const chapter = this.save.chapter;
    const arena = this.world.checkArenaTriggers(this.player.position.x, this.player.position.z);
    if (!arena) return;
    if (arena.chapter !== chapter) return;
    if (this.save.flags[`boss_${arena.boss}`]) return;
    const def = BOSSES[arena.boss];
    if (!def) return;

    const cx = arena.x + (this.player.position.x - arena.x) * 0.1;
    const cz = arena.z + (this.player.position.z - arena.z) * 0.1;
    const boss = new Enemy(this.enemyContext(), def, cx, cz, Math.atan2(this.player.position.x - cx, this.player.position.z - cz));
    boss.setArena({ x: arena.x, z: arena.z, r: arena.radius - 2 });
    this.player.setArena({ x: arena.x, z: arena.z, r: arena.radius - 1 });
    this.enemies.push(boss);
    this.activeBoss = boss;
    this.inBossFight = true;
    this.player.setLockTarget(boss.headPosition());
    this.lockTarget = boss;

    if (arena.fogColor) {
      this.prevArenaFog = this.engine.scene.fog instanceof THREE.FogExp2 ? this.engine.scene.fog.color.getStyle() : '#102a34';
      (this.engine.scene.fog as THREE.FogExp2).color.set(arena.fogColor);
    }
    if (def.music) this.audio.setMood('boss', def.music);
    else this.audio.setMood('boss');
    this.ui.bossBar(boss.snapshot());
    this.audio.sfx('boss_roar');
    this.events.emit('boss:start', { boss: def });
  }

  private updateBoss(dt: number): void {
    const boss = this.activeBoss;
    if (!boss) return;
    this.bossTimer -= dt;
    if (this.bossTimer <= 0) {
      this.bossTimer = BOSS_BAR_REFRESH;
      if (!boss.dead) this.ui.bossBar(boss.snapshot());
    }
    const intensity = 1 - boss.healthFraction * 0.45;
    this.audio.setBossIntensity(intensity);
    if (boss.dead && boss.removed) {
      this.ui.bossBar(null);
      this.activeBoss = null;
      this.inBossFight = false;
      this.lockTarget = null;
      this.player.setLockTarget(null);
      this.player.setArena(null);
      if (this.prevArenaFog) {
        (this.engine.scene.fog as THREE.FogExp2).color.set(this.prevArenaFog);
        this.prevArenaFog = null;
      }
      this.audio.setMood(this.moodFor(this.save.region));
    }
  }

  /* ── Combat loop helpers ─────────────────────────────────────────────── */

  private updatePlayerCombat(): void {
    const p = this.player;
    if (!p.activeAttack) {
      this.slashArcDone = false;
      return;
    }
    if (!p.activeHitWindow) return;
    const move = p.activeAttack.move;
    const range = p.weapon.range + 1.1;
    // One sword-arc flash per attack (not per frame).
    if (!this.slashArcDone) {
      this.slashArcDone = true;
      this.effects.slashArc(
        { x: p.position.x, y: p.position.y + 1.05, z: p.position.z },
        p.attackFacing,
        p.weapon.range + 0.6,
        move.arc,
        p.weapon.colors.glow,
      );
    }
    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.removed) continue;
      if (!this.player.canHit(enemy.id)) continue;
      const dx = enemy.position.x - this.player.position.x;
      const dz = enemy.position.z - this.player.position.z;
      const d = Math.hypot(dx, dz);
      if (d > range) continue;
      const facing = Math.atan2(dx, dz);
      let angleDiff = facing - this.player.attackFacing;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      if (Math.abs(angleDiff) > move.arc / 2 + 0.25) continue;

      const toAttacker = Math.atan2(this.player.position.x - enemy.position.x, this.player.position.z - enemy.position.z);
      const backstab = Math.abs(angleDeltaSafe(enemy.yaw, toAttacker)) > 2.4;
      const hit = {
        attacker: 'player' as const,
        damage: move.damage * this.player.attackMultiplier,
        posture: move.posture * this.player.postureMultiplier,
        damageType: move.damageType ?? 'physical',
        status: move.status,
        knockback: move.knockback,
        hitstop: move.hitstop,
        critical: backstab,
        backstab,
        sourceId: 'player',
        position: { x: enemy.position.x, y: enemy.position.y + 1, z: enemy.position.z },
      };
      const result = enemy.receiveHit(hit, this.player.position);
      this.player.markHit(enemy.id);
      if (!result.blocked && !result.parried) {
        this.player.gainFlow(7);
        this.player.gainResolve(0.12);
        this.events.emit('enemy:damage', {
          id: enemy.id,
          amount: result.damage,
          position: { x: enemy.position.x, y: enemy.position.y + 1.6, z: enemy.position.z },
          critical: result.critical,
        });
      }
    }
  }

  private updateProjectilesAndHazards(dt: number): void {
    const p = this.player;
    for (let i = this.effects.projectiles.length - 1; i >= 0; i--) {
      const proj = this.effects.projectiles[i];
      if (proj.owner !== 'enemy') continue;
      const d = Math.hypot(p.position.x - proj.position.x, p.position.z - proj.position.z);
      if (d < proj.radius + 0.7) {
        const hit = {
          attacker: 'enemy' as const,
          damage: proj.damage,
          posture: 14,
          damageType: (proj.damageType as 'physical') ?? 'physical',
          knockback: 2,
          hitstop: 0.04,
          sourceId: proj.sourceId,
          position: { x: proj.position.x, y: proj.position.y, z: proj.position.z },
        };
        p.takeHit(hit, proj.position);
        this.effects.removeProjectile(i);
      }
    }
    for (const hazard of this.effects.hazards) {
      if (hazard.sourceId === 'player') continue;
      const d = Math.hypot(p.position.x - hazard.position.x, p.position.z - hazard.position.z);
      if (d < hazard.radius + 0.5) {
        const hit = {
          attacker: 'hazard' as const,
          damage: hazard.dps * dt * 1.4,
          posture: 0,
          damageType: (hazard.damageType as 'fire') ?? 'fire',
          knockback: 0,
          hitstop: 0,
          sourceId: hazard.sourceId,
          position: { x: hazard.position.x, y: hazard.position.y, z: hazard.position.z },
        };
        p.takeHit(hit, hazard.position);
      }
    }
  }

  private updateDeathblow(): void {
    if (!this.input.wasPressed('light') && !this.input.wasPressed('confirm')) return;
    for (const enemy of this.enemies) {
      if (!enemy.canDeathblow) continue;
      const d = Math.hypot(enemy.position.x - this.player.position.x, enemy.position.z - this.player.position.z);
      if (d > 3.2) continue;
      this.player.playDeathblowPose();
      enemy.deathblow(this.player.position);
      this.player.gainResolve(this.player.skillRank('spirit_siphon') > 0 ? 1 : 0.5);
      this.player.gainFlow(18);
      this.events.emit('player:deathblow', { target: enemy.id });
      return;
    }
  }

  /**
   * Feed the sword-trail ribbon. Without bone transforms, we synthesize the
   * blade edge from the attack timeline: a sweep arc across the move's arc,
   * with a slight vertical rise during the swing. Outside attacks the ribbon
   * fades out.
   */
  private updateWeaponTrail(): void {
    const p = this.player;
    const inactive = new THREE.Vector3(p.position.x, p.position.y + 1.3, p.position.z);
    if (!p.activeAttack) {
      this.effects.updateTrail(inactive, inactive, false);
      this.swingFanActive = false;
      return;
    }
    const move = p.activeAttack.move;
    const total = p.activeAttack.total;
    const t = Math.min(1, p.activeAttack.elapsed / total);
    const windup = move.windup / total;
    const active = move.active / total;
    const swing = Math.min(1, Math.max(0, (t - windup) / Math.max(0.0001, active)));
    const ease = swing * swing * (3 - 2 * swing);
    // The whole swing carries the ribbon: windup gathers, strike extends,
    // recovery lets it fade.
    const reachFactor = t < windup ? 0.3 + 0.4 * (t / Math.max(0.0001, windup)) : 0.7 + 0.3 * ease;
    const angle = (ease - 0.5) * move.arc * 0.9;
    const yaw = p.attackFacing + angle;
    const reach = (p.weapon.range + 0.45) * reachFactor;
    // Diagonal cut: the blade rises then falls through the arc in screen space.
    const lift = Math.sin(swing * Math.PI) * 0.85 + (ease - 0.5) * 0.7;
    const tip = new THREE.Vector3(
      p.position.x + Math.sin(yaw) * reach,
      p.position.y + 1.35 + lift,
      p.position.z + Math.cos(yaw) * reach,
    );
    const base = new THREE.Vector3(
      p.position.x + Math.sin(yaw) * 0.75,
      p.position.y + 1.42,
      p.position.z + Math.cos(yaw) * 0.75,
    );
    this.effects.updateTrail(tip, base, true, p.weapon.colors.glow);
    if (t >= 1) this.swingFanActive = false;

    // Ghost afterimages along the swept arc — warm gold, tall slivers that
    // stay legible even against bright ambient particles.
    this.trailGhostTimer -= 0.016;
    if (this.trailGhostTimer <= 0 && t > windup - 0.06 && t < windup + active + 0.3) {
      this.trailGhostTimer = 0.035;
      const ghosts = 6;
      for (let i = 0; i < ghosts; i++) {
        const g = i / Math.max(1, ghosts - 1);
        const gT = 1 - g;
        const gAngle = (gT - 0.5) * move.arc * 0.9;
        const gYaw = p.attackFacing + gAngle;
        const gReach = (p.weapon.range + 0.5) * (0.5 + 0.5 * gT);
        const gLift = Math.sin(gT * Math.PI) * 0.85 + (gT - 0.5) * 0.7;
        this.effects.afterImage(
          { x: p.position.x, y: p.position.y + 1.38 + gLift * 0.6, z: p.position.z },
          gYaw,
          gReach,
          '#ffc46a',
          0.42 * (1 - g) * (ease * 0.65 + 0.35),
          gLift * 0.6,
        );
      }
    }
  }

  /* ── Interaction / shrine ────────────────────────────────────────────── */

  private updateInteraction(): void {
    const it = this.world.nearestInteraction(this.player.position.x, this.player.position.z);
    if (it) {
      this.ui.prompt(this.promptLabel(it), this.promptKey(it), true);
      if (this.input.wasPressed('interact') && !this.player.isBusy) {
        this.activateInteraction(it);
      }
    } else {
      this.ui.prompt('', '', false);
    }
  }

  private promptLabel(it: { kind: string; label: string }): string {
    switch (it.kind) {
      case 'npc': return `Talk to ${it.label}`;
      case 'shrine': return `Rest at ${it.label}`;
      case 'collectible': return `Take ${it.label}`;
      case 'secret': return `Investigate: ${it.label}`;
      case 'grapple': return 'Grapple';
      default: return it.label;
    }
  }

  private promptKey(it: { kind: string }): string {
    return it.kind === 'grapple' ? 'G' : 'E';
  }

  private activateInteraction(it: { kind: string; id: string; data?: unknown }): void {
    switch (it.kind) {
      case 'npc': {
        const npc = (it.data as { def: { dialogue: string } }).def;
        const tree = this.getDialogueTree(npc.dialogue);
        if (tree) {
          this.quests.onTalk(it.id);
          this.openDialogue(tree);
        }
        break;
      }
      case 'shrine': {
        this.restAtShrine(it.id);
        break;
      }
      case 'collectible': {
        this.takeCollectible(it.id);
        break;
      }
      case 'secret': {
        this.takeSecret(it.id);
        break;
      }
      case 'grapple': {
        const gp = it.data as { position: THREE.Vector3 };
        this.player.startGrapple(gp.position, this.terrain);
        break;
      }
    }
  }

  private takeCollectible(id: string): void {
    const picked = this.world.takeCollectible(id);
    if (!picked) return;
    this.save.flags[`collectible_${id}`] = true;
    this.audio.sfx('pickup');
    switch (picked.kind) {
      case 'memory': {
        this.quests.onCollect('memory_fragment');
        if (picked.codex) this.unlockCodex(picked.codex, picked.name);
        this.events.emit('ui:toast', { title: picked.name, text: 'A memory, recovered.', kind: 'lore', duration: 2400 });
        break;
      }
      case 'lore': {
        if (picked.codex) this.unlockCodex(picked.codex, picked.name);
        this.events.emit('ui:toast', { title: picked.name, text: 'Codex entry added.', kind: 'lore', duration: 2400 });
        break;
      }
      case 'item': {
        if (picked.item) {
          this.save.inventory[picked.item] = (this.save.inventory[picked.item] ?? 0) + (picked.amount ?? 1);
        }
        break;
      }
      case 'seed': {
        this.save.inventory['shrine_seed'] = (this.save.inventory['shrine_seed'] ?? 0) + 1;
        break;
      }
      case 'essence': {
        this.player.gainEssence(picked.amount ?? 25);
        break;
      }
    }
    this.autosave(true);
  }

  private takeSecret(id: string): void {
    const found = this.world.takeSecret(id);
    if (!found) return;
    this.save.flags[found.def.flag] = true;
    this.audio.sfx('bell');
    this.events.emit('ui:toast', { title: found.def.name, text: found.def.description, kind: 'item', duration: 3200 });
    const r = found.reward;
    if (r?.item) this.save.inventory[r.item] = (this.save.inventory[r.item] ?? 0) + (r.count ?? 1);
    if (r?.essence) this.player.gainEssence(r.essence);
    if (r?.xp) this.player.addXp(r.xp);
    this.quests.onReach(id);
    this.autosave(true);
  }

  private restAtShrine(id: string): void {
    const shrine = this.world.shrines.find((s) => s.id === id);
    if (!shrine) return;
    if (!this.save.discoveredShrines.includes(id)) {
      this.save.discoveredShrines.push(id);
      this.audio.sfx('shrine');
    }
    this.checkpoint = { shrine: id, x: shrine.position.x, z: shrine.position.z };
    this.ui.showShrine(shrine, this.shrineTravelTargets());
  }

  private shrineTravelTargets(): Array<{ id: string; name: string; region: string; chapter: number }> {
    const out: Array<{ id: string; name: string; region: string; chapter: number }> = [];
    for (const region of Object.values(REGIONS)) {
      for (const shrine of region.shrines) {
        if (!this.save.discoveredShrines.includes(shrine.id)) continue;
        out.push({ id: shrine.id, name: shrine.name, region: region.name, chapter: shrine.chapter });
      }
    }
    return out;
  }

  doRest(): void {
    this.player.rest();
    this.save.checkpoint = { region: this.save.region, shrine: this.checkpoint.shrine, x: this.checkpoint.x, z: this.checkpoint.z };
    this.autosave(true);
    this.ui.toast('Restored', 'Health, gourds and Resolve restored.', 'item', 'torii', 2200);
  }

  travelToShrine(id: string): void {
    for (const region of Object.values(REGIONS)) {
      const shrine = region.shrines.find((s) => s.id === id);
      if (!shrine) continue;
      const target = REGIONS[region.id];
      const spawn = target.spawns.find((s) => s.id === `travel_${id}`) ?? {
        id: `travel_${id}`,
        name: shrine.name,
        x: shrine.x,
        z: shrine.z,
        rot: Math.PI,
      };
      void spawn;
      this.player.teleport(shrine.x, shrine.z, Math.PI, this.terrain);
      this.checkpoint = { shrine: id, x: shrine.x, z: shrine.z };
      this.save.checkpoint = { region: region.id, shrine: id, x: shrine.x, z: shrine.z };
      this.audio.sfx('shrine');
      this.autosave(true);
      return;
    }
  }

  /* ── Codex / achievements / consumables ──────────────────────────────── */

  private unlockCodex(id: string, name?: string): void {
    if (!CODEX[id]) return;
    if (this.save.codex.includes(id)) return;
    this.save.codex.push(id);
    this.events.emit('ui:toast', { title: `Codex: ${name ?? ''}`, text: CODEX[id].title, kind: 'lore', duration: 2600 });
    this.evaluateAchievements();
  }

  tryConsumeItem(id: string): void {
    const used = this.player.consumeItem(id);
    if (used) this.ui.toast(ITEMS[id]?.name ?? id, 'Used.', 'item', 'hand', 1400);
    else this.ui.toast('Nothing to use', ITEMS[id] ? 'You have none left.' : 'Unknown item.', 'warning', undefined, 1400);
  }

  cycleConsumable(): void {
    const order = Object.keys(ITEMS).filter((id) => ['heal', 'attack', 'smoke', 'health', 'posture'].includes(ITEMS[id]?.effect ?? ''));
    const idx = order.indexOf(this.consumable);
    this.consumable = order[(idx + 1) % order.length] ?? 'incense';
    this.save.flags['equipped_item'] = this.consumable;
    this.ui.toast('Item', ITEMS[this.consumable]?.name ?? '', 'item', 'hand', 1200);
  }

  get equippedConsumable(): string {
    return String(this.save.flags['equipped_item'] ?? this.consumable);
  }

  evaluateAchievements(): void {
    for (const ach of ACHIEVEMENTS) {
      if (this.save.achievements.includes(ach.id)) continue;
      if (this.achievementMet(ach)) {
        this.save.achievements.push(ach.id);
        this.audio.sfx('level');
        this.events.emit('ui:achievement', { achievement: ach });
      }
    }
  }

  private achievementMet(ach: (typeof ACHIEVEMENTS)[number]): boolean {
    const c = ach.condition;
    switch (c.type) {
      case 'flag':
        return Boolean(this.save.flags[c.target]);
      case 'boss':
        return Boolean(this.save.flags[`boss_${c.target}`]);
      case 'chapter':
        return this.save.chapter >= Number(c.target);
      case 'ending':
        return this.save.ending === c.target;
      case 'collect': {
        let value = 0;
        if (c.target === 'codex') value = this.save.codex.length;
        else if (c.target === 'shrines') value = this.save.discoveredShrines.length;
        else if (c.target === 'secrets') value = Object.keys(this.save.flags).filter((f) => f.startsWith('secret_') && this.save.flags[f]).length;
        return value >= (c.count ?? 1);
      }
      case 'quest': {
        const n = c.target === 'main' ? this.quests.completedMainCount() : this.quests.completedSideCount();
        return n >= (c.count ?? 1);
      }
      case 'parry':
        return this.save.parries >= (c.count ?? 1);
      case 'deaths':
        return this.save.deaths >= (c.count ?? 1);
      default:
        return false;
    }
  }

  /* ── Dialogue ────────────────────────────────────────────────────────── */

  private getDialogueTree(id: string): DialogueTree | null {
    return getDialogue(id) ?? null;
  }

  openDialogue(tree: DialogueTree, npcId?: string): void {
    if (this.mode === 'dialogue' || this.mode === 'cinematic') return;
    this.mode = 'dialogue';
    this.audio.duck(true);
    this.input.clear();
    let nodeId = tree.start;
    if (tree.startByFlag) {
      for (const rule of tree.startByFlag) {
        if (this.save.flags[rule.flag]) {
          nodeId = rule.node;
          break;
        }
      }
    }
    const node = tree.nodes[nodeId] ?? tree.nodes[tree.fallback ?? tree.start];
    if (!node) {
      this.closeDialogue();
      return;
    }
    this.dialogue = { tree, node: node.id, queue: [], timer: 0, npcId };
    this.events.emit('dialogue:start', { tree });
    this.ui.dialogueOpen(tree.id);
    this.enqueueDialogueNode(node);
    this.applyDialogueFraming(node.camera, npcId);
  }

  private enqueueDialogueNode(node: DialogueNode): void {
    if (!this.dialogue) return;
    this.dialogue.timer = 0;
    this.dialogue.queue = node.lines.map((l) => ({
      speaker: l.speaker,
      text: l.text,
      duration: Math.max(1.6, Math.min(5, 2.1 + l.text.length * 0.034)),
    }));
    if (node.effects) this.applyEffects(node.effects);
    if (node.choices && node.choices.length) {
      this.dialogue.choiceEffects = node.choices;
      this.ui.dialogueChoices(node.choices.filter((ch) => !ch.requiresFlag || this.save.flags[ch.requiresFlag]));
    }
    this.dialogue.nextNode = node.next;
    this.dialogue.endNode = node.end;
  }

  private applyEffects(effects: DialogueEffect[]): void {
    for (const fx of effects) {
      switch (fx.type) {
        case 'flag':
          if (fx.id) {
            this.save.flags[fx.id] = (fx.value ?? true) as never;
            this.quests.onFlagChanged(fx.id);
          }
          break;
        case 'quest': {
          if (!fx.id) break;
          if (fx.value === 'complete') this.quests.forceComplete(fx.id);
          else this.quests.start(fx.id);
          break;
        }
        case 'item': {
          if (fx.id) {
            const count = typeof fx.value === 'number' ? fx.value : 1;
            this.save.inventory[fx.id] = (this.save.inventory[fx.id] ?? 0) + count;
          }
          break;
        }
        case 'essence':
          this.player.gainEssence(typeof fx.value === 'number' ? fx.value : 50);
          break;
        case 'xp':
          this.player.addXp(typeof fx.value === 'number' ? fx.value : 60);
          break;
        case 'unlock': {
          if (fx.id && typeof fx.id === 'string' && WEAPONS[fx.id]) this.player.unlockWeapon(fx.id);
          break;
        }
        case 'heal':
          this.player.rest();
          break;
        case 'codex':
          if (fx.id) this.unlockCodex(fx.id);
          break;
        case 'ending':
          this.applyEndingChoice();
          break;
        default:
          break;
      }
    }
    this.evaluateAchievements();
  }

  private completeQuestIfRunning(id: string): void {
    const st = this.save.quests[id];
    const def = ALL_QUESTS[id];
    if (!st || !def) return;
    if (st.status === 'active') {
      this.quests.forceComplete(id);
    }
  }

  private updateDialogue(dt: number): void {
    const d = this.dialogue;
    if (!d) return;
    d.timer -= dt;
    if (d.queue.length > 0 && d.timer <= 0) {
      const line = d.queue.shift()!;
      this.ui.subtitle(line.speaker, line.text, line.duration);
      this.ui.dialogueLine(line.speaker, line.text);
      d.timer = line.duration;
    } else if (d.queue.length === 0) {
      if (d.choiceEffects?.length) {
        // Waiting on the player to pick.
        return;
      }
      if (d.nextNode) {
        const node = d.tree.nodes[d.nextNode];
        if (node) {
          d.node = node.id;
          this.enqueueDialogueNode(node);
          return;
        }
      }
      if (d.endNode) {
        this.closeDialogue();
      }
    }
  }

  onDialogueChoice(index: number): void {
    const d = this.dialogue;
    if (!d) return;
    const choice = d.choiceEffects?.[index];
    if (!choice) return;
    d.choiceEffects = undefined;
    this.ui.dialogueChoices([]);
    if (choice.effects) this.applyEffects(choice.effects);
    if (choice.next) {
      const node = d.tree.nodes[choice.next];
      if (node) {
        d.node = node.id;
        this.enqueueDialogueNode(node);
      }
    }
  }

  private closeDialogue(): void {
    if (!this.dialogue) return;
    const tree = this.dialogue.tree;
    this.dialogue = null;
    this.ui.dialogueClose();
    this.ui.subtitle('', '', 0);
    this.audio.duck(false);
    this.camera.clearCinematic();
    this.events.emit('dialogue:end', { tree });
    if (this.mode === 'dialogue') this.mode = 'playing';
    this.autosave(true);
  }

  private applyDialogueFraming(camera?: 'close' | 'wide' | 'over_shoulder', npcId?: string): void {
    const focus = this.world?.npcs.find((n) => n.id === npcId) ?? this.world?.npcs[0];
    if (focus && camera) {
      const p = focus.position;
      const pl = this.player.position;
      // Two-shot: frame the midpoint between player and speaker, placed off
      // to the side so both figures keep separate silhouettes.
      const mx = (pl.x + p.x) / 2;
      const mz = (pl.z + p.z) / 2;
      const my = (pl.y + p.y) / 2;
      let dx = p.x - pl.x;
      let dz = p.z - pl.z;
      const len = Math.hypot(dx, dz) || 1;
      dx /= len;
      dz /= len;
      const px = -dz;
      const pz = dx;
      const back = camera === 'wide' ? 3.4 : camera === 'close' ? 1.9 : 1.5;
      const side = camera === 'wide' ? 1.5 : camera === 'close' ? 2.0 : 2.1;
      const sep = Math.max(1.3, len);
      this.camera.playCinematic(
        { x: mx + px * side + dx * Math.min(2.8, sep * 1.25), y: my + 1.7, z: mz + pz * side + dz * Math.min(2.8, sep * 1.25) },
        { x: mx, y: my + 1.2, z: mz },
        2.4,
      );
    } else if (camera) {
      this.camera.playCinematic(
        { x: this.player.position.x + 2.6, y: this.player.position.y + 1.7, z: this.player.position.z + 2.6 },
        { x: this.player.position.x, y: this.player.position.y + 1.4, z: this.player.position.z },
        2.2,
      );
    }
  }

  /* ── Cinematics ──────────────────────────────────────────────────────── */

  playCinematic(def: (typeof CINEMATICS)[string], onEnd: () => void): void {
    const prevMode = this.mode;
    this.mode = 'cinematic';
    this.input.clear();
    this.ui.letterbox(true);
    this.camera.clearCinematic();
    if (def.music) this.audio.setMood(def.music.mood, def.music);
    else this.audio.duck(true);
    this.cinematic = {
      def,
      t: 0,
      steps: def.steps.map((_, i) => ({ index: i, done: false })),
      onEnd: () => {
        this.cinematic = null;
        this.ui.letterbox(false);
        this.ui.hideCinematicTitle();
        this.audio.duck(false);
        if (prevMode === 'dialogue' || prevMode === 'playing') this.mode = 'playing';
        onEnd();
      },
    };
  }

  private updateCinematic(dt: number): void {
    const c = this.cinematic;
    if (!c) return;
    c.t += dt;
    for (const step of c.steps) {
      if (step.done) continue;
      const s = c.def.steps[step.index];
      if (c.t < s.at) continue;
      step.done = true;
      switch (s.kind) {
        case 'camera':
          if (s.from && s.to) {
            this.camera.playCinematic({ x: s.from.x, y: s.from.y, z: s.from.z }, { x: s.to.x, y: s.to.y, z: s.to.z }, s.transition === 'cut' ? 30 : 2.2);
          }
          break;
        case 'line':
          this.ui.subtitle(s.speaker ?? '', s.text ?? '', s.duration ?? 4);
          break;
        case 'title':
          this.ui.cinematicTitle(s.text ?? '');
          break;
        case 'fade':
          this.ui.fadeOverlay(typeof s.value === 'number' ? s.value : 0, s.transition === 'cut' ? 0.01 : (s.duration ?? 0.8));
          break;
        case 'shake':
          this.camera.shake(typeof s.value === 'number' ? s.value : 0.5, s.duration ?? 0.3);
          break;
        case 'flag':
          if (s.id) this.save.flags[s.id] = (s.value ?? true) as never;
          break;
        case 'music':
          this.audio.setMood((s.value as 'shore') ?? 'shore');
          break;
        case 'wait':
          break;
        case 'choice':
          break;
      }
    }
    if (c.t >= c.def.duration) {
      const end = c.onEnd;
      c.onEnd = () => undefined;
      end();
    }
  }

  skipCinematic(): void {
    if (!this.cinematic) return;
    const c = this.cinematic;
    c.t = c.def.duration;
  }

  /* ── Death & respawn ─────────────────────────────────────────────────── */

  private updateDeath(dt: number): void {
    if (!this.player.dead) return;
    this.deathTimer += dt;
    if (this.deathTimer > 0.9 && this.mode === 'playing') {
      this.mode = 'dead';
      this.ui.showDeath();
      this.audio.duck(true);
    }
  }

  respawn(): void {
    this.mode = 'playing';
    this.ui.hideDeath();
    this.audio.duck(false);
    this.deathTimer = 0;
    const loss = Math.round(this.save.stats.essence * 0.12);
    this.save.stats.essence -= loss;
    const shrine = this.world.shrines.find((s) => s.id === this.checkpoint.shrine);
    if (shrine) {
      this.player.teleport(shrine.position.x, shrine.position.z, Math.PI, this.terrain);
    } else {
      const spawnPoint = this.world.region.spawns.find((s) => s.id === this.save.spawn) ?? this.world.region.spawns[0];
      this.player.teleport(spawnPoint.x, spawnPoint.z, spawnPoint.rot, this.terrain);
    }
    this.player.respawn(this.terrain);
    this.events.emit('game:respawn', { shrine: this.checkpoint.shrine });
    if (loss > 0) this.ui.toast('Death', `${loss} Essence lost.`, 'warning', 'skull', 2200);
    this.autosave(true);
  }

  /* ── Save ────────────────────────────────────────────────────────────── */

  autosave(auto = false): void {
    if (!this.save) return;
    this.save.chapter = this.save.chapter;
    this.save.playtime += 0;
    this.save.position = { x: this.player?.position.x ?? 0, y: this.player?.position.y ?? 0, z: this.player?.position.z ?? 0 };
    this.save.rotation = this.player?.yaw ?? 0;
    this.save.stats = this.save.stats;
    if (auto) this.saves.save(this.save, 0);
    else this.saves.save(this.save, this.save.slot);
    this.events.emit('game:saved', { slot: auto ? 0 : this.save.slot, auto });
    this.evaluateAchievements();
  }

  saveToSlot(slot: number): void {
    this.autosave(false);
    if (slot !== this.save.slot) {
      this.save.slot = slot;
      this.saves.save(this.save, slot);
    }
    this.ui.toast('Saved', `Slot ${slot}`, 'item', 'scroll', 1800);
  }

  /* ── Pause / settings / photo ────────────────────────────────────────── */

  togglePause(): void {
    if (this.mode === 'playing') {
      this.mode = 'paused';
      this.ui.showPause();
      this.audio.sfx('ui');
    } else if (this.mode === 'paused') {
      this.mode = 'playing';
      this.ui.hidePause();
      this.audio.sfx('ui_confirm');
    }
  }

  applySettings(): void {
    this.input.sensitivity = this.settings.sensitivity;
    this.input.invertY = this.settings.invertY;
    this.engine.applyQuality(this.settings.quality);
    this.engine.setBloom(this.settings.bloom);
    this.audio.applySettings(this.settings);
    this.player?.setSettings(this.settings);
    this.camera.setReducedMotion(this.settings.reduceMotion);
    this.ui.applySettings(this.settings);
  }

  purchaseSkill(id: string): boolean {
    return this.player.purchaseSkill(id);
  }

  equipWeapon(id: string): boolean {
    return this.player.equipWeapon(id);
  }

  togglePhoto(): void {
    if (this.mode === 'photo') {
      this.mode = 'playing';
      this.ui.photoMode(false);
      this.camera.clearCinematic();
      this.input.requestPointerLock();
    } else if (this.mode === 'playing') {
      this.mode = 'photo';
      this.ui.photoMode(true);
      this.input.releasePointerLock();
    }
  }

  captureScreenshot(): string {
    return this.canvas.toDataURL('image/png');
  }

  teleport(x: number, z: number): void {
    this.player.teleport(x, z, this.player.yaw, this.terrain);
  }

  quitToTitle(): void {
    this.autosave(true);
    this.mode = 'title';
    this.ui.showTitle();
    this.audio.setMood('title');
    this.player?.rig?.update(0, 0, { speed: 0 });
  }

  /* ── Main loop ───────────────────────────────────────────────────────── */

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    const dtRaw = this.clock.getDelta();
    const dt = Math.min(0.05, dtRaw) * this.settings.gameSpeed;
    this.elapsed += dt;

    this.frames++;
    this.fpsTimer += dtRaw;
    if (this.fpsTimer >= 0.5) {
      this.fpsValue = this.frames / Math.max(0.001, this.fpsTimer);
      this.frames = 0;
      this.fpsTimer = 0;
    }
    if (this.settings.showFps) this.ui.setFps(this.fpsValue);

    if (this.mode === 'playing' || this.mode === 'dead' || this.mode === 'dialogue' || this.mode === 'photo' || this.mode === 'cinematic') {
      this.updateWorld(dt);
    }
    if (this.mode === 'cinematic') this.updateCinematic(dt);
    if (this.mode === 'dialogue') this.updateDialogue(dt);
    if (this.mode === 'playing') {
      this.updateInputAndPlay(dt);
      this.updateDeath(dt);
    }
    this.ui.tick(dt);
    this.input.endFrame();
    this.engine.render();
  };

  private updateWorld(dt: number): void {
    this.engine.update(dt, this.elapsed);
    this.effects.update(dt);
    if (this.mode === 'playing') this.save.playtime += dt;
    if (this.world) {
      this.world.update(dt, this.elapsed, this.player.position, (x, z) => this.terrain.inBounds(x, z));
      this.weather?.update(dt, this.elapsed, this.player.position);
    }
    this.engine.followSun(this.player.position);
    if (this.player) this.player.rig.update(0, 0, { speed: 0 });
    // Re-apply any queued chapter (e.g., after a fade-out).
    if (this.chapterQueued >= 0 && this.mode === 'playing') this.loadQueuedChapter();
  }

  private updateInputAndPlay(dt: number): void {
    const input = this.input;
    const look = input.consumeLook();
    if (look.x || look.y) this.camera.applyLook(look.x, look.y, this.settings.sensitivity);

    // Global keys.
    if (input.wasPressed('pause')) this.togglePause();
    if (input.wasPressed('photo') && this.mode === 'playing') this.togglePhoto();
    if (input.wasPressed('journal') && this.mode === 'playing') {
      this.mode = 'paused';
      this.ui.showJournal();
    }
    if (input.wasPressed('map') && this.mode === 'playing') {
      this.mode = 'paused';
      this.ui.showMap();
    }
    if (input.wasPressed('skills') && this.mode === 'playing') {
      this.mode = 'paused';
      this.ui.showSkills();
    }
    if (input.wasPressed('codex') && this.mode === 'playing') {
      this.mode = 'paused';
      this.ui.showCodex();
    }
    if (input.wasPressed('item') && this.mode === 'playing') {
      this.tryConsumeItem(this.equippedConsumable);
    }
    if (input.wasPressed('weaponNext') && this.mode === 'playing') this.cycleWeapon(1);
    if (input.wasPressed('weaponPrev') && this.mode === 'playing') this.cycleWeapon(-1);

    if (this.mode !== 'playing') return;

    // Lock-on.
    if (input.wasPressed('lockOn')) {
      if (this.lockTarget && !this.lockTarget.dead) {
        this.lockTarget = null;
        this.player.setLockTarget(null);
        this.camera.setLockTarget(null);
      } else {
        this.acquireLockTarget();
      }
    }

    // Update player.
    this.player.update(dt, input, this.camera, this.terrain);

    // Obstacles.
    const pos = this.player.position;
    this.world.resolveObstacle(pos);
    this.player.group.position.copy(pos);
    this.player.position.copy(pos);

    // Camera.
    const focus = this.lockTarget && !this.lockTarget.dead ? this.lockTarget.headPosition() : null;
    this.camera.setLockTarget(focus);
    this.camera.update(dt, this.player.position, (x, z) => this.terrain.heightAt(x, z), this.player.sprinting, focus);
    this.updateHeroLights();

    // Combat.
    this.updatePlayerCombat();
    this.updateDeathblow();
    this.updateWeaponTrail();

    for (const enemy of this.enemies) {
      if (enemy.removed) continue;
      enemy.update(dt, this.elapsed, this.player.position, this.player.dead);
      enemy.postUpdate(dt);
    }
    this.enemies = this.enemies.filter((e) => !e.removed);
    this.updateBoss(dt);

    this.updateProjectilesAndHazards(dt);
    this.updateInteraction();
    this.checkBossTriggers();

    // UI HUD.
    this.ui.hud(this.save.stats, this.player.weapon, this.save);

    // Autosave heartbeat.
    this.autosaveTimer += dt;
    if (this.autosaveTimer >= AUTOSAVE_INTERVAL) {
      this.autosaveTimer = 0;
      this.autosave(true);
    }
    this.evaluateAchievements();
  }

  private acquireLockTarget(): void {
    let best: Enemy | null = null;
    let bestScore = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.removed) continue;
      const d = Math.hypot(enemy.position.x - this.player.position.x, enemy.position.z - this.player.position.z);
      if (d > 26) continue;
      const dx = enemy.position.x - this.player.position.x;
      const dz = enemy.position.z - this.player.position.z;
      const facing = Math.atan2(dx, dz);
      let diff = facing - this.player.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const angleScore = Math.abs(diff);
      const score = d + angleScore * 14;
      if (score < bestScore) {
        bestScore = score;
        best = enemy;
      }
    }
    if (best) {
      this.lockTarget = best;
      this.player.setLockTarget(best.headPosition());
    }
  }

  private cycleWeapon(dir: number): void {
    const unlocked = this.save.unlockedWeapons.filter((w) => WEAPONS[w]);
    if (unlocked.length < 2) return;
    const idx = unlocked.indexOf(this.save.weapon);
    const next = unlocked[(idx + dir + unlocked.length) % unlocked.length];
    this.player.equipWeapon(next);
    this.audio.sfx('ui_confirm');
  }
}

function angleDeltaSafe(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
