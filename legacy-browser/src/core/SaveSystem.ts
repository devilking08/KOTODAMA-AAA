import type { SaveData, SettingsData } from '../types';

export const SAVE_VERSION = 1;
export const SAVE_SLOTS = 3;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

const SAVE_PREFIX = 'kotodama.save.';
const AUTO_KEY = 'kotodama.autosave';
const SETTINGS_KEY = 'kotodama.settings';

export const DEFAULT_SETTINGS: SettingsData = {
  version: 1,
  quality: 'high',
  difficulty: 'warrior',
  masterVolume: 0.85,
  musicVolume: 0.65,
  sfxVolume: 0.8,
  ambienceVolume: 0.6,
  sensitivity: 1,
  invertY: false,
  cameraShake: 0.7,
  motionBlur: false,
  bloom: true,
  filmGrain: true,
  outlines: true,
  reduceMotion: false,
  subtitles: true,
  subtitleSize: 'md',
  subtitleBackground: true,
  holdToGuard: true,
  holdToSprint: true,
  autoLockOn: true,
  colorblind: 'none',
  damageNumbers: true,
  tutorialHints: true,
  touchControls: 'off',
  gameSpeed: 1,
  language: 'en',
  kurosawaMode: false,
  showFps: false,
  photosensitivity: false,
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isValidSave(value: unknown): value is SaveData {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<SaveData>;
  return (
    typeof s.version === 'number' &&
    typeof s.slot === 'number' &&
    typeof s.chapter === 'number' &&
    typeof s.region === 'string' &&
    typeof s.playtime === 'number' &&
    !!s.stats &&
    typeof s.stats.maxHealth === 'number' &&
    !!s.flags &&
    !!s.quests
  );
}

/**
 * Migrates old saves forward. Each case is intentionally explicit so saves are
 * never silently corrupted by a schema change.
 */
export function migrateSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  let data = raw as Record<string, unknown>;
  const version = typeof data.version === 'number' ? data.version : 0;

  if (version < 1) {
    data = {
      ...data,
      version: 1,
      skills: data.skills ?? {},
      inventory: data.inventory ?? {},
      codex: data.codex ?? [],
      achievements: data.achievements ?? [],
      discoveredShrines: data.discoveredShrines ?? [],
      visitedRegions: data.visitedRegions ?? [],
      bossMemory: data.bossMemory ?? [],
      deaths: data.deaths ?? 0,
      parries: data.parries ?? 0,
      kills: data.kills ?? 0,
      newGamePlus: data.newGamePlus ?? 0,
      ending: data.ending ?? null,
      checkpoint: data.checkpoint ?? null,
      unlockedWeapons: data.unlockedWeapons ?? ['katana'],
      equippedArt: data.equippedArt ?? 'art_cleave',
      weapon: data.weapon ?? 'katana',
      position: data.position ?? { x: 0, y: 0, z: 0 },
      rotation: data.rotation ?? 0,
      spawn: data.spawn ?? 'start',
      playtime: data.playtime ?? 0,
    };
  }

  return isValidSave(data) ? (data as unknown as SaveData) : null;
}

export class SaveSystem {
  constructor(private storage: StorageLike) {}

  static browser(): SaveSystem {
    try {
      if (typeof localStorage !== 'undefined') return new SaveSystem(localStorage);
    } catch {
      /* private mode */
    }
    return new SaveSystem(new MemoryStorage());
  }

  slotKey(slot: number): string {
    return `${SAVE_PREFIX}${slot}`;
  }

  listSlots(): Array<{ slot: number; data: SaveData | null; auto: boolean }> {
    const out: Array<{ slot: number; data: SaveData | null; auto: boolean }> = [];
    for (let slot = 1; slot <= SAVE_SLOTS; slot++) {
      out.push({ slot, data: this.load(slot), auto: false });
    }
    return out;
  }

  load(slot: number): SaveData | null {
    const raw = this.storage.getItem(slot === 0 ? AUTO_KEY : this.slotKey(slot));
    return migrateSave(safeParse(raw));
  }

  save(data: SaveData, slot: number): boolean {
    if (slot !== 0 && (slot < 1 || slot > SAVE_SLOTS)) return false;
    data.version = SAVE_VERSION;
    data.slot = slot;
    data.updatedAt = Date.now();
    try {
      this.storage.setItem(slot === 0 ? AUTO_KEY : this.slotKey(slot), JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('[SaveSystem] write failed', error);
      return false;
    }
  }

  delete(slot: number): void {
    this.storage.removeItem(slot === 0 ? AUTO_KEY : this.slotKey(slot));
  }

  hasAny(): boolean {
    return this.load(0) !== null || [1, 2, 3].some((s) => this.load(s) !== null);
  }

  latest(): { data: SaveData; auto: boolean } | null {
    const candidates = [this.load(0), ...this.listSlots().map((s) => s.data)].filter(
      (s): s is SaveData => !!s,
    );
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.updatedAt - a.updatedAt);
    return { data: candidates[0], auto: candidates[0].slot === 0 };
  }

  export(data: SaveData): string {
    return JSON.stringify(data, null, 2);
  }

  import(json: string): SaveData | null {
    return migrateSave(safeParse(json));
  }

  loadSettings(): SettingsData {
    const stored = safeParse<Partial<SettingsData>>(this.storage.getItem(SETTINGS_KEY));
    if (!stored) return { ...DEFAULT_SETTINGS };
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    merged.masterVolume = clamp01(merged.masterVolume, DEFAULT_SETTINGS.masterVolume);
    merged.musicVolume = clamp01(merged.musicVolume, DEFAULT_SETTINGS.musicVolume);
    merged.sfxVolume = clamp01(merged.sfxVolume, DEFAULT_SETTINGS.sfxVolume);
    merged.ambienceVolume = clamp01(merged.ambienceVolume, DEFAULT_SETTINGS.ambienceVolume);
    merged.sensitivity = Math.max(0.1, Math.min(3, merged.sensitivity));
    merged.cameraShake = clamp01(merged.cameraShake, DEFAULT_SETTINGS.cameraShake);
    merged.gameSpeed = Math.max(0.5, Math.min(1.5, merged.gameSpeed));
    return merged;
  }

  saveSettings(settings: SettingsData): void {
    try {
      this.storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('[SaveSystem] settings write failed', error);
    }
  }

  wipeAll(): void {
    for (let slot = 0; slot <= SAVE_SLOTS; slot++) this.delete(slot);
    this.storage.removeItem(SETTINGS_KEY);
  }
}

function clamp01(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

/** Builds a valid, minimal save at the very start of the game. */
export function createNewSave(slot: number, now = Date.now()): SaveData {
  return {
    version: SAVE_VERSION,
    slot,
    createdAt: now,
    updatedAt: now,
    playtime: 0,
    chapter: 0,
    region: 'shore',
    spawn: 'shore_start',
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    stats: {
      level: 1,
      xp: 0,
      xpNext: 220,
      health: 120,
      maxHealth: 120,
      posture: 100,
      maxPosture: 100,
      attack: 12,
      defense: 4,
      resolve: 0,
      maxResolve: 3,
      gourds: 3,
      maxGourds: 3,
      essence: 0,
      skillPoints: 1,
      flow: 0,
      stealth: 1,
    },
    weapon: 'katana',
    unlockedWeapons: ['katana'],
    equippedArt: 'art_cleave',
    skills: {},
    inventory: { incense: 2, talisman: 1 },
    flags: {},
    quests: {},
    codex: ['world_kotodama'],
    achievements: [],
    discoveredShrines: [],
    visitedRegions: ['shore'],
    bossMemory: [],
    deaths: 0,
    parries: 0,
    kills: 0,
    ending: null,
    newGamePlus: 0,
    checkpoint: null,
  };
}
