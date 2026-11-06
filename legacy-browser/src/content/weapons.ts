import type { AttackMove, ItemDef, SkillDef, WeaponDef } from '../types';

/**
 * Player move library.
 *
 * `damage` is a *base* number; the Player applies weapon multipliers, skill
 * bonuses and the flow meter at runtime. Timings are in seconds and tuned for
 * a 60 fps action game: short wind-ups, readable active frames, committed
 * recovery. Perilous enemy moves are marked separately in enemies.ts.
 */
export const PLAYER_MOVES: Record<string, AttackMove> = {
  // ── Katana ────────────────────────────────────────────────────────────────
  k1: {
    id: 'k1', name: 'Falling Petal', windup: 0.14, active: 0.09, recover: 0.3,
    damage: 14, posture: 11, range: 2.5, arc: 1.9, knockback: 0.8, lunge: 1.9,
    hitstop: 0.045, anim: 'slash', sfx: 'sword_light',
  },
  k2: {
    id: 'k2', name: 'Rising Reed', windup: 0.13, active: 0.09, recover: 0.3,
    damage: 15, posture: 11, range: 2.5, arc: 1.9, knockback: 0.8, lunge: 1.7,
    hitstop: 0.045, anim: 'slash', sfx: 'sword_light',
  },
  k3: {
    id: 'k3', name: 'Split Tide', windup: 0.17, active: 0.11, recover: 0.28,
    damage: 18, posture: 15, range: 2.7, arc: 2.0, knockback: 1.1, lunge: 2.0,
    hitstop: 0.05, anim: 'overhead', sfx: 'sword_light',
  },
  k4: {
    id: 'k4', name: 'Nameless Cut', windup: 0.23, active: 0.14, recover: 0.4,
    damage: 24, posture: 21, range: 3.0, arc: 2.3, knockback: 2.2, lunge: 2.6,
    hitstop: 0.07, anim: 'spin', sfx: 'sword_heavy',
  },
  // ── Odachi ────────────────────────────────────────────────────────────────
  o1: {
    id: 'o1', name: 'Sundering Wind', windup: 0.21, active: 0.12, recover: 0.3,
    damage: 22, posture: 19, range: 3.0, arc: 2.1, knockback: 1.6, lunge: 2.0,
    hitstop: 0.06, anim: 'slash', sfx: 'sword_heavy',
  },
  o2: {
    id: 'o2', name: 'Long Shadow', windup: 0.2, active: 0.12, recover: 0.32,
    damage: 24, posture: 20, range: 3.1, arc: 2.0, knockback: 1.8, lunge: 1.8,
    hitstop: 0.06, anim: 'slash', sfx: 'sword_heavy',
  },
  o3: {
    id: 'o3', name: 'Horizon Fall', windup: 0.3, active: 0.15, recover: 0.48,
    damage: 32, posture: 30, range: 3.3, arc: 2.6, knockback: 2.6, lunge: 2.8,
    hitstop: 0.09, anim: 'overhead', sfx: 'sword_heavy',
  },
  // ── Spear ─────────────────────────────────────────────────────────────────
  s1: {
    id: 's1', name: 'Reed Thrust', windup: 0.12, active: 0.09, recover: 0.2,
    damage: 12, posture: 9, range: 3.4, arc: 0.9, knockback: 1.2, lunge: 2.4,
    hitstop: 0.04, anim: 'thrust', sfx: 'sword_light',
  },
  s2: {
    id: 's2', name: 'River Piercer', windup: 0.14, active: 0.1, recover: 0.22,
    damage: 14, posture: 10, range: 3.6, arc: 0.8, knockback: 1.3, lunge: 2.5,
    hitstop: 0.045, anim: 'thrust', sfx: 'sword_light',
  },
  s3: {
    id: 's3', name: 'Three Reaches', windup: 0.18, active: 0.12, recover: 0.3,
    damage: 18, posture: 14, range: 3.8, arc: 1.4, knockback: 2.0, lunge: 2.6,
    hitstop: 0.055, anim: 'thrust', sfx: 'sword_heavy',
  },
  s4: {
    id: 's4', name: 'Longing\'s End', windup: 0.25, active: 0.14, recover: 0.42,
    damage: 26, posture: 22, range: 4.2, arc: 1.1, knockback: 3.0, lunge: 3.4,
    hitstop: 0.08, anim: 'thrust', sfx: 'sword_heavy',
  },
  // ── Dual blades ───────────────────────────────────────────────────────────
  d1: {
    id: 'd1', name: 'Swallow', windup: 0.09, active: 0.07, recover: 0.16,
    damage: 10, posture: 7, range: 2.2, arc: 1.7, knockback: 0.5, lunge: 1.6,
    hitstop: 0.035, anim: 'slash', sfx: 'sword_light',
  },
  d2: {
    id: 'd2', name: 'Answer', windup: 0.09, active: 0.07, recover: 0.16,
    damage: 10, posture: 7, range: 2.2, arc: 1.7, knockback: 0.5, lunge: 1.5,
    hitstop: 0.035, anim: 'slash', sfx: 'sword_light',
  },
  d3: {
    id: 'd3', name: 'Two Rivers', windup: 0.11, active: 0.08, recover: 0.18,
    damage: 12, posture: 8, range: 2.3, arc: 1.9, knockback: 0.7, lunge: 1.7,
    hitstop: 0.04, anim: 'slash', sfx: 'sword_light',
  },
  d4: {
    id: 'd4', name: 'Crossing', windup: 0.12, active: 0.08, recover: 0.2,
    damage: 13, posture: 9, range: 2.4, arc: 2.0, knockback: 0.8, lunge: 1.8,
    hitstop: 0.04, anim: 'slash', sfx: 'sword_light',
  },
  d5: {
    id: 'd5', name: 'Twin Moon', windup: 0.2, active: 0.12, recover: 0.38,
    damage: 20, posture: 16, range: 2.7, arc: 3.0, knockback: 2.0, lunge: 2.2,
    hitstop: 0.065, anim: 'spin', sfx: 'sword_heavy',
  },
  // ── Greatsword ────────────────────────────────────────────────────────────
  g1: {
    id: 'g1', name: 'Grave Weight', windup: 0.32, active: 0.14, recover: 0.42,
    damage: 30, posture: 28, range: 3.0, arc: 2.2, knockback: 2.4, lunge: 2.1,
    hitstop: 0.08, anim: 'overhead', sfx: 'sword_heavy',
  },
  g2: {
    id: 'g2', name: 'Bellbreaker', windup: 0.38, active: 0.16, recover: 0.52,
    damage: 40, posture: 38, range: 3.3, arc: 2.8, knockback: 3.4, lunge: 2.6,
    hitstop: 0.1, anim: 'spin', sfx: 'sword_heavy',
  },
  // ── Universal heavy attack ────────────────────────────────────────────────
  heavy: {
    id: 'heavy', name: 'Crushing Wave', windup: 0.4, active: 0.13, recover: 0.46,
    damage: 28, posture: 30, range: 3.0, arc: 2.4, knockback: 2.4, lunge: 2.2,
    hitstop: 0.08, anim: 'overhead', sfx: 'sword_heavy',
  },
  heavy_odachi: {
    id: 'heavy_odachi', name: 'Sky Cleaver', windup: 0.46, active: 0.15, recover: 0.54,
    damage: 38, posture: 38, range: 3.4, arc: 2.5, knockback: 3.0, lunge: 2.6,
    hitstop: 0.09, anim: 'overhead', sfx: 'sword_heavy',
  },
  heavy_spear: {
    id: 'heavy_spear', name: 'Horizon Thrust', windup: 0.36, active: 0.13, recover: 0.5,
    damage: 30, posture: 28, range: 4.5, arc: 0.7, knockback: 3.6, lunge: 3.6,
    hitstop: 0.08, anim: 'thrust', sfx: 'sword_heavy',
  },
  heavy_dual: {
    id: 'heavy_dual', name: 'Storm of Two', windup: 0.28, active: 0.2, recover: 0.42,
    damage: 24, posture: 20, range: 2.6, arc: 3.4, knockback: 1.6, lunge: 1.8,
    hitstop: 0.06, anim: 'spin', sfx: 'sword_heavy',
  },
  heavy_great: {
    id: 'heavy_great', name: 'The Last Bell', windup: 0.55, active: 0.18, recover: 0.62,
    damage: 50, posture: 50, range: 3.6, arc: 3.0, knockback: 4.2, lunge: 2.8,
    hitstop: 0.12, anim: 'slam', sfx: 'sword_heavy',
  },
  // ── Weapon arts (Echoes) ──────────────────────────────────────────────────
  art_cleave: {
    id: 'art_cleave', name: 'Echo: Falling World', windup: 0.44, active: 0.18, recover: 0.55,
    damage: 42, posture: 48, range: 4.2, arc: 3.4, knockback: 3.2, lunge: 4.0,
    hitstop: 0.12, anim: 'spin', sfx: 'art_release',
  },
  art_sunder: {
    id: 'art_sunder', name: 'Echo: Horizon Break', windup: 0.6, active: 0.18, recover: 0.66,
    damage: 52, posture: 56, range: 4.4, arc: 2.0, knockback: 3.6, lunge: 2.4,
    hitstop: 0.14, anim: 'slam', sfx: 'art_release',
    aoe: { radius: 5.2, delay: 0.18, color: '#ffb46b', damageType: 'physical' },
  },
  art_pierce: {
    id: 'art_pierce', name: 'Echo: Nine Rivers', windup: 0.46, active: 0.18, recover: 0.5,
    damage: 44, posture: 42, range: 7.0, arc: 0.55, knockback: 3.8, lunge: 6.2,
    hitstop: 0.1, anim: 'thrust', sfx: 'art_release',
  },
  art_cyclone: {
    id: 'art_cyclone', name: 'Echo: Twin Storm', windup: 0.3, active: 0.36, recover: 0.44,
    damage: 26, posture: 22, range: 3.0, arc: 3.6, knockback: 1.8, lunge: 2.6,
    hitstop: 0.05, anim: 'spin', sfx: 'art_release',
  },
  art_bell: {
    id: 'art_bell', name: 'Echo: Funeral Bell', windup: 0.66, active: 0.2, recover: 0.7,
    damage: 60, posture: 64, range: 4.0, arc: 3.6, knockback: 4.0, lunge: 2.0,
    hitstop: 0.16, anim: 'slam', sfx: 'art_release',
    aoe: { radius: 6.0, delay: 0.2, color: '#d8c7a0', damageType: 'sound' },
  },
  art_verdict: {
    id: 'art_verdict', name: 'Echo: Last Verdict', windup: 0.5, active: 0.2, recover: 0.58,
    damage: 48, posture: 50, range: 4.0, arc: 2.4, knockback: 3.0, lunge: 3.0,
    hitstop: 0.12, anim: 'slash', sfx: 'art_release',
    aoe: { radius: 3.2, delay: 0.16, color: '#d6e7ff', damageType: 'spirit' },
  },
};

export const WEAPONS: Record<string, WeaponDef> = {
  katana: {
    id: 'katana',
    name: 'Nameless',
    kanji: '無名',
    description: 'A chipped uchigatana with no smith\'s mark. It remembers every hand that held it — yours included.',
    damage: 1.0,
    speed: 1.0,
    range: 1.0,
    posture: 1.0,
    combo: ['k1', 'k2', 'k3', 'k4'],
    heavy: 'heavy',
    art: 'art_cleave',
    model: 'katana',
    colors: { blade: '#dfe6e9', hilt: '#2b2320', wrap: '#8f2f2f', glow: '#ffd9a0' },
    unlockFlag: '',
    lore: 'Forged from the last syllable of the world, then broken so it could never be spoken whole.',
  },
  odachi: {
    id: 'odachi',
    name: 'Sunder',
    kanji: '断',
    description: 'A field sword carried by a general who cut a river in half and called it a road.',
    damage: 1.28,
    speed: 0.84,
    range: 1.12,
    posture: 1.22,
    combo: ['o1', 'o2', 'o3'],
    heavy: 'heavy_odachi',
    art: 'art_sunder',
    model: 'odachi',
    colors: { blade: '#e7e2d3', hilt: '#3d2a1f', wrap: '#b04a2f', glow: '#ffb46b' },
    unlockFlag: 'weapon_odachi',
    lore: 'The Warden of the Tide carried it upright in the water for a hundred years. The rust never touched it.',
  },
  spear: {
    id: 'spear',
    name: 'Longing',
    kanji: '望',
    description: 'A yari with a blade like a crane\'s beak. Its reach is the distance between two people who never said goodbye.',
    damage: 0.92,
    speed: 1.12,
    range: 1.5,
    posture: 0.92,
    combo: ['s1', 's2', 's3', 's4'],
    heavy: 'heavy_spear',
    art: 'art_pierce',
    model: 'spear',
    colors: { blade: '#d8e3e7', hilt: '#2e2a24', wrap: '#6d8f7a', glow: '#a8e6cf' },
    unlockFlag: 'weapon_spear',
    lore: 'Queen Sabaku planted it in the dunes before the oasis died. It is still waiting for the water.',
  },
  dual: {
    id: 'dual',
    name: 'Twin Echo',
    kanji: '双',
    description: 'Two short blades that answer each other. To hear one is to know the other is close.',
    damage: 0.8,
    speed: 1.36,
    range: 0.92,
    posture: 0.75,
    combo: ['d1', 'd2', 'd3', 'd4', 'd5'],
    heavy: 'heavy_dual',
    art: 'art_cyclone',
    model: 'dual',
    colors: { blade: '#eef3f4', hilt: '#1f2024', wrap: '#6b6f9e', glow: '#b8b6ff' },
    unlockFlag: 'weapon_dual',
    lore: 'Futari means "two". The blades were forged as a pair; the twins who carried them were not.',
  },
  greatsword: {
    id: 'greatsword',
    name: 'Bone Bell',
    kanji: '鐘',
    description: 'A slab of funeral bronze beaten into an edge. Every swing tolls for someone.',
    damage: 1.55,
    speed: 0.66,
    range: 1.22,
    posture: 1.55,
    combo: ['g1', 'g2'],
    heavy: 'heavy_great',
    art: 'art_bell',
    model: 'greatsword',
    colors: { blade: '#c9c3ae', hilt: '#2c241e', wrap: '#a33b2b', glow: '#ffcf8a' },
    unlockFlag: 'weapon_greatsword',
    lore: 'Cast from the bells of the drowned temple. When it rings, the dead turn their heads.',
  },
};

export const WEAPON_ORDER = ['katana', 'odachi', 'spear', 'dual', 'greatsword'];

export const ARTS: Record<string, { id: string; name: string; description: string; cost: number; move: string; weapon: string }> = {
  art_cleave: { id: 'art_cleave', name: 'Falling World', description: 'A wide, committed cut that breaks guard. 1 Resolve.', cost: 1, move: 'art_cleave', weapon: 'katana' },
  art_sunder: { id: 'art_sunder', name: 'Horizon Break', description: 'Slam the earth; a shockwave follows. 1 Resolve.', cost: 1, move: 'art_sunder', weapon: 'odachi' },
  art_pierce: { id: 'art_pierce', name: 'Nine Rivers', description: 'A line-piercing lunge that crosses the battlefield. 1 Resolve.', cost: 1, move: 'art_pierce', weapon: 'spear' },
  art_cyclone: { id: 'art_cyclone', name: 'Twin Storm', description: 'A whirling sequence of cuts. 1 Resolve.', cost: 1, move: 'art_cyclone', weapon: 'dual' },
  art_bell: { id: 'art_bell', name: 'Funeral Bell', description: 'A ringing ground slam that staggers everything nearby. 1 Resolve.', cost: 1, move: 'art_bell', weapon: 'greatsword' },
  art_verdict: { id: 'art_verdict', name: 'Last Verdict', description: 'A spirit-cut that ignores armor. Unlocked in the final chapter. 2 Resolve.', cost: 2, move: 'art_verdict', weapon: 'katana' },
};

export const ITEMS: Record<string, ItemDef> = {
  incense: {
    id: 'incense', name: 'Wound Incense', type: 'consumable', max: 9,
    description: 'Bitter smoke that closes a wound. Restores 40 health.',
    effect: 'heal', amount: 40, icon: 'incense', value: 20,
  },
  talisman: {
    id: 'talisman', name: 'Edge Talisman', type: 'consumable', max: 5,
    description: 'Paper cut with a name. For 25 seconds, attacks deal +20% damage.',
    effect: 'attack', amount: 0.2, duration: 25, icon: 'talisman', value: 60,
  },
  smoke_bomb: {
    id: 'smoke_bomb', name: 'Smoke Bomb', type: 'consumable', max: 4,
    description: 'Breaks sight. Enemies lose you for 6 seconds and stealth is restored.',
    effect: 'smoke', amount: 6, icon: 'smoke', value: 45,
  },
  snow_lotus: {
    id: 'snow_lotus', name: 'Snow Lotus', type: 'consumable', max: 3,
    description: 'A permanent +8 to maximum health. The flower only opens once.',
    effect: 'heal', amount: 0, icon: 'lotus', value: 200,
  },
  dune_glass: {
    id: 'dune_glass', name: 'Dune Glass', type: 'consumable', max: 3,
    description: 'Lightning fused into sand. Permanently +8 maximum posture.',
    effect: 'defense', amount: 8, icon: 'glass', value: 200,
  },
  bell_token: {
    id: 'bell_token', name: 'Bell Token', type: 'key', max: 9,
    description: 'A bronze clapper. Offer it at a shrine to refresh your gourds.',
    icon: 'bell', value: 0,
  },
  memory_fragment: {
    id: 'memory_fragment', name: 'Memory Fragment', type: 'memory', max: 99,
    description: 'A moment that refused to be forgotten. Yomi can read it.',
    icon: 'memory', value: 0,
  },
  oni_horn: {
    id: 'oni_horn', name: 'Oni Horn', type: 'material', max: 99,
    description: 'Proof of a hard fight. Trades for essence at any shrine.',
    icon: 'horn', value: 35,
  },
  shrine_seed: {
    id: 'shrine_seed', name: 'Shrine Seed', type: 'key', max: 9,
    description: 'A seed from a sacred tree. Plant it at a shrine to strengthen your bond.',
    icon: 'seed', value: 0,
  },
};

export const SKILLS: Record<string, SkillDef> = {
  // Blade
  tempered_edge: { id: 'tempered_edge', name: 'Tempered Edge', tree: 'blade', description: '+6% attack per rank.', cost: 1, maxRank: 3, effect: 'attack', perRank: 0.06, icon: 'blade' },
  iron_posture: { id: 'iron_posture', name: 'Iron Posture', tree: 'blade', description: '+10 maximum posture per rank.', cost: 1, maxRank: 3, effect: 'posture', perRank: 10, icon: 'shield' },
  executioner: { id: 'executioner', name: 'Executioner', tree: 'blade', description: '+12% weapon art damage per rank.', cost: 1, maxRank: 3, requires: ['tempered_edge'], effect: 'artDamage', perRank: 0.12, icon: 'skull' },
  deep_cut: { id: 'deep_cut', name: 'Deep Cut', tree: 'blade', description: '+8% posture damage per rank.', cost: 2, maxRank: 2, requires: ['iron_posture'], effect: 'posture', perRank: 0.08, icon: 'crack' },
  // Wind
  wind_reading: { id: 'wind_reading', name: 'Wind Reading', tree: 'wind', description: '+35 ms perfect-parry window per rank.', cost: 1, maxRank: 2, effect: 'parryWindow', perRank: 0.035, icon: 'wind' },
  swift_step: { id: 'swift_step', name: 'Swift Step', tree: 'wind', description: '+30 ms dodge invulnerability per rank.', cost: 1, maxRank: 2, effect: 'dodgeWindow', perRank: 0.03, icon: 'step' },
  fleet_foot: { id: 'fleet_foot', name: 'Fleet Foot', tree: 'wind', description: '+5% movement speed per rank.', cost: 1, maxRank: 2, requires: ['swift_step'], effect: 'speed', perRank: 0.05, icon: 'boot' },
  unseen: { id: 'unseen', name: 'Unseen', tree: 'wind', description: 'Enemies detect you 18% more slowly per rank.', cost: 1, maxRank: 2, requires: ['fleet_foot'], effect: 'stealth', perRank: 0.18, icon: 'eye' },
  long_arm: { id: 'long_arm', name: 'Long Arm', tree: 'wind', description: '+2 m grapple range per rank.', cost: 1, maxRank: 2, requires: ['wind_reading'], effect: 'grapple', perRank: 2, icon: 'hook' },
  // Spirit
  deep_reserve: { id: 'deep_reserve', name: 'Deep Reserve', tree: 'spirit', description: '+1 maximum Resolve.', cost: 2, maxRank: 1, effect: 'resolve', perRank: 1, icon: 'spirit' },
  gourd_blessing: { id: 'gourd_blessing', name: 'Gourd Blessing', tree: 'spirit', description: '+1 healing gourd charge.', cost: 2, maxRank: 2, effect: 'gourd', perRank: 1, icon: 'gourd' },
  essence_flow: { id: 'essence_flow', name: 'Essence Flow', tree: 'spirit', description: '+15% essence gained per rank.', cost: 1, maxRank: 3, effect: 'essence', perRank: 0.15, icon: 'coin' },
  flow_state: { id: 'flow_state', name: 'Flow State', tree: 'spirit', description: 'Flow builds 20% faster and decays slower.', cost: 1, maxRank: 2, requires: ['essence_flow'], effect: 'flow', perRank: 0.2, icon: 'wave' },
  vitality: { id: 'vitality', name: 'Vitality', tree: 'spirit', description: '+10 maximum health per rank.', cost: 1, maxRank: 3, effect: 'health', perRank: 10, icon: 'heart' },
  spirit_siphon: { id: 'spirit_siphon', name: 'Spirit Siphon', tree: 'spirit', description: 'Deathblows restore 1 Resolve.', cost: 2, maxRank: 1, requires: ['deep_reserve'], effect: 'resolve', perRank: 1, icon: 'siphon' },
};

export const SKILL_TREES = {
  blade: ['tempered_edge', 'iron_posture', 'executioner', 'deep_cut'],
  wind: ['wind_reading', 'swift_step', 'fleet_foot', 'unseen', 'long_arm'],
  spirit: ['deep_reserve', 'gourd_blessing', 'essence_flow', 'flow_state', 'vitality', 'spirit_siphon'],
} as const;

export const STARTER_INVENTORY: Record<string, number> = {
  incense: 3,
  talisman: 1,
  smoke_bomb: 1,
};
