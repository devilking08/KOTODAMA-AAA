import type { AttackMove, EnemyDef } from '../types';

/**
 * Enemy and boss library.
 *
 * Every attack is data. The AI can chain moves listed in `chain`, and the
 * boss phase table selects which moves are legal at each health threshold.
 * All timings are hand-tuned around three readability rules:
 *   1. Every dangerous move has a wind-up long enough to read.
 *   2. Perilous (red) moves must be dodged, not parried.
 *   3. Gold sweeps punish guard-camping and reward a step-in.
 */

const move = (m: AttackMove): AttackMove => m;

// ─────────────────────────────────────────────────────────────────────────────
// Regular enemies
// ─────────────────────────────────────────────────────────────────────────────

export const ENEMIES: Record<string, EnemyDef> = {
  ronin: {
    id: 'ronin', name: 'Ash Ronin', kind: 'grunt', behavior: 'patrol',
    hp: 72, posture: 72, damage: 14, speed: 3.5, radius: 0.58, height: 1.8,
    xp: 34, essence: 12,
    colors: { robe: '#3a3430', armor: '#5b4a3d', accent: '#a14a35', skin: '#c9a184', weapon: '#cfd6d8' },
    weapon: 'katana', detection: 20, guard: 0.18, parryChance: 0.12,
    attacks: [
      move({ id: 'r_slash', name: 'Drifting Cut', windup: 0.52, active: 0.1, recover: 0.55, damage: 14, posture: 10, range: 2.7, arc: 2.2, knockback: 1.6, lunge: 1.8, hitstop: 0.04, anim: 'slash', cooldown: 1.1, chain: ['r_slash2'] }),
      move({ id: 'r_slash2', name: 'Drifting Cut', windup: 0.32, active: 0.1, recover: 0.6, damage: 16, posture: 11, range: 2.8, arc: 2.2, knockback: 1.8, lunge: 1.6, hitstop: 0.04, anim: 'slash', cooldown: 0 }),
      move({ id: 'r_thrust', name: 'Reed Point', windup: 0.88, active: 0.1, recover: 0.7, damage: 24, posture: 18, range: 3.6, arc: 0.55, knockback: 2.4, lunge: 3.4, hitstop: 0.06, anim: 'thrust', perilous: true, telegraph: 'red', cooldown: 4.5 }),
    ],
    lore: 'A soldier who kept fighting after his lord became a rumor. The ash never left his clothes.',
  },
  archer: {
    id: 'archer', name: 'Reed Archer', kind: 'archer', behavior: 'ranged',
    hp: 46, posture: 40, damage: 12, speed: 3.1, radius: 0.5, height: 1.72,
    xp: 28, essence: 9,
    colors: { robe: '#4a4434', armor: '#6b5b3f', accent: '#c8a45a', skin: '#c9a184', weapon: '#8b6b42' },
    weapon: 'bow', detection: 26, guard: 0,
    attacks: [
      move({ id: 'a_shot', name: 'Reed Arrow', windup: 0.95, active: 0.05, recover: 0.75, damage: 12, posture: 6, range: 24, arc: 0.4, knockback: 0.8, lunge: 0, hitstop: 0.03, anim: 'cast', cooldown: 2.4, projectile: { speed: 24, radius: 0.22, life: 2.6, color: '#d8c59a', damageType: 'physical' } }),
      move({ id: 'a_kick', name: 'Panic Kick', windup: 0.44, active: 0.08, recover: 0.5, damage: 8, posture: 8, range: 2.0, arc: 1.4, knockback: 2.0, lunge: 0, hitstop: 0.03, anim: 'kick', cooldown: 3 }),
    ],
    lore: 'They shoot the names out of the air before they can be spoken.',
  },
  brute: {
    id: 'brute', name: 'Bell Brute', kind: 'brute', behavior: 'guard',
    hp: 172, posture: 130, damage: 24, speed: 2.6, radius: 0.78, height: 2.15,
    xp: 62, essence: 22,
    colors: { robe: '#3c3230', armor: '#6a4a35', accent: '#b06a3c', skin: '#b98f74', weapon: '#9aa0a2' },
    weapon: 'odachi', detection: 18, guard: 0.3, parryChance: 0.04,
    attacks: [
      move({ id: 'b_cleave', name: 'Grave Cleave', windup: 0.9, active: 0.14, recover: 0.9, damage: 28, posture: 22, range: 3.2, arc: 2.4, knockback: 2.8, lunge: 2.0, hitstop: 0.07, anim: 'overhead', cooldown: 1.8, aoe: { radius: 3.4, delay: 0.62, color: '#d0a070', damageType: 'physical' } }),
      move({ id: 'b_charge', name: 'Bell Charge', windup: 1.0, active: 0.35, recover: 0.8, damage: 20, posture: 18, range: 4.4, arc: 1.5, knockback: 3.4, lunge: 8, hitstop: 0.07, anim: 'kick', cooldown: 5, telegraph: 'gold' }),
    ],
    lore: 'The temple bells were melted for swords. He carries what is left.',
  },
  bell_monk: {
    id: 'bell_monk', name: 'Bell Cultist', kind: 'monk', behavior: 'patrol',
    hp: 92, posture: 88, damage: 16, speed: 3.2, radius: 0.55, height: 1.78,
    xp: 48, essence: 16,
    colors: { robe: '#2e3538', armor: '#556066', accent: '#c9b37a', skin: '#c7a386', weapon: '#b9a06f' },
    weapon: 'staff', detection: 22, guard: 0.22,
    attacks: [
      move({ id: 'm_sweep', name: 'Toll Sweep', windup: 0.62, active: 0.12, recover: 0.62, damage: 16, posture: 14, range: 3.0, arc: 2.6, knockback: 1.8, lunge: 1.4, hitstop: 0.04, anim: 'slash', cooldown: 1.4, chain: ['m_sweep2'] }),
      move({ id: 'm_sweep2', name: 'Toll Sweep', windup: 0.36, active: 0.12, recover: 0.66, damage: 18, posture: 15, range: 3.0, arc: 2.6, knockback: 2.0, lunge: 1.2, hitstop: 0.04, anim: 'slash', cooldown: 0 }),
      move({ id: 'm_ring', name: 'Hollow Note', windup: 1.0, active: 0.08, recover: 0.8, damage: 14, posture: 10, range: 18, arc: 0.5, knockback: 1.2, lunge: 0, hitstop: 0.03, anim: 'cast', cooldown: 4, projectile: { speed: 16, radius: 0.35, life: 2.6, color: '#b9d8d0', damageType: 'sound', ring: true } }),
    ],
    lore: 'They believe the world ended already, and only the echo is left.',
  },
  drowned_spirit: {
    id: 'drowned_spirit', name: 'Drowned Spirit', kind: 'spirit', behavior: 'ambush',
    hp: 66, posture: 54, damage: 15, speed: 4.1, radius: 0.48, height: 1.7,
    xp: 40, essence: 18,
    colors: { robe: '#2d4a4a', armor: '#406a66', accent: '#9fe0d4', skin: '#a7c9c0', weapon: '#bde6de' },
    weapon: 'claws', detection: 24, guard: 0,
    attacks: [
      move({ id: 'ds_rend', name: 'Salt Rend', windup: 0.42, active: 0.1, recover: 0.42, damage: 13, posture: 8, range: 2.2, arc: 2.4, knockback: 1.0, lunge: 2.2, hitstop: 0.04, anim: 'slash', cooldown: 0.9, chain: ['ds_rend2'] }),
      move({ id: 'ds_rend2', name: 'Salt Rend', windup: 0.24, active: 0.1, recover: 0.5, damage: 14, posture: 9, range: 2.3, arc: 2.4, knockback: 1.2, lunge: 1.8, hitstop: 0.04, anim: 'slash', cooldown: 0 }),
      move({ id: 'ds_wail', name: 'Drowned Wail', windup: 0.9, active: 0.1, recover: 0.7, damage: 10, posture: 6, range: 8, arc: 1.2, knockback: 0.5, lunge: 0, hitstop: 0.02, anim: 'cast', cooldown: 5, projectile: { speed: 11, radius: 0.6, life: 1.6, color: '#87d7c9', damageType: 'frost', spread: 3, count: 3 } }),
    ],
    lore: 'The sea keeps what it takes. Sometimes it sends a little back to look for the rest.',
  },
  frost_ronin: {
    id: 'frost_ronin', name: 'Frostbound Ronin', kind: 'grunt', behavior: 'patrol',
    hp: 104, posture: 92, damage: 18, speed: 3.4, radius: 0.58, height: 1.8,
    xp: 56, essence: 18,
    colors: { robe: '#424c52', armor: '#70808a', accent: '#bfe4ef', skin: '#c7b3a4', weapon: '#dcecf0' },
    weapon: 'katana', detection: 21, guard: 0.24,
    attacks: [
      move({ id: 'f_slash', name: 'White Cut', windup: 0.5, active: 0.1, recover: 0.52, damage: 17, posture: 11, range: 2.7, arc: 2.0, knockback: 1.5, lunge: 1.8, hitstop: 0.04, anim: 'slash', cooldown: 1.2, status: { kind: 'frostbite', amount: 14 }, chain: ['f_slash2'] }),
      move({ id: 'f_slash2', name: 'White Cut', windup: 0.3, active: 0.1, recover: 0.58, damage: 19, posture: 12, range: 2.8, arc: 2.2, knockback: 1.8, lunge: 1.5, hitstop: 0.04, anim: 'slash', cooldown: 0, status: { kind: 'frostbite', amount: 14 } }),
      move({ id: 'f_draw', name: 'Frozen Draw', windup: 1.05, active: 0.12, recover: 0.72, damage: 26, posture: 20, range: 4.5, arc: 0.5, knockback: 2.0, lunge: 5.5, hitstop: 0.08, anim: 'thrust', perilous: true, telegraph: 'red', cooldown: 5.5 }),
    ],
  },
  ice_archer: {
    id: 'ice_archer', name: 'Rime Archer', kind: 'archer', behavior: 'ranged',
    hp: 56, posture: 44, damage: 14, speed: 3.0, radius: 0.5, height: 1.72,
    xp: 42, essence: 12,
    colors: { robe: '#43525c', armor: '#6f8794', accent: '#c5e8f4', skin: '#c9b6a8', weapon: '#c8dde5' },
    weapon: 'bow', detection: 28, guard: 0,
    attacks: [
      move({ id: 'ia_shot', name: 'Rime Arrow', windup: 1.0, active: 0.05, recover: 0.72, damage: 14, posture: 6, range: 25, arc: 0.4, knockback: 0.8, lunge: 0, hitstop: 0.03, anim: 'cast', cooldown: 2.5, projectile: { speed: 26, radius: 0.24, life: 2.5, color: '#c9f0ff', damageType: 'frost' }, status: { kind: 'frostbite', amount: 12 } }),
      move({ id: 'ia_step', name: 'Backstep', windup: 0.25, active: 0.05, recover: 0.3, damage: 0, posture: 0, range: 0.1, arc: 0.1, knockback: 0, lunge: -3.4, hitstop: 0, anim: 'kick', cooldown: 4 }),
    ],
  },
  snow_beast: {
    id: 'snow_beast', name: 'Yuki Ape', kind: 'beast', behavior: 'aggressive',
    hp: 186, posture: 120, damage: 22, speed: 3.8, radius: 0.82, height: 2.0,
    xp: 72, essence: 24,
    colors: { robe: '#dce6e8', armor: '#b8c8cc', accent: '#86a8b0', skin: '#e8eff0', weapon: '#e4ecee' },
    weapon: 'claws', detection: 20, guard: 0,
    attacks: [
      move({ id: 'sb_maul', name: 'Avalanche Maul', windup: 0.72, active: 0.14, recover: 0.7, damage: 24, posture: 20, range: 2.8, arc: 2.6, knockback: 2.6, lunge: 2.4, hitstop: 0.07, anim: 'slam', cooldown: 1.5, aoe: { radius: 2.8, delay: 0.55, color: '#dff4ff', damageType: 'frost' } }),
      move({ id: 'sb_leap', name: 'White Leap', windup: 0.85, active: 0.2, recover: 0.75, damage: 20, posture: 16, range: 7.5, arc: 1.6, knockback: 3.0, lunge: 10, hitstop: 0.06, anim: 'slam', cooldown: 5, telegraph: 'gold' }),
    ],
  },
  sand_bandit: {
    id: 'sand_bandit', name: 'Dune Bandit', kind: 'grunt', behavior: 'patrol',
    hp: 88, posture: 78, damage: 16, speed: 3.7, radius: 0.56, height: 1.76,
    xp: 48, essence: 16,
    colors: { robe: '#6b573b', armor: '#8f7448', accent: '#d9b36a', skin: '#b98c68', weapon: '#d0c0a0' },
    weapon: 'dual', detection: 22, guard: 0.14,
    attacks: [
      move({ id: 'sdb_cut', name: 'Sun Cut', windup: 0.38, active: 0.09, recover: 0.36, damage: 12, posture: 8, range: 2.4, arc: 2.2, knockback: 1.2, lunge: 2.2, hitstop: 0.035, anim: 'slash', cooldown: 0.9, chain: ['sdb_cut2', 'sdb_cut3'] }),
      move({ id: 'sdb_cut2', name: 'Sun Cut', windup: 0.26, active: 0.09, recover: 0.36, damage: 12, posture: 8, range: 2.4, arc: 2.2, knockback: 1.2, lunge: 1.8, hitstop: 0.035, anim: 'slash', cooldown: 0 }),
      move({ id: 'sdb_cut3', name: 'Sand Split', windup: 0.4, active: 0.1, recover: 0.52, damage: 18, posture: 13, range: 2.7, arc: 2.6, knockback: 2.2, lunge: 2.4, hitstop: 0.05, anim: 'spin', cooldown: 0 }),
    ],
  },
  dune_stalker: {
    id: 'dune_stalker', name: 'Dune Stalker', kind: 'assassin', behavior: 'ambush',
    hp: 76, posture: 62, damage: 20, speed: 4.3, radius: 0.5, height: 1.74,
    xp: 52, essence: 18,
    colors: { robe: '#4c4437', armor: '#7a6a4f', accent: '#e0c080', skin: '#b08a66', weapon: '#d9d2bd' },
    weapon: 'dual', detection: 26, guard: 0,
    attacks: [
      move({ id: 'dst_dash', name: 'Mirage Step', windup: 0.66, active: 0.12, recover: 0.5, damage: 22, posture: 15, range: 5.0, arc: 1.4, knockback: 2.2, lunge: 8.5, hitstop: 0.06, anim: 'thrust', perilous: true, telegraph: 'red', cooldown: 5 }),
      move({ id: 'dst_slash', name: 'Glass Slash', windup: 0.3, active: 0.08, recover: 0.34, damage: 12, posture: 7, range: 2.2, arc: 2.4, knockback: 1.0, lunge: 1.8, hitstop: 0.03, anim: 'slash', cooldown: 0.9, chain: ['dst_slash2'] }),
      move({ id: 'dst_slash2', name: 'Glass Slash', windup: 0.22, active: 0.08, recover: 0.4, damage: 13, posture: 8, range: 2.2, arc: 2.4, knockback: 1.2, lunge: 1.5, hitstop: 0.03, anim: 'slash', cooldown: 0 }),
    ],
  },
  bamboo_guard: {
    id: 'bamboo_guard', name: 'Bamboo Warden', kind: 'grunt', behavior: 'guard',
    hp: 118, posture: 110, damage: 17, speed: 3.2, radius: 0.6, height: 1.82,
    xp: 56, essence: 18,
    colors: { robe: '#33443a', armor: '#4d614f', accent: '#9fc47f', skin: '#c4a184', weapon: '#c9d4b8' },
    weapon: 'spear', detection: 20, guard: 0.38,
    attacks: [
      move({ id: 'bg_thrust', name: 'Green Reach', windup: 0.62, active: 0.1, recover: 0.58, damage: 16, posture: 12, range: 3.8, arc: 0.7, knockback: 2.0, lunge: 2.6, hitstop: 0.04, anim: 'thrust', cooldown: 1.5, chain: ['bg_thrust2'] }),
      move({ id: 'bg_thrust2', name: 'Green Reach', windup: 0.34, active: 0.1, recover: 0.66, damage: 18, posture: 13, range: 3.9, arc: 0.7, knockback: 2.2, lunge: 2.2, hitstop: 0.04, anim: 'thrust', cooldown: 0 }),
      move({ id: 'bg_sweep', name: 'Bamboo Sweep', windup: 0.8, active: 0.14, recover: 0.72, damage: 22, posture: 18, range: 3.4, arc: 2.8, knockback: 2.6, lunge: 1.4, hitstop: 0.06, anim: 'spin', perilous: true, telegraph: 'red', cooldown: 5 }),
    ],
  },
  bamboo_assassin: {
    id: 'bamboo_assassin', name: 'Bamboo Widow', kind: 'assassin', behavior: 'ambush',
    hp: 72, posture: 58, damage: 19, speed: 4.4, radius: 0.48, height: 1.7,
    xp: 50, essence: 18,
    colors: { robe: '#2e3a36', armor: '#46574c', accent: '#b8d59a', skin: '#c2a088', weapon: '#d6e0cd' },
    weapon: 'dual', detection: 24, guard: 0,
    attacks: [
      move({ id: 'bw_cut', name: 'Silk Cut', windup: 0.26, active: 0.07, recover: 0.3, damage: 11, posture: 6, range: 2.1, arc: 2.3, knockback: 0.8, lunge: 2.0, hitstop: 0.03, anim: 'slash', cooldown: 0.7, chain: ['bw_cut2'] }),
      move({ id: 'bw_cut2', name: 'Silk Cut', windup: 0.2, active: 0.07, recover: 0.34, damage: 12, posture: 7, range: 2.1, arc: 2.3, knockback: 1.0, lunge: 1.8, hitstop: 0.03, anim: 'slash', cooldown: 0, chain: ['bw_cut3'] }),
      move({ id: 'bw_cut3', name: 'Green Silence', windup: 0.42, active: 0.1, recover: 0.5, damage: 18, posture: 12, range: 2.5, arc: 2.8, knockback: 1.8, lunge: 2.2, hitstop: 0.05, anim: 'spin', cooldown: 0 }),
    ],
  },
  ash_knight: {
    id: 'ash_knight', name: 'Cinder Knight', kind: 'brute', behavior: 'guard',
    hp: 168, posture: 140, damage: 24, speed: 2.9, radius: 0.72, height: 2.02,
    xp: 74, essence: 26,
    colors: { robe: '#3a2e2a', armor: '#5b4038', accent: '#e06a3c', skin: '#a87a62', weapon: '#d7b090' },
    weapon: 'odachi', detection: 22, guard: 0.34,
    attacks: [
      move({ id: 'ak_cleave', name: 'Cinder Cleave', windup: 0.82, active: 0.14, recover: 0.78, damage: 26, posture: 20, range: 3.2, arc: 2.4, knockback: 2.8, lunge: 2.2, hitstop: 0.07, anim: 'overhead', cooldown: 1.7, status: { kind: 'burn', amount: 16 }, aoe: { radius: 3.0, delay: 0.62, color: '#ff8a50', damageType: 'fire' } }),
      move({ id: 'ak_guard', name: 'Iron Oath', windup: 0.3, active: 0.1, recover: 0.4, damage: 0, posture: 0, range: 0.1, arc: 0.1, knockback: 0, lunge: 0, hitstop: 0, anim: 'cast', cooldown: 7 }),
    ],
  },
  flame_monk: {
    id: 'flame_monk', name: 'Ember Monk', kind: 'monk', behavior: 'ranged',
    hp: 98, posture: 86, damage: 18, speed: 3.3, radius: 0.55, height: 1.78,
    xp: 58, essence: 20,
    colors: { robe: '#402e2a', armor: '#6a3f2f', accent: '#ff9a5a', skin: '#c09478', weapon: '#d9a06c' },
    weapon: 'staff', detection: 24, guard: 0.1,
    attacks: [
      move({ id: 'fm_bolt', name: 'Ember Bolt', windup: 0.95, active: 0.06, recover: 0.68, damage: 16, posture: 8, range: 20, arc: 0.5, knockback: 0.8, lunge: 0, hitstop: 0.03, anim: 'cast', cooldown: 2.8, projectile: { speed: 19, radius: 0.3, life: 2.2, color: '#ff9a5a', damageType: 'fire' }, status: { kind: 'burn', amount: 14 } }),
      move({ id: 'fm_sweep', name: 'Cinder Staff', windup: 0.52, active: 0.1, recover: 0.56, damage: 15, posture: 12, range: 2.8, arc: 2.4, knockback: 1.6, lunge: 1.6, hitstop: 0.04, anim: 'slash', cooldown: 1.4, chain: ['fm_sweep2'] }),
      move({ id: 'fm_sweep2', name: 'Cinder Staff', windup: 0.3, active: 0.1, recover: 0.6, damage: 17, posture: 13, range: 2.8, arc: 2.4, knockback: 1.8, lunge: 1.3, hitstop: 0.04, anim: 'slash', cooldown: 0 }),
    ],
  },
  hollow_spirit: {
    id: 'hollow_spirit', name: 'Hollow Echo', kind: 'spirit', behavior: 'aggressive',
    hp: 84, posture: 60, damage: 18, speed: 4.0, radius: 0.5, height: 1.72,
    xp: 54, essence: 20,
    colors: { robe: '#2a2a32', armor: '#3d3d4a', accent: '#d6d0ff', skin: '#c9c4d6', weapon: '#e7e3ff' },
    weapon: 'claws', detection: 30, guard: 0,
    attacks: [
      move({ id: 'hs_rend', name: 'Name Rending', windup: 0.36, active: 0.08, recover: 0.32, damage: 12, posture: 7, range: 2.3, arc: 2.5, knockback: 1.0, lunge: 2.4, hitstop: 0.03, anim: 'slash', cooldown: 0.8, chain: ['hs_rend2'] }),
      move({ id: 'hs_rend2', name: 'Name Rending', windup: 0.22, active: 0.08, recover: 0.42, damage: 13, posture: 8, range: 2.4, arc: 2.5, knockback: 1.2, lunge: 2.0, hitstop: 0.03, anim: 'slash', cooldown: 0 }),
      move({ id: 'hs_scream', name: 'Unmaking', windup: 1.1, active: 0.1, recover: 0.8, damage: 12, posture: 6, range: 9, arc: 1.2, knockback: 0.4, lunge: 0, hitstop: 0.02, anim: 'cast', cooldown: 6, projectile: { speed: 12, radius: 0.7, life: 1.8, color: '#d6d0ff', damageType: 'spirit', count: 3, spread: 0.5 } }),
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Mini-bosses — one per region. Same combat grammar, longer arcs, one lesson.
// ─────────────────────────────────────────────────────────────────────────────

const miniBoss = (base: EnemyDef, overrides: Partial<EnemyDef>): EnemyDef => ({
  ...base,
  kind: 'elite',
  behavior: 'aggressive',
  isBoss: true,
  scale: (base.scale ?? 1) * 1.08,
  arenaRadius: 18,
  ...overrides,
});

export const ELITES: Record<string, EnemyDef> = {
  juzo: miniBoss(ENEMIES.ronin, {
    id: 'juzo', name: 'Juzo the Unbowed', title: 'Masterless Ronin',
    hp: 300, posture: 120, damage: 20, xp: 140, essence: 60,
    colors: { robe: '#46382f', armor: '#6d5140', accent: '#d07a45', skin: '#c9a184', weapon: '#e2e8e8' },
    intro: 'cine_juzo_intro', outro: 'cine_juzo_outro', arenaRadius: 16,
    attacks: [
      move({ id: 'jz_cut', name: 'Unbowed Cut', windup: 0.46, active: 0.11, recover: 0.4, damage: 18, posture: 12, range: 3.0, arc: 2.3, knockback: 1.8, lunge: 2.2, hitstop: 0.05, anim: 'slash', cooldown: 1.0, chain: ['jz_cut2', 'jz_cut3'] }),
      move({ id: 'jz_cut2', name: 'Unbowed Cut', windup: 0.24, active: 0.11, recover: 0.42, damage: 18, posture: 12, range: 3.0, arc: 2.3, knockback: 1.8, lunge: 1.8, hitstop: 0.05, anim: 'slash', cooldown: 0 }),
      move({ id: 'jz_cut3', name: 'Unbowed Cut', windup: 0.3, active: 0.12, recover: 0.6, damage: 24, posture: 18, range: 3.2, arc: 2.8, knockback: 2.4, lunge: 2.4, hitstop: 0.07, anim: 'spin', cooldown: 0 }),
      move({ id: 'jz_draw', name: 'Last Lesson', windup: 1.0, active: 0.12, recover: 0.8, damage: 28, posture: 22, range: 5.2, arc: 0.6, knockback: 3.0, lunge: 6.0, hitstop: 0.09, anim: 'thrust', perilous: true, telegraph: 'red', cooldown: 5 }),
    ],
    lore: 'He trained a hundred students. None of them remember his name, so he keeps saying it with his blade.',
  }),
  bell_warden: miniBoss(ENEMIES.bell_monk, {
    id: 'bell_warden', name: 'The Bell Warden', title: 'Keeper of the Drowned Temple',
    hp: 340, posture: 140, xp: 170, essence: 70, scale: 1.2,
    attacks: [
      move({ id: 'bw_sweep', name: 'Temple Sweep', windup: 0.66, active: 0.13, recover: 0.56, damage: 20, posture: 16, range: 3.6, arc: 2.8, knockback: 2.2, lunge: 1.6, hitstop: 0.05, anim: 'slash', cooldown: 1.2, chain: ['bw_sweep2'] }),
      move({ id: 'bw_sweep2', name: 'Temple Sweep', windup: 0.34, active: 0.13, recover: 0.62, damage: 22, posture: 18, range: 3.6, arc: 2.8, knockback: 2.4, lunge: 1.4, hitstop: 0.05, anim: 'slash', cooldown: 0 }),
      move({ id: 'bw_bell', name: 'Great Toll', windup: 1.2, active: 0.15, recover: 0.9, damage: 26, posture: 22, range: 5.0, arc: 3.2, knockback: 2.8, lunge: 0, hitstop: 0.08, anim: 'slam', cooldown: 6, aoe: { radius: 5.0, delay: 0.8, color: '#b9d8d0', damageType: 'sound' } }),
    ],
  }),
  frost_ape: miniBoss(ENEMIES.snow_beast, {
    id: 'frost_ape', name: 'The Pale Ape', title: 'Echo of the White Pass',
    hp: 380, posture: 150, xp: 180, essence: 75, scale: 1.25,
    attacks: [
      move({ id: 'fa_swipe', name: 'Pale Swipe', windup: 0.48, active: 0.12, recover: 0.42, damage: 20, posture: 14, range: 3.2, arc: 2.8, knockback: 2.0, lunge: 2.6, hitstop: 0.05, anim: 'slash', cooldown: 1.0, chain: ['fa_swipe2'] }),
      move({ id: 'fa_swipe2', name: 'Pale Swipe', windup: 0.26, active: 0.12, recover: 0.54, damage: 22, posture: 16, range: 3.2, arc: 2.8, knockback: 2.2, lunge: 2.2, hitstop: 0.05, anim: 'slash', cooldown: 0 }),
      move({ id: 'fa_slam', name: 'White Quake', windup: 1.0, active: 0.18, recover: 0.9, damage: 30, posture: 26, range: 4.0, arc: 3.6, knockback: 3.4, lunge: 0, hitstop: 0.09, anim: 'slam', cooldown: 6, aoe: { radius: 5.5, delay: 0.7, color: '#dff4ff', damageType: 'frost' } }),
    ],
  }),
  dune_wyrm: miniBoss(ENEMIES.snow_beast, {
    id: 'dune_wyrm', name: 'The Glass Wyrm', title: 'Beneath the Dunes',
    hp: 400, posture: 150, xp: 190, essence: 80, scale: 1.2,
    colors: { robe: '#7a6240', armor: '#9a7c4e', accent: '#ffd27a', skin: '#c9a870', weapon: '#e0cfa0' },
    attacks: [
      move({ id: 'dw_bite', name: 'Glass Bite', windup: 0.54, active: 0.12, recover: 0.4, damage: 22, posture: 14, range: 3.4, arc: 1.8, knockback: 2.2, lunge: 3.2, hitstop: 0.05, anim: 'stab', cooldown: 1.0, chain: ['dw_bite2'] }),
      move({ id: 'dw_bite2', name: 'Glass Bite', windup: 0.3, active: 0.12, recover: 0.5, damage: 24, posture: 16, range: 3.4, arc: 1.8, knockback: 2.4, lunge: 2.4, hitstop: 0.05, anim: 'stab', cooldown: 0 }),
      move({ id: 'dw_burst', name: 'Sandburst', windup: 1.15, active: 0.2, recover: 0.8, damage: 26, posture: 20, range: 6.0, arc: 3.6, knockback: 3.2, lunge: 0, hitstop: 0.08, anim: 'slam', cooldown: 6, aoe: { radius: 6.0, delay: 0.75, color: '#ffd27a', damageType: 'physical' } }),
    ],
  }),
  bamboo_widow: miniBoss(ENEMIES.bamboo_assassin, {
    id: 'bamboo_widow', name: 'The Bamboo Widow', title: 'She Who Waits Between Stalks',
    hp: 360, posture: 130, xp: 180, essence: 70, scale: 1.05,
    attacks: [
      move({ id: 'bwidow_cut', name: 'Silk Rain', windup: 0.22, active: 0.08, recover: 0.26, damage: 14, posture: 8, range: 2.6, arc: 2.6, knockback: 1.0, lunge: 2.6, hitstop: 0.03, anim: 'slash', cooldown: 0.6, chain: ['bwidow_cut2', 'bwidow_cut3'] }),
      move({ id: 'bwidow_cut2', name: 'Silk Rain', windup: 0.18, active: 0.08, recover: 0.28, damage: 14, posture: 8, range: 2.6, arc: 2.6, knockback: 1.0, lunge: 2.2, hitstop: 0.03, anim: 'slash', cooldown: 0 }),
      move({ id: 'bwidow_cut3', name: 'Silk Rain', windup: 0.3, active: 0.1, recover: 0.52, damage: 22, posture: 14, range: 3.0, arc: 3.2, knockback: 2.2, lunge: 2.0, hitstop: 0.06, anim: 'spin', cooldown: 0 }),
      move({ id: 'bwidow_dash', name: 'Green Silence', windup: 0.8, active: 0.12, recover: 0.6, damage: 28, posture: 20, range: 6.2, arc: 1.0, knockback: 2.8, lunge: 9.0, hitstop: 0.07, anim: 'thrust', perilous: true, telegraph: 'red', cooldown: 6 }),
    ],
  }),
  ash_knight_captain: miniBoss(ENEMIES.ash_knight, {
    id: 'ash_knight_captain', name: 'The Cinder Captain', title: 'Last Knight of the Hollow Court',
    hp: 440, posture: 180, xp: 220, essence: 90, scale: 1.15,
    attacks: [
      move({ id: 'akc_cleave', name: 'Cinder Oath', windup: 0.72, active: 0.15, recover: 0.66, damage: 26, posture: 20, range: 3.6, arc: 2.6, knockback: 2.8, lunge: 2.2, hitstop: 0.07, anim: 'overhead', cooldown: 1.4, chain: ['akc_cleave2'] }),
      move({ id: 'akc_cleave2', name: 'Cinder Oath', windup: 0.4, active: 0.15, recover: 0.8, damage: 30, posture: 24, range: 3.8, arc: 2.8, knockback: 3.0, lunge: 2.0, hitstop: 0.08, anim: 'spin', cooldown: 0 }),
      move({ id: 'akc_pyre', name: 'Knight\'s Pyre', windup: 1.25, active: 0.2, recover: 0.9, damage: 34, posture: 26, range: 5.5, arc: 3.6, knockback: 3.4, lunge: 0, hitstop: 0.1, anim: 'slam', cooldown: 7, aoe: { radius: 5.5, delay: 0.85, color: '#ff8a50', damageType: 'fire', linger: 3 } }),
    ],
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Main bosses
// ─────────────────────────────────────────────────────────────────────────────

export const BOSSES: Record<string, EnemyDef> = {
  ushio: {
    id: 'ushio', name: 'Ushio', title: 'Warden of the Tide', kind: 'boss', behavior: 'boss',
    hp: 820, posture: 170, damage: 22, speed: 3.4, radius: 0.9, height: 2.3, scale: 1.18,
    xp: 420, essence: 240, isBoss: true, arenaRadius: 34, weapon: 'spear', detection: 60,
    colors: { robe: '#17383c', armor: '#2f6b68', accent: '#7fe0d0', skin: '#a8c9c2', weapon: '#d7f4ec' },
    motif: 'tide', intro: 'cine_ushio_intro', outro: 'cine_ushio_outro',
    music: { mood: 'boss', root: 50, scale: [0, 2, 3, 5, 7, 8, 10], bpm: 92, intensity: 2 },
    attacks: [
      move({ id: 'u_sweep', name: 'Tide Sweep', windup: 0.58, active: 0.13, recover: 0.46, damage: 20, posture: 16, range: 4.2, arc: 2.8, knockback: 2.2, lunge: 2.2, hitstop: 0.05, anim: 'slash', cooldown: 1.1, chain: ['u_sweep2'] }),
      move({ id: 'u_sweep2', name: 'Tide Sweep', windup: 0.34, active: 0.13, recover: 0.58, damage: 22, posture: 17, range: 4.2, arc: 2.8, knockback: 2.4, lunge: 1.8, hitstop: 0.05, anim: 'spin', cooldown: 0 }),
      move({ id: 'u_coral', name: 'Coral Volley', windup: 1.0, active: 0.1, recover: 0.7, damage: 16, posture: 8, range: 30, arc: 0.6, knockback: 1.0, lunge: 0, hitstop: 0.03, anim: 'cast', cooldown: 4.5, projectile: { speed: 19, radius: 0.35, life: 2.6, color: '#7fe0d0', damageType: 'physical', count: 3, spread: 0.35 } }),
      move({ id: 'u_tide', name: 'The Tide Answers', windup: 1.15, active: 0.15, recover: 0.85, damage: 28, posture: 20, range: 9.0, arc: 2.0, knockback: 3.0, lunge: 0, hitstop: 0.08, anim: 'slam', cooldown: 7, aoe: { radius: 6.5, delay: 0.85, color: '#7fe0d0', damageType: 'physical', pull: 3 } }),
      move({ id: 'u_undertow', name: 'Undertow', windup: 1.4, active: 0.2, recover: 0.9, damage: 18, posture: 12, range: 8.0, arc: 3.6, knockback: 1.4, lunge: 0, hitstop: 0.05, anim: 'cast', cooldown: 9, aoe: { radius: 8.0, delay: 1.0, color: '#3f8f8a', damageType: 'frost', pull: 8 } }),
    ],
    phases: [
      { threshold: 1, name: 'The Drowned General', moves: ['u_sweep', 'u_sweep2', 'u_coral', 'u_tide'], speedMultiplier: 1, damageMultiplier: 1 },
      { threshold: 0.5, name: 'The Sea Remembers', line: 'You cannot parry the ocean, little blade.', moves: ['u_sweep', 'u_coral', 'u_tide', 'u_undertow'], speedMultiplier: 1.18, damageMultiplier: 1.15, aura: 'none', arena: 'storm' },
    ],
    lore: 'He held the strait against an army that had already forgotten why it fought. When the sea rose, he saluted it.',
  },
  kane: {
    id: 'kane', name: 'Kane', title: 'The Bellkeeper', kind: 'boss', behavior: 'boss',
    hp: 900, posture: 200, damage: 24, speed: 3.1, radius: 0.9, height: 2.4, scale: 1.2,
    xp: 460, essence: 260, isBoss: true, arenaRadius: 28, weapon: 'bell', detection: 60,
    colors: { robe: '#2b3032', armor: '#5b6266', accent: '#e0c98a', skin: '#b8aa96', weapon: '#d8c59a' },
    motif: 'bell', intro: 'cine_kane_intro', outro: 'cine_kane_outro',
    music: { mood: 'boss', root: 45, scale: [0, 1, 5, 7, 8, 10], bpm: 74, intensity: 2 },
    attacks: [
      move({ id: 'k_slam', name: 'Great Toll', windup: 1.0, active: 0.16, recover: 0.85, damage: 28, posture: 22, range: 4.4, arc: 3.4, knockback: 3.0, lunge: 0, hitstop: 0.09, anim: 'slam', cooldown: 3, aoe: { radius: 5.2, delay: 0.75, color: '#e0c98a', damageType: 'sound' } }),
      move({ id: 'k_ring', name: 'Hollow Note', windup: 0.9, active: 0.1, recover: 0.65, damage: 18, posture: 10, range: 40, arc: 1.0, knockback: 1.2, lunge: 0, hitstop: 0.03, anim: 'cast', cooldown: 4, projectile: { speed: 15, radius: 0.5, life: 3.0, color: '#e0c98a', damageType: 'sound', ring: true } }),
      move({ id: 'k_lance', name: 'Sound Lance', windup: 0.95, active: 0.1, recover: 0.6, damage: 22, posture: 12, range: 30, arc: 0.5, knockback: 1.8, lunge: 0, hitstop: 0.04, anim: 'cast', cooldown: 3.5, projectile: { speed: 30, radius: 0.3, life: 1.8, color: '#f0dfb0', damageType: 'sound' } }),
      move({ id: 'k_silence', name: 'The Silence Between', windup: 1.6, active: 0.2, recover: 0.9, damage: 10, posture: 6, range: 10, arc: 3.6, knockback: 0.5, lunge: 0, hitstop: 0.02, anim: 'cast', cooldown: 10, aoe: { radius: 9.0, delay: 1.2, color: '#616a70', damageType: 'sound', linger: 2 } }),
    ],
    phases: [
      { threshold: 1, name: 'First Toll', moves: ['k_slam', 'k_ring', 'k_lance'], speedMultiplier: 1, damageMultiplier: 1 },
      { threshold: 0.55, name: 'Requiem', line: 'Listen. The world is already an echo.', moves: ['k_slam', 'k_ring', 'k_lance', 'k_silence'], speedMultiplier: 1.12, damageMultiplier: 1.2, arena: 'void' },
    ],
    lore: 'He was the last monk in the drowned temple. He kept ringing the bell so the dead would know which way was up.',
  },
  yuki: {
    id: 'yuki', name: 'Yuki', title: 'The White Silence', kind: 'boss', behavior: 'boss',
    hp: 980, posture: 180, damage: 24, speed: 3.9, radius: 0.82, height: 2.1, scale: 1.1,
    xp: 520, essence: 280, isBoss: true, arenaRadius: 32, weapon: 'katana', detection: 60,
    colors: { robe: '#dbe8ec', armor: '#9cb8c2', accent: '#7fd9ff', skin: '#e2d6cd', weapon: '#dff6ff' },
    motif: 'ice', intro: 'cine_yuki_intro', outro: 'cine_yuki_outro',
    music: { mood: 'boss', root: 52, scale: [0, 2, 3, 5, 7, 9, 10], bpm: 84, intensity: 2 },
    attacks: [
      move({ id: 'y_fan', name: 'Snow Fan', windup: 0.48, active: 0.1, recover: 0.4, damage: 18, posture: 12, range: 3.2, arc: 2.6, knockback: 1.8, lunge: 2.4, hitstop: 0.04, anim: 'slash', cooldown: 0.9, status: { kind: 'frostbite', amount: 14 }, chain: ['y_fan2'] }),
      move({ id: 'y_fan2', name: 'Snow Fan', windup: 0.26, active: 0.1, recover: 0.42, damage: 18, posture: 12, range: 3.2, arc: 2.6, knockback: 1.8, lunge: 2.0, hitstop: 0.04, anim: 'slash', cooldown: 0, chain: ['y_fan3'] }),
      move({ id: 'y_fan3', name: 'White Out', windup: 0.4, active: 0.12, recover: 0.6, damage: 24, posture: 16, range: 3.6, arc: 3.2, knockback: 2.6, lunge: 2.2, hitstop: 0.06, anim: 'spin', cooldown: 0 }),
      move({ id: 'y_step', name: 'Mirror Step', windup: 0.7, active: 0.12, recover: 0.5, damage: 26, posture: 18, range: 7.0, arc: 1.0, knockback: 2.6, lunge: 10, hitstop: 0.07, anim: 'thrust', perilous: true, telegraph: 'red', cooldown: 5 }),
      move({ id: 'y_blizzard', name: 'Blizzard', windup: 1.4, active: 0.2, recover: 0.9, damage: 12, posture: 8, range: 10, arc: 3.6, knockback: 0.8, lunge: 0, hitstop: 0.02, anim: 'cast', cooldown: 9, aoe: { radius: 8.5, delay: 1.0, color: '#bfefff', damageType: 'frost', linger: 4 } }),
    ],
    phases: [
      { threshold: 1, name: 'The Bride in White', moves: ['y_fan', 'y_fan2', 'y_fan3', 'y_step'], speedMultiplier: 1, damageMultiplier: 1 },
      { threshold: 0.5, name: 'A Wedding Without Guests', line: 'You came. You always come too late.', moves: ['y_fan', 'y_step', 'y_blizzard'], speedMultiplier: 1.15, damageMultiplier: 1.15, aura: 'frost', arena: 'blizzard' },
    ],
    lore: 'She waited at the pass for a groom who took the wrong road. The snow kept her bouquet fresh.',
  },
  kaji: {
    id: 'kaji', name: 'Kaji', title: 'The Ember Monk', kind: 'boss', behavior: 'boss',
    hp: 1050, posture: 200, damage: 26, speed: 3.2, radius: 0.88, height: 2.25, scale: 1.16,
    xp: 560, essence: 300, isBoss: true, arenaRadius: 30, weapon: 'staff', detection: 60,
    colors: { robe: '#3a241f', armor: '#6e3a28', accent: '#ff8a45', skin: '#c08a68', weapon: '#d9a06c' },
    motif: 'ember', intro: 'cine_kaji_intro', outro: 'cine_kaji_outro',
    music: { mood: 'boss', root: 43, scale: [0, 1, 3, 5, 7, 8, 10], bpm: 100, intensity: 3 },
    attacks: [
      move({ id: 'ka_sweep', name: 'Pyre Staff', windup: 0.56, active: 0.13, recover: 0.46, damage: 20, posture: 14, range: 3.6, arc: 2.8, knockback: 2.0, lunge: 2.2, hitstop: 0.05, anim: 'slash', cooldown: 1.0, status: { kind: 'burn', amount: 16 }, chain: ['ka_sweep2'] }),
      move({ id: 'ka_sweep2', name: 'Pyre Staff', windup: 0.3, active: 0.13, recover: 0.52, damage: 22, posture: 16, range: 3.6, arc: 2.8, knockback: 2.2, lunge: 1.8, hitstop: 0.05, anim: 'spin', cooldown: 0 }),
      move({ id: 'ka_pillar', name: 'Ember Pillar', windup: 1.25, active: 0.15, recover: 0.8, damage: 30, posture: 20, range: 10, arc: 3.6, knockback: 2.6, lunge: 0, hitstop: 0.07, anim: 'slam', cooldown: 6, aoe: { radius: 4.0, delay: 0.85, color: '#ff8a45', damageType: 'fire', linger: 3 } }),
      move({ id: 'ka_wave', name: 'Heat Shimmer', windup: 1.0, active: 0.14, recover: 0.7, damage: 22, posture: 14, range: 12, arc: 1.0, knockback: 2.0, lunge: 0, hitstop: 0.04, anim: 'cast', cooldown: 5, projectile: { speed: 18, radius: 0.6, life: 2.4, color: '#ffb070', damageType: 'fire', ring: true } }),
    ],
    phases: [
      { threshold: 1, name: 'The Warmth He Chose', moves: ['ka_sweep', 'ka_pillar', 'ka_wave'], speedMultiplier: 1, damageMultiplier: 1 },
      { threshold: 0.5, name: 'Immolation', line: 'Cold is only a name for fear.', moves: ['ka_sweep', 'ka_pillar', 'ka_wave'], speedMultiplier: 1.15, damageMultiplier: 1.2, aura: 'fire', arena: 'inferno' },
    ],
    lore: 'He burned his monastery to keep one child warm. The child lived. The fire never went out.',
  },
  sabaku: {
    id: 'sabaku', name: 'Sabaku', title: 'Queen of the Drowned Dunes', kind: 'boss', behavior: 'boss',
    hp: 1150, posture: 210, damage: 26, speed: 3.6, radius: 0.86, height: 2.15, scale: 1.12,
    xp: 600, essence: 320, isBoss: true, arenaRadius: 36, weapon: 'dual', detection: 60,
    colors: { robe: '#6b4a2c', armor: '#a67c42', accent: '#ffd27a', skin: '#b98a64', weapon: '#e8d8a8' },
    motif: 'sand', intro: 'cine_sabaku_intro', outro: 'cine_sabaku_outro',
    music: { mood: 'boss', root: 48, scale: [0, 1, 4, 5, 7, 8, 11], bpm: 108, intensity: 2 },
    attacks: [
      move({ id: 'sa_cut', name: 'Sunscour', windup: 0.34, active: 0.09, recover: 0.3, damage: 14, posture: 9, range: 2.8, arc: 2.4, knockback: 1.4, lunge: 2.8, hitstop: 0.03, anim: 'slash', cooldown: 0.7, chain: ['sa_cut2', 'sa_cut3'] }),
      move({ id: 'sa_cut2', name: 'Sunscour', windup: 0.22, active: 0.09, recover: 0.3, damage: 14, posture: 9, range: 2.8, arc: 2.4, knockback: 1.4, lunge: 2.2, hitstop: 0.03, anim: 'slash', cooldown: 0 }),
      move({ id: 'sa_cut3', name: 'Sunscour', windup: 0.32, active: 0.1, recover: 0.46, damage: 22, posture: 14, range: 3.2, arc: 3.2, knockback: 2.4, lunge: 2.6, hitstop: 0.06, anim: 'spin', cooldown: 0 }),
      move({ id: 'sa_spikes', name: 'Dune Teeth', windup: 1.0, active: 0.12, recover: 0.75, damage: 22, posture: 12, range: 16, arc: 1.2, knockback: 1.6, lunge: 0, hitstop: 0.04, anim: 'cast', cooldown: 5, projectile: { speed: 22, radius: 0.4, life: 2.0, color: '#ffd27a', damageType: 'physical', count: 4, spread: 0.5 } }),
      move({ id: 'sa_storm', name: 'Queen\'s Sandstorm', windup: 1.6, active: 0.2, recover: 1.0, damage: 8, posture: 5, range: 12, arc: 3.6, knockback: 0.5, lunge: 0, hitstop: 0.02, anim: 'cast', cooldown: 11, aoe: { radius: 10.0, delay: 1.2, color: '#c9a45f', damageType: 'physical', linger: 3 } }),
    ],
    phases: [
      { threshold: 1, name: 'The Last Court', moves: ['sa_cut', 'sa_cut2', 'sa_cut3', 'sa_spikes'], speedMultiplier: 1, damageMultiplier: 1 },
      { threshold: 0.55, name: 'Drowned Dunes', line: 'My kingdom is under the sand. You are standing on the roof.', moves: ['sa_cut', 'sa_spikes', 'sa_storm'], speedMultiplier: 1.15, damageMultiplier: 1.15, aura: 'sand', arena: 'sandstorm' },
    ],
    lore: 'Her oasis was sold to a god for a single rain. The god forgot to pay. She has been collecting interest ever since.',
  },
  mori: {
    id: 'mori', name: 'Mori', title: 'The Last Gardener', kind: 'boss', behavior: 'boss',
    hp: 1250, posture: 220, damage: 28, speed: 2.9, radius: 0.98, height: 2.5, scale: 1.3,
    xp: 640, essence: 340, isBoss: true, arenaRadius: 34, weapon: 'claws', detection: 60,
    colors: { robe: '#2d3b2c', armor: '#4a623f', accent: '#a8d98a', skin: '#b8a67e', weapon: '#cfe0b0' },
    motif: 'root', intro: 'cine_mori_intro', outro: 'cine_mori_outro',
    music: { mood: 'boss', root: 41, scale: [0, 2, 3, 5, 7, 8, 10], bpm: 68, intensity: 2 },
    attacks: [
      move({ id: 'mo_slam', name: 'Rootfall', windup: 0.95, active: 0.16, recover: 0.8, damage: 30, posture: 24, range: 4.4, arc: 3.4, knockback: 3.0, lunge: 0, hitstop: 0.09, anim: 'slam', cooldown: 4, aoe: { radius: 5.2, delay: 0.7, color: '#a8d98a', damageType: 'physical' } }),
      move({ id: 'mo_swipe', name: 'Thorn Hand', windup: 0.55, active: 0.13, recover: 0.44, damage: 22, posture: 16, range: 3.6, arc: 2.8, knockback: 2.2, lunge: 2.4, hitstop: 0.05, anim: 'slash', cooldown: 1.1, chain: ['mo_swipe2'] }),
      move({ id: 'mo_swipe2', name: 'Thorn Hand', windup: 0.3, active: 0.13, recover: 0.6, damage: 24, posture: 18, range: 3.6, arc: 2.8, knockback: 2.4, lunge: 2.0, hitstop: 0.05, anim: 'slash', cooldown: 0 }),
      move({ id: 'mo_thorns', name: 'Seed Volley', windup: 1.0, active: 0.1, recover: 0.7, damage: 16, posture: 8, range: 22, arc: 1.0, knockback: 1.0, lunge: 0, hitstop: 0.02, anim: 'cast', cooldown: 4.5, projectile: { speed: 17, radius: 0.32, life: 2.4, color: '#c8ff9a', damageType: 'poison', count: 5, spread: 0.6 }, status: { kind: 'poison', amount: 16 } }),
      move({ id: 'mo_grasp', name: 'The Garden Takes', windup: 1.3, active: 0.2, recover: 0.9, damage: 18, posture: 10, range: 9, arc: 3.6, knockback: 0.8, lunge: 0, hitstop: 0.04, anim: 'cast', cooldown: 9, aoe: { radius: 8.0, delay: 1.0, color: '#7fbf62', damageType: 'poison', pull: 9, linger: 2 } }),
    ],
    phases: [
      { threshold: 1, name: 'The Gardener', moves: ['mo_swipe', 'mo_slam', 'mo_thorns', 'mo_grasp'], speedMultiplier: 1, damageMultiplier: 1 },
      { threshold: 0.5, name: 'Everything Grows', line: 'You are standing in my garden. Everything here is mine.', moves: ['mo_swipe', 'mo_slam', 'mo_thorns', 'mo_grasp'], speedMultiplier: 1.1, damageMultiplier: 1.2, aura: 'poison', arena: 'bloom' },
    ],
    lore: 'He was told the garden would die without a keeper. He never asked who told him.',
  },
  futari: {
    id: 'futari', name: 'Futari', title: 'The Twin Blades', kind: 'boss', behavior: 'boss',
    hp: 1150, posture: 190, damage: 26, speed: 4.2, radius: 0.72, height: 1.95, scale: 1.02,
    xp: 660, essence: 340, isBoss: true, arenaRadius: 30, weapon: 'dual', detection: 60,
    colors: { robe: '#2b2f3a', armor: '#484f66', accent: '#b8b6ff', skin: '#c7b8a8', weapon: '#e8e8ff' },
    motif: 'twin', intro: 'cine_futari_intro', outro: 'cine_futari_outro',
    music: { mood: 'boss', root: 47, scale: [0, 1, 3, 6, 7, 8, 10], bpm: 116, intensity: 3 },
    attacks: [
      move({ id: 'fu_cut', name: 'One Breath', windup: 0.24, active: 0.07, recover: 0.24, damage: 12, posture: 7, range: 2.6, arc: 2.4, knockback: 1.0, lunge: 2.6, hitstop: 0.03, anim: 'slash', cooldown: 0.5, chain: ['fu_cut2', 'fu_cut3'] }),
      move({ id: 'fu_cut2', name: 'One Breath', windup: 0.18, active: 0.07, recover: 0.26, damage: 12, posture: 7, range: 2.6, arc: 2.4, knockback: 1.0, lunge: 2.2, hitstop: 0.03, anim: 'slash', cooldown: 0 }),
      move({ id: 'fu_cut3', name: 'Two Bodies', windup: 0.28, active: 0.09, recover: 0.44, damage: 18, posture: 12, range: 3.0, arc: 3.2, knockback: 2.0, lunge: 2.2, hitstop: 0.05, anim: 'spin', cooldown: 0 }),
      move({ id: 'fu_dash', name: 'Between Stalks', windup: 0.75, active: 0.1, recover: 0.5, damage: 26, posture: 18, range: 7.5, arc: 1.0, knockback: 2.4, lunge: 11, hitstop: 0.07, anim: 'thrust', perilous: true, telegraph: 'red', cooldown: 5.5 }),
      move({ id: 'fu_smoke', name: 'Smoke of Two', windup: 1.1, active: 0.1, recover: 0.8, damage: 8, posture: 4, range: 9, arc: 3.6, knockback: 0.4, lunge: 0, hitstop: 0.02, anim: 'cast', cooldown: 8, aoe: { radius: 8.0, delay: 0.9, color: '#7a7f99', damageType: 'physical', linger: 3 } }),
      move({ id: 'fu_storm', name: 'Twin Storm', windup: 0.75, active: 0.4, recover: 0.7, damage: 12, posture: 6, range: 3.2, arc: 3.6, knockback: 1.0, lunge: 2.8, hitstop: 0.025, anim: 'spin', cooldown: 7 }),
    ],
    phases: [
      { threshold: 1, name: 'Two Shadows', moves: ['fu_cut', 'fu_cut2', 'fu_cut3', 'fu_dash'], speedMultiplier: 1, damageMultiplier: 1 },
      { threshold: 0.5, name: 'One Name', line: 'Which of us do you think you are killing?', moves: ['fu_cut', 'fu_dash', 'fu_smoke', 'fu_storm'], speedMultiplier: 1.2, damageMultiplier: 1.1, arena: 'void' },
    ],
    lore: 'They were born with one name between them. They have been trying to decide who keeps it for thirty years.',
  },
  kage: {
    id: 'kage', name: 'Kage', title: 'The Masked Shogun', kind: 'boss', behavior: 'boss',
    hp: 1300, posture: 240, damage: 28, speed: 3.8, radius: 0.86, height: 2.1, scale: 1.1,
    xp: 720, essence: 380, isBoss: true, arenaRadius: 30, weapon: 'katana', detection: 60,
    colors: { robe: '#1f2228', armor: '#3d414c', accent: '#c94b3a', skin: '#b89680', weapon: '#e9eef0' },
    motif: 'mask', intro: 'cine_kage_intro', outro: 'cine_kage_outro',
    music: { mood: 'boss', root: 44, scale: [0, 1, 3, 5, 6, 8, 10], bpm: 96, intensity: 3 },
    attacks: [
      move({ id: 'kg_cut', name: 'Court Etiquette', windup: 0.4, active: 0.1, recover: 0.36, damage: 16, posture: 11, range: 2.9, arc: 2.2, knockback: 1.6, lunge: 2.4, hitstop: 0.04, anim: 'slash', cooldown: 0.8, chain: ['kg_cut2'] }),
      move({ id: 'kg_cut2', name: 'Court Etiquette', windup: 0.24, active: 0.1, recover: 0.42, damage: 18, posture: 12, range: 3.0, arc: 2.4, knockback: 1.8, lunge: 2.0, hitstop: 0.04, anim: 'slash', cooldown: 0 }),
      move({ id: 'kg_iaido', name: 'Iai: Severance', windup: 1.05, active: 0.12, recover: 0.72, damage: 34, posture: 24, range: 8.0, arc: 0.7, knockback: 3.2, lunge: 12, hitstop: 0.1, anim: 'thrust', perilous: true, telegraph: 'red', cooldown: 6 }),
      move({ id: 'kg_shadow', name: 'Shadow Step', windup: 0.5, active: 0.12, recover: 0.5, damage: 22, posture: 16, range: 6.0, arc: 1.4, knockback: 2.2, lunge: 9, hitstop: 0.06, anim: 'slash', cooldown: 4 }),
      move({ id: 'kg_puppets', name: 'Court of Masks', windup: 1.2, active: 0.1, recover: 0.8, damage: 14, posture: 8, range: 26, arc: 1.0, knockback: 1.0, lunge: 0, hitstop: 0.03, anim: 'cast', cooldown: 6, projectile: { speed: 20, radius: 0.35, life: 2.4, color: '#c94b3a', damageType: 'spirit', count: 4, spread: 0.45 } }),
      move({ id: 'kg_void', name: 'Void Verdict', windup: 1.3, active: 0.2, recover: 0.9, damage: 30, posture: 22, range: 10, arc: 3.6, knockback: 2.8, lunge: 0, hitstop: 0.08, anim: 'slam', cooldown: 9, aoe: { radius: 8.5, delay: 0.95, color: '#c94b3a', damageType: 'spirit' } }),
    ],
    phases: [
      { threshold: 1, name: 'The Mask', moves: ['kg_cut', 'kg_cut2', 'kg_shadow', 'kg_puppets'], speedMultiplier: 1, damageMultiplier: 1 },
      { threshold: 0.5, name: 'The Face Beneath', line: 'A mask is not a lie. It is a promise you can keep.', moves: ['kg_cut', 'kg_iaido', 'kg_shadow', 'kg_void'], speedMultiplier: 1.18, damageMultiplier: 1.2, arena: 'void' },
    ],
    lore: 'He serves a throne with no king. He has worn a different face every year so no one can ask him why.',
  },
  yu: {
    id: 'yu', name: 'Yū', title: 'Bride of Ash', kind: 'boss', behavior: 'boss',
    hp: 1450, posture: 230, damage: 30, speed: 3.5, radius: 0.9, height: 2.2, scale: 1.14,
    xp: 800, essence: 420, isBoss: true, arenaRadius: 34, weapon: 'chains', detection: 60,
    colors: { robe: '#3a2226', armor: '#6e3030', accent: '#ff6a5a', skin: '#d6b8a8', weapon: '#ffb0a0' },
    motif: 'bride', intro: 'cine_yu_intro', outro: 'cine_yu_outro',
    music: { mood: 'boss', root: 42, scale: [0, 1, 3, 5, 6, 9, 10], bpm: 88, intensity: 3 },
    attacks: [
      move({ id: 'yu_chain', name: 'Marriage Chain', windup: 0.62, active: 0.14, recover: 0.5, damage: 22, posture: 16, range: 5.4, arc: 2.8, knockback: 2.2, lunge: 2.0, hitstop: 0.05, anim: 'slash', cooldown: 1.0, status: { kind: 'burn', amount: 16 }, chain: ['yu_chain2'] }),
      move({ id: 'yu_chain2', name: 'Marriage Chain', windup: 0.34, active: 0.14, recover: 0.6, damage: 24, posture: 18, range: 5.4, arc: 3.0, knockback: 2.4, lunge: 1.8, hitstop: 0.05, anim: 'spin', cooldown: 0 }),
      move({ id: 'yu_bells', name: 'Wedding Bells', windup: 1.0, active: 0.1, recover: 0.7, damage: 18, posture: 10, range: 26, arc: 1.0, knockback: 1.2, lunge: 0, hitstop: 0.03, anim: 'cast', cooldown: 4.5, projectile: { speed: 18, radius: 0.4, life: 2.4, color: '#ff9a80', damageType: 'fire', count: 4, spread: 0.5 } }),
      move({ id: 'yu_pyre', name: 'Wedding Pyre', windup: 1.35, active: 0.2, recover: 0.9, damage: 32, posture: 22, range: 10, arc: 3.6, knockback: 2.8, lunge: 0, hitstop: 0.08, anim: 'slam', cooldown: 8, aoe: { radius: 7.5, delay: 1.0, color: '#ff6a5a', damageType: 'fire', linger: 4 } }),
      move({ id: 'yu_veil', name: 'Veil of Ash', windup: 0.7, active: 0.12, recover: 0.55, damage: 26, posture: 18, range: 6.5, arc: 1.2, knockback: 2.4, lunge: 10, hitstop: 0.07, anim: 'thrust', cooldown: 5, telegraph: 'gold' }),
      move({ id: 'yu_embrace', name: 'The Last Dance', windup: 1.4, active: 0.2, recover: 1.0, damage: 36, posture: 24, range: 6.0, arc: 3.6, knockback: 3.4, lunge: 0, hitstop: 0.1, anim: 'cast', cooldown: 12, aoe: { radius: 6.0, delay: 1.1, color: '#ffb0a0', damageType: 'fire', pull: 4 } }),
    ],
    phases: [
      { threshold: 1, name: 'The Bride', moves: ['yu_chain', 'yu_chain2', 'yu_bells', 'yu_veil'], speedMultiplier: 1, damageMultiplier: 1 },
      { threshold: 0.5, name: 'The Fire Takes Its Due', line: 'He promised me a garden. He gave me a pyre. Come dance.', moves: ['yu_chain', 'yu_bells', 'yu_pyre', 'yu_embrace'], speedMultiplier: 1.12, damageMultiplier: 1.2, aura: 'fire', arena: 'inferno' },
    ],
    lore: 'The wedding was supposed to end the war. It ended the guests instead. She has been waiting at the altar ever since.',
  },
  crown: {
    id: 'crown', name: 'The Hollow Crown', title: 'That Which Forgot Itself', kind: 'boss', behavior: 'boss',
    hp: 2200, posture: 300, damage: 32, speed: 3.9, radius: 1.05, height: 2.8, scale: 1.35,
    xp: 1500, essence: 800, isBoss: true, arenaRadius: 40, weapon: 'none', detection: 80,
    colors: { robe: '#1a1820', armor: '#3a3348', accent: '#e8dcff', skin: '#c8c0d8', weapon: '#f0eaff' },
    motif: 'crown', intro: 'cine_crown_intro', outro: 'cine_crown_outro',
    music: { mood: 'boss', root: 40, scale: [0, 1, 2, 3, 5, 6, 8, 10], bpm: 104, intensity: 3 },
    attacks: [
      move({ id: 'cr_slash', name: 'Mirror Cut', windup: 0.42, active: 0.12, recover: 0.4, damage: 22, posture: 16, range: 3.6, arc: 2.8, knockback: 2.0, lunge: 3.0, hitstop: 0.05, anim: 'slash', cooldown: 0.8, chain: ['cr_slash2'] }),
      move({ id: 'cr_slash2', name: 'Mirror Cut', windup: 0.26, active: 0.12, recover: 0.5, damage: 24, posture: 18, range: 3.8, arc: 3.0, knockback: 2.2, lunge: 2.6, hitstop: 0.05, anim: 'spin', cooldown: 0 }),
      move({ id: 'cr_echo', name: 'Echoes of the Fallen', windup: 1.1, active: 0.15, recover: 0.8, damage: 18, posture: 10, range: 30, arc: 1.2, knockback: 1.2, lunge: 0, hitstop: 0.03, anim: 'cast', cooldown: 5, projectile: { speed: 20, radius: 0.38, life: 2.6, color: '#e8dcff', damageType: 'spirit', count: 6, spread: 0.7 } }),
      move({ id: 'cr_ring', name: 'Crownfall', windup: 1.5, active: 0.2, recover: 1.0, damage: 34, posture: 24, range: 14, arc: 3.6, knockback: 3.4, lunge: 0, hitstop: 0.09, anim: 'slam', cooldown: 9, aoe: { radius: 9.5, delay: 1.0, color: '#e8dcff', damageType: 'spirit' } }),
      move({ id: 'cr_silence', name: 'The Hush', windup: 1.8, active: 0.2, recover: 1.0, damage: 14, posture: 8, range: 16, arc: 3.6, knockback: 0.5, lunge: 0, hitstop: 0.02, anim: 'cast', cooldown: 12, aoe: { radius: 12.0, delay: 1.4, color: '#6a6480', damageType: 'spirit', linger: 3 } }),
      move({ id: 'cr_judgment', name: 'Last Judgment', windup: 1.2, active: 0.16, recover: 0.8, damage: 38, posture: 28, range: 10, arc: 1.2, knockback: 4.0, lunge: 13, hitstop: 0.12, anim: 'thrust', perilous: true, telegraph: 'red', cooldown: 10 }),
    ],
    phases: [
      { threshold: 1, name: 'The Hollow King', moves: ['cr_slash', 'cr_echo', 'cr_ring'], speedMultiplier: 1, damageMultiplier: 1 },
      { threshold: 0.66, name: 'Every Name You Took', line: 'I am the shape left when the name is gone.', moves: ['cr_slash', 'cr_echo', 'cr_judgment', 'cr_ring'], speedMultiplier: 1.12, damageMultiplier: 1.15, arena: 'void' },
      { threshold: 0.33, name: 'The Last Word', line: 'Speak me, then. If you can.', moves: ['cr_slash', 'cr_echo', 'cr_silence', 'cr_judgment', 'cr_ring'], speedMultiplier: 1.22, damageMultiplier: 1.3, arena: 'void' },
    ],
    lore: 'It was never a god. It was the space where a name used to be, growing teeth.',
  },
};

export const ALL_ENEMIES: Record<string, EnemyDef> = { ...ENEMIES, ...ELITES, ...BOSSES };

export const BOSS_ORDER = ['ushio', 'kane', 'yuki', 'kaji', 'sabaku', 'mori', 'futari', 'kage', 'yu', 'crown'];

export const ELITE_ORDER = ['juzo', 'bell_warden', 'frost_ape', 'dune_wyrm', 'bamboo_widow', 'ash_knight_captain'];
