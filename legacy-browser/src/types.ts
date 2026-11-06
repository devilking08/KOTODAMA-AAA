/**
 * KOTODAMA — shared type surface.
 *
 * Content is data-driven: every region, boss, weapon, quest and line of
 * dialogue below is plain data so the engine stays testable and the world can
 * be expanded without touching render code.
 */

export type ID = string;

export type GameMode =
  | 'boot'
  | 'title'
  | 'playing'
  | 'paused'
  | 'dialogue'
  | 'cinematic'
  | 'dead'
  | 'photo'
  | 'ending'
  | 'credits';

export type Difficulty = 'story' | 'warrior' | 'nameless';
export type Quality = 'low' | 'medium' | 'high' | 'ultra';

export interface Vec3Data {
  x: number;
  y: number;
  z: number;
}

export interface SpawnPoint {
  id: string;
  name: string;
  x: number;
  z: number;
  /** Facing angle in radians. */
  rot: number;
  chapter?: number;
}

export type WeatherKind =
  | 'clear'
  | 'storm'
  | 'snow'
  | 'sandstorm'
  | 'rain'
  | 'ash'
  | 'mist'
  | 'night';

export type ParticleKind =
  | 'snow'
  | 'sand'
  | 'rain'
  | 'petal'
  | 'ash'
  | 'spray'
  | 'firefly'
  | 'ember'
  | 'none';

export interface RegionTheme {
  skyTop: string;
  skyHorizon: string;
  sun: string;
  cloud: string;
  fog: string;
  fogDensity: number;
  ambient: string;
  groundLow: string;
  groundMid: string;
  groundHigh: string;
  rock: string;
  water: string;
  waterDeep: string;
  grass: string;
  foliage: string;
  accent: string;
  particle: ParticleKind;
  weather: WeatherKind;
  /** 0–24. Static starting hour; the world clock advances from here. */
  hour: number;
  wind: number;
}

export type MusicMood =
  | 'shore'
  | 'snow'
  | 'desert'
  | 'bamboo'
  | 'crown'
  | 'boss'
  | 'title'
  | 'ending';

export interface MusicTheme {
  mood: MusicMood;
  root: number;
  scale: number[];
  bpm: number;
  intensity?: number;
}

export interface TerrainConfig {
  /** World units from edge to edge. */
  size: number;
  /** Grid resolution. 192–256 is the sweet spot for browser GPUs. */
  segments: number;
  seed: number;
  /** Base rolling amplitude. */
  amplitude: number;
  /** Mountain ridge amplitude. */
  ridges: number;
  /** Large-scale warp. */
  warp: number;
  /** Water level in world units; null means no water. */
  waterLevel: number | null;
  /** Lava level for the final region. */
  lavaLevel: number | null;
  /** Direction the sea / dunes fall toward. */
  falloff: 'north' | 'south' | 'east' | 'west' | 'radial' | 'none';
  /** Extra shaping pass. */
  shape?: 'coast' | 'alpine' | 'dunes' | 'vale' | 'volcano';
  snowLine?: number;
}

export type LandmarkKind =
  | 'shrine'
  | 'torii'
  | 'village'
  | 'house'
  | 'ruin'
  | 'bell'
  | 'bridge'
  | 'arena'
  | 'gate'
  | 'camp'
  | 'oasis'
  | 'garden'
  | 'citadel'
  | 'grave'
  | 'watchtower'
  | 'lantern'
  | 'cave'
  | 'shipwreck'
  | 'bamboo_grove'
  | 'statue';

export interface LandmarkDef {
  id: string;
  kind: LandmarkKind;
  name?: string;
  x: number;
  z: number;
  scale?: number;
  rotation?: number;
  /** Flatten terrain beneath this landmark. */
  flatten?: number;
  /** Height override for the flattened pad. */
  padHeight?: number;
  /** Only visible / active during these chapters (0 = prologue). */
  chapters?: number[];
  /** Interaction radius; 0 disables interaction. */
  interact?: number;
  /** Shrine id if this landmark is a checkpoint. */
  shrine?: string;
  /** Boss arena id if this landmark is an arena. */
  arena?: string;
  /** Extra flavour used by the region builder. */
  variant?: string;
}

export interface ShrineDef {
  id: string;
  name: string;
  region: ID;
  x: number;
  z: number;
  chapter: number;
  description: string;
}

export interface NPCDef {
  id: string;
  name: string;
  title: string;
  region: ID;
  x: number;
  z: number;
  rot?: number;
  chapter: number;
  /** Chapters after which the NPC disappears. */
  untilChapter?: number;
  dialogue: ID;
  quest?: ID;
  silhouette: 'villager' | 'monk' | 'samurai' | 'child' | 'merchant' | 'shrine' | 'noble' | 'fox';
  colors: { robe: string; sash: string; skin: string; hair: string; accent: string };
  essential?: boolean;
  lore?: string;
}

export type EnemyBehavior = 'passive' | 'patrol' | 'guard' | 'aggressive' | 'ambush' | 'ranged' | 'boss';

export type DamageType = 'physical' | 'fire' | 'frost' | 'poison' | 'spirit' | 'sound';

export type StatusKind = 'burn' | 'frostbite' | 'poison' | 'stagger' | 'slow' | 'blind';

export interface AttackMove {
  id: string;
  name: string;
  /** Seconds before the hitbox opens. */
  windup: number;
  /** Seconds the hitbox stays open. */
  active: number;
  /** Seconds of recovery after the active window. */
  recover: number;
  damage: number;
  posture: number;
  range: number;
  /** Full arc in radians. */
  arc: number;
  knockback: number;
  /** Forward movement during windup + active, in units/second. */
  lunge: number;
  hitstop: number;
  damageType?: DamageType;
  status?: { kind: StatusKind; amount: number };
  /** Can be parried by the player. */
  parryable?: boolean;
  /** Unblockable, must be dodged. */
  perilous?: boolean;
  sfx?: string;
  anim?: 'slash' | 'thrust' | 'overhead' | 'spin' | 'kick' | 'slam' | 'cast' | 'stab';
  /** Extra projectile / AOE behaviour. */
  projectile?: ProjectileSpec;
  aoe?: AoeSpec;
  /** Dash toward the target before the active window. */
  dash?: number;
  /** Cooldown in seconds between uses. */
  cooldown?: number;
  /** Follow-up move ids the AI may chain into. */
  chain?: string[];
  /** Readability cue: red = perilous, gold = unblockable sweep. */
  telegraph?: 'none' | 'red' | 'gold';
}

export interface ProjectileSpec {
  speed: number;
  radius: number;
  life: number;
  count?: number;
  spread?: number;
  color?: string;
  homing?: number;
  damageType?: DamageType;
  /** Expanding ring instead of a travelling bolt. */
  ring?: boolean;
  /** Vertical offset from the caster. */
  height?: number;
}

export interface AoeSpec {
  radius: number;
  /** Seconds between telegraph and impact. */
  delay: number;
  color?: string;
  damageType?: DamageType;
  /** Leaves a lingering hazard for N seconds. */
  linger?: number;
  /** Pulls the player toward the center. */
  pull?: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  title?: string;
  kind: 'grunt' | 'archer' | 'brute' | 'assassin' | 'monk' | 'spirit' | 'beast' | 'elite' | 'boss';
  behavior: EnemyBehavior;
  hp: number;
  posture: number;
  damage: number;
  speed: number;
  radius: number;
  height: number;
  xp: number;
  essence: number;
  colors: { robe: string; armor: string; accent: string; skin: string; weapon: string };
  weapon: 'katana' | 'odachi' | 'spear' | 'dual' | 'bow' | 'staff' | 'claws' | 'bell' | 'chains' | 'none';
  scale?: number;
  attacks: AttackMove[];
  guard?: number;
  parryChance?: number;
  detection?: number;
  /** Boss only. */
  isBoss?: boolean;
  phases?: BossPhase[];
  intro?: string;
  outro?: string;
  lore?: string;
  music?: MusicTheme;
  /** Boss arena size. */
  arenaRadius?: number;
  /** Runes / visual motifs. */
  motif?: 'tide' | 'bell' | 'ice' | 'ember' | 'sand' | 'root' | 'twin' | 'mask' | 'bride' | 'crown';
}

export interface BossPhase {
  /** Health fraction at which this phase begins. */
  threshold: number;
  name: string;
  /** Lines barked when the phase begins. */
  line?: string;
  moves: string[];
  speedMultiplier?: number;
  damageMultiplier?: number;
  /** Adds a persistent aura / hazard. */
  aura?: 'fire' | 'frost' | 'poison' | 'sound' | 'sand' | 'none';
  /** Changes arena visuals. */
  arena?: 'none' | 'storm' | 'blizzard' | 'sandstorm' | 'inferno' | 'bloom' | 'void';
}

export interface WeaponDef {
  id: string;
  name: string;
  kanji: string;
  description: string;
  damage: number;
  speed: number;
  range: number;
  posture: number;
  /** Combo chain of attack move ids. */
  combo: string[];
  heavy: string;
  art: string;
  model: 'katana' | 'odachi' | 'spear' | 'dual' | 'greatsword';
  colors: { blade: string; hilt: string; wrap: string; glow: string };
  unlockFlag: string;
  lore: string;
}

export interface SkillDef {
  id: string;
  name: string;
  tree: 'blade' | 'wind' | 'spirit';
  description: string;
  cost: number;
  requires?: string[];
  maxRank: number;
  /** Passive effect keys read by Player. */
  effect:
    | 'attack'
    | 'posture'
    | 'health'
    | 'resolve'
    | 'gourd'
    | 'parryWindow'
    | 'dodgeWindow'
    | 'essence'
    | 'flow'
    | 'artDamage'
    | 'stealth'
    | 'grapple'
    | 'speed';
  perRank: number;
  icon: string;
}

export interface ItemDef {
  id: string;
  name: string;
  type: 'consumable' | 'material' | 'key' | 'memory';
  description: string;
  max: number;
  effect?: 'heal' | 'resolve' | 'attack' | 'defense' | 'reveal' | 'smoke' | 'none';
  amount?: number;
  duration?: number;
  icon: string;
  value?: number;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  /** Optional portrait tint / emotion. */
  mood?: 'neutral' | 'angry' | 'sad' | 'wry' | 'afraid' | 'solemn';
  /** Play a one-shot vocal-ish tone or sfx. */
  sfx?: string;
}

export interface DialogueChoice {
  text: string;
  /** Node to jump to. */
  next: string;
  requiresFlag?: string;
  requiresItem?: string;
  effects?: DialogueEffect[];
  /** Hidden unless condition is met. */
  hidden?: boolean;
}

export interface DialogueEffect {
  type: 'flag' | 'quest' | 'item' | 'essence' | 'xp' | 'unlock' | 'heal' | 'ending' | 'codex' | 'reputation';
  id?: string;
  value?: number | string | boolean;
}

export interface DialogueNode {
  id: string;
  lines: DialogueLine[];
  choices?: DialogueChoice[];
  next?: string;
  effects?: DialogueEffect[];
  /** Ends dialogue when reached. */
  end?: boolean;
  /** Camera framing. */
  camera?: 'close' | 'wide' | 'over_shoulder';
}

export interface DialogueTree {
  id: string;
  start: string;
  /** First matching flag wins; lets one NPC remember many story states. */
  startByFlag?: Array<{ flag: string; node: string }>;
  nodes: Record<string, DialogueNode>;
  /** Falls back to this if a node is missing. */
  fallback?: string;
  /** Music ducking. */
  duckMusic?: boolean;
}

export interface QuestStage {
  id: string;
  text: string;
  /** How progress is counted. */
  kind: 'talk' | 'kill' | 'collect' | 'reach' | 'boss' | 'flag' | 'choice';
  target: string;
  count?: number;
  /** Optional hint shown in the journal. */
  hint?: string;
}

export interface QuestDef {
  id: string;
  title: string;
  chapter: number;
  type: 'main' | 'side' | 'contract';
  giver: string;
  summary: string;
  stages: QuestStage[];
  rewards: { xp?: number; essence?: number; items?: { id: string; count: number }[]; skillPoints?: number };
  /** Flags set when the quest is accepted / completed. */
  acceptFlags?: Record<string, boolean | number | string>;
  completeFlags?: Record<string, boolean | number | string>;
  /** Quest id that must be complete before this appears. */
  requires?: string[];
  /** Hidden until this flag is true. */
  revealFlag?: string;
  /** Affects endings. */
  endingWeight?: Record<string, number>;
  lore?: string;
}

export type FlagValue = boolean | number | string;

export interface ChapterDef {
  index: number;
  id: string;
  act: number;
  title: string;
  kanji: string;
  subtitle: string;
  region: ID;
  spawn: string;
  objective: string;
  description: string;
  boss: ID;
  /** Seconds of cinematic intro (0 = simple card). */
  intro?: ID;
  outro?: ID;
  rewards?: { xp?: number; essence?: number; items?: { id: string; count: number }[]; weapon?: string; skillPoint?: number };
  /** Flags set on completion. */
  completeFlags?: Record<string, boolean | number | string>;
  /** Chapter requires these flags. */
  requires?: string[];
  /** Estimated minutes of authored content. */
  minutes?: number;
}

export interface RegionDef {
  id: ID;
  name: string;
  kanji: string;
  subtitle: string;
  description: string;
  chapter: number;
  theme: RegionTheme;
  terrain: TerrainConfig;
  landmarks: LandmarkDef[];
  shrines: ShrineDef[];
  npcs: NPCDef[];
  /** Enemy spawn clusters. */
  enemies: EnemySpawn[];
  collectibles: CollectibleDef[];
  secrets: SecretDef[];
  arenas: BossArenaDef[];
  spawns: SpawnPoint[];
  map: { x: number; z: number; scale: number; rotation: number };
  ambience: { wind: number; birds: number; water: number; crowd: number };
}

export interface EnemySpawn {
  id: string;
  enemy: string;
  x: number;
  z: number;
  chapter?: number;
  /** Number spawned around the point. */
  count?: number;
  radius?: number;
  elite?: boolean;
  patrol?: boolean;
}

export interface CollectibleDef {
  id: string;
  kind: 'memory' | 'item' | 'essence' | 'lore' | 'seed';
  x: number;
  z: number;
  chapter?: number;
  item?: string;
  amount?: number;
  codex?: string;
  name?: string;
}

export interface SecretDef {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  chapter?: number;
  flag: string;
  description: string;
  reward?: { item?: string; count?: number; essence?: number; xp?: number };
}

export interface BossArenaDef {
  id: string;
  x: number;
  z: number;
  radius: number;
  boss: string;
  chapter: number;
  fogColor?: string;
  entryFlag?: string;
}

export interface CodexEntry {
  id: string;
  category: 'world' | 'characters' | 'bestiary' | 'blades' | 'memories';
  title: string;
  text: string;
  unlockFlag: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  hidden?: boolean;
  icon: string;
  condition: { type: 'flag' | 'boss' | 'chapter' | 'collect' | 'quest' | 'ending' | 'deaths' | 'parry'; target: string; count?: number };
}

export interface EndingDef {
  id: string;
  title: string;
  kanji: string;
  requirement: string;
  text: string[];
  epilogue: string;
  color: string;
  flags: Record<string, boolean>;
}

export interface CinematicStep {
  at: number;
  kind: 'camera' | 'line' | 'title' | 'fade' | 'shake' | 'flag' | 'music' | 'wait' | 'choice';
  id?: string;
  text?: string;
  speaker?: string;
  duration?: number;
  from?: Vec3Data;
  to?: Vec3Data;
  lookFrom?: Vec3Data;
  lookTo?: Vec3Data;
  value?: number | string | boolean;
  transition?: 'cut' | 'smooth' | 'fade';
}

export interface CinematicDef {
  id: string;
  duration: number;
  steps: CinematicStep[];
  skippable?: boolean;
  letterbox?: boolean;
  music?: MusicTheme;
}

export interface SettingsData {
  version: number;
  quality: Quality;
  difficulty: Difficulty;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  sensitivity: number;
  invertY: boolean;
  cameraShake: number;
  motionBlur: boolean;
  bloom: boolean;
  filmGrain: boolean;
  outlines: boolean;
  reduceMotion: boolean;
  subtitles: boolean;
  subtitleSize: 'sm' | 'md' | 'lg';
  subtitleBackground: boolean;
  holdToGuard: boolean;
  holdToSprint: boolean;
  autoLockOn: boolean;
  colorblind: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  damageNumbers: boolean;
  tutorialHints: boolean;
  touchControls: 'auto' | 'on' | 'off';
  gameSpeed: number;
  language: 'en' | 'jp-romaji';
  kurosawaMode: boolean;
  showFps: boolean;
  photosensitivity: boolean;
}

export interface PlayerStatsData {
  level: number;
  xp: number;
  xpNext: number;
  health: number;
  maxHealth: number;
  posture: number;
  maxPosture: number;
  attack: number;
  defense: number;
  resolve: number;
  maxResolve: number;
  gourds: number;
  maxGourds: number;
  essence: number;
  skillPoints: number;
  flow: number;
  stealth: number;
}

export interface QuestState {
  id: string;
  status: 'inactive' | 'active' | 'complete' | 'failed';
  stage: number;
  progress: number;
  startedAt: number;
  completedAt?: number;
}

export interface SaveData {
  version: number;
  slot: number;
  createdAt: number;
  updatedAt: number;
  playtime: number;
  chapter: number;
  region: string;
  spawn: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  stats: PlayerStatsData;
  weapon: string;
  unlockedWeapons: string[];
  equippedArt: string;
  skills: Record<string, number>;
  inventory: Record<string, number>;
  flags: Record<string, FlagValue>;
  quests: Record<string, QuestState>;
  codex: string[];
  achievements: string[];
  discoveredShrines: string[];
  visitedRegions: string[];
  bossMemory: string[];
  deaths: number;
  parries: number;
  kills: number;
  ending: string | null;
  newGamePlus: number;
  checkpoint: { region: string; shrine: string; x: number; z: number } | null;
}

export interface CombatHit {
  attacker: 'player' | 'enemy' | 'hazard';
  damage: number;
  posture: number;
  damageType: DamageType;
  status?: { kind: StatusKind; amount: number };
  knockback: number;
  hitstop: number;
  /** Perfect parry / deflect. */
  parried?: boolean;
  /** Guarded but not parried. */
  blocked?: boolean;
  /** Back attack bonus. */
  backstab?: boolean;
  critical?: boolean;
  sourceId?: string;
  position?: Vec3Data;
}

export interface DamageResult {
  damage: number;
  posture: number;
  blocked: boolean;
  parried: boolean;
  killed: boolean;
  postureBroken: boolean;
  critical: boolean;
}

export interface GameEventMap {
  'game:start': { fresh: boolean };
  'game:chapter': { chapter: ChapterDef; index: number };
  'game:region': { region: RegionDef };
  'game:saved': { slot: number; auto: boolean };
  'game:death': { deaths: number };
  'game:respawn': { shrine: string };
  'game:ending': { ending: EndingDef };
  'player:damage': { amount: number; health: number };
  'player:heal': { amount: number; health: number };
  'player:parry': { perfect: boolean; position: Vec3Data };
  'player:dodge': { perfect: boolean };
  'player:deathblow': { target: string };
  'player:level': { level: number };
  'player:weapon': { weapon: WeaponDef };
  'enemy:damage': { id: string; amount: number; position: Vec3Data; critical: boolean };
  'enemy:death': { id: string; kind: string; position: Vec3Data; boss: boolean };
  'enemy:posture': { id: string; value: number; max: number; broken: boolean };
  'boss:start': { boss: EnemyDef };
  'boss:phase': { boss: string; phase: number; name: string };
  'boss:end': { boss: string };
  'combat:hit': { result: DamageResult; position: Vec3Data };
  'combat:hitstop': { duration: number };
  'world:interact': { id: string; kind: string };
  'world:shrine': { shrine: ShrineDef };
  'world:pickup': { name: string; item?: string; count?: number };
  'world:secret': { name: string; id: string };
  'world:weather': { weather: WeatherKind; wind: number };
  'quest:start': { quest: QuestDef };
  'quest:update': { quest: QuestDef; stage: number; text: string };
  'quest:complete': { quest: QuestDef };
  'dialogue:start': { tree: DialogueTree };
  'dialogue:end': { tree: DialogueTree };
  'ui:toast': { title: string; text?: string; kind?: 'item' | 'quest' | 'achievement' | 'lore' | 'warning' | 'boss'; icon?: string; duration?: number };
  'ui:objective': { text: string; sub?: string };
  'ui:prompt': { text: string; key: string; visible: boolean };
  'ui:subtitle': { speaker: string; text: string; duration: number };
  'ui:damage': { amount: number; position: Vec3Data; kind: 'player' | 'enemy' | 'heal' | 'posture' };
  'ui:achievement': { achievement: AchievementDef };
  'ui:chaptercard': { chapter: ChapterDef };
  'audio:boss': { boss: EnemyDef | null; intensity: number };
  'audio:mood': { mood: MusicMood };
  'photo:toggle': { on: boolean };
  'input:action': { action: InputAction; pressed: boolean };
  'debug:teleport': { x: number; z: number };
}

export type GameEventName = keyof GameEventMap;

export type InputAction =
  | 'light'
  | 'heavy'
  | 'guard'
  | 'dodge'
  | 'sprint'
  | 'interact'
  | 'lockOn'
  | 'heal'
  | 'item'
  | 'grapple'
  | 'crouch'
  | 'weaponNext'
  | 'weaponPrev'
  | 'pause'
  | 'journal'
  | 'map'
  | 'skills'
  | 'codex'
  | 'photo'
  | 'skip'
  | 'confirm'
  | 'cancel'
  | 'menuUp'
  | 'menuDown'
  | 'menuLeft'
  | 'menuRight'
  | 'attack'
  | 'parry'
  | 'special';

export interface RaycastTarget {
  id: string;
  kind: 'npc' | 'shrine' | 'item' | 'grapple' | 'deathblow' | 'landmark' | 'travel';
  position: Vec3Data;
  radius: number;
  label: string;
  data?: unknown;
}
