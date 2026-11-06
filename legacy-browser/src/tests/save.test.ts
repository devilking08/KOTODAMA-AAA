import { describe, expect, it } from 'vitest';
import { MemoryStorage, SaveSystem, createNewSave, isValidSave, migrateSave, SAVE_SLOTS, DEFAULT_SETTINGS } from '../core/SaveSystem';

describe('SaveSystem', () => {
  it('createNewSave produces a valid starting save', () => {
    const save = createNewSave(1, 1000);
    expect(isValidSave(save)).toBe(true);
    expect(save.chapter).toBe(0);
    expect(save.region).toBe('shore');
    expect(save.spawn).toBe('shore_start');
    expect(save.unlockedWeapons).toEqual(['katana']);
    expect(save.inventory.incense).toBe(2);
    expect(save.codex).toContain('world_kotodama');
    expect(save.stats.level).toBe(1);
  });

  it('save/load round-trips through MemoryStorage', () => {
    const storage = new MemoryStorage();
    const sys = new SaveSystem(storage);
    const save = createNewSave(2, 1000);
    save.flags.test = true;
    save.inventory.talisman = 4;
    expect(sys.save(save, 2)).toBe(true);
    const loaded = sys.load(2);
    expect(loaded).not.toBeNull();
    expect(loaded?.flags.test).toBe(true);
    expect(loaded?.inventory.talisman).toBe(4);
    expect(loaded?.slot).toBe(2);
  });

  it('autosave uses the reserved slot and does not clobber manual slots', () => {
    const storage = new MemoryStorage();
    const sys = new SaveSystem(storage);
    const manual = createNewSave(1, 1000);
    sys.save(manual, 1);
    const auto = createNewSave(0, 2000);
    auto.flags.auto = true;
    sys.save(auto, 0);
    expect(sys.load(1)?.flags.auto).toBeUndefined();
    expect(sys.load(0)?.flags.auto).toBe(true);
  });

  it('listSlots returns all slots including empty ones', () => {
    const sys = new SaveSystem(new MemoryStorage());
    const slots = sys.listSlots();
    expect(slots).toHaveLength(SAVE_SLOTS);
    expect(slots.every((s) => s.data === null)).toBe(true);
  });

  it('migrateSave fills missing v1 fields', () => {
    const legacy = { version: 0, slot: 1, chapter: 1, region: 'shore', playtime: 10, stats: { maxHealth: 120 }, flags: {}, quests: {} };
    const migrated = migrateSave(legacy);
    expect(migrated).not.toBeNull();
    expect(migrated?.version).toBe(1);
    expect(migrated?.unlockedWeapons).toEqual(['katana']);
    expect(migrated?.deaths).toBe(0);
    expect(migrated?.newGamePlus).toBe(0);
  });

  it('rejects malformed saves', () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave('nope')).toBeNull();
    expect(migrateSave({})).toBeNull();
  });

  it('settings merge with defaults and clamp ranges', () => {
    const sys = new SaveSystem(new MemoryStorage());
    const loaded = sys.loadSettings();
    expect(loaded).toEqual(DEFAULT_SETTINGS);
    sys.saveSettings({ ...DEFAULT_SETTINGS, sensitivity: 99, gameSpeed: 0.1, masterVolume: 2 });
    const clamped = sys.loadSettings();
    expect(clamped.sensitivity).toBe(3);
    expect(clamped.gameSpeed).toBe(0.5);
    expect(clamped.masterVolume).toBe(1);
  });

  it('wipeAll clears every slot and settings', () => {
    const storage = new MemoryStorage();
    const sys = new SaveSystem(storage);
    sys.save(createNewSave(1), 1);
    sys.save(createNewSave(2), 2);
    sys.save(createNewSave(0), 0);
    sys.saveSettings(DEFAULT_SETTINGS);
    sys.wipeAll();
    expect(sys.hasAny()).toBe(false);
    expect(sys.loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
