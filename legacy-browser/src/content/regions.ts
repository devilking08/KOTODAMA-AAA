import type { RegionDef } from '../types';

/**
 * The six explorable regions. Coordinates are world-space metres (the player
 * is 1.8 units tall). Every landmark is authored by hand; the terrain builder
 * flattens a pad beneath each one so villages and arenas never clip.
 *
 * A region is loaded one at a time. Chapters re-use regions from different
 * spawn points, which keeps the world coherent and the download small.
 */

export const REGIONS: Record<string, RegionDef> = {
  // ───────────────────────────────────────────────────────────────────────────
  shore: {
    id: 'shore',
    name: 'The Shore of Broken Words',
    kanji: '詞の岸',
    subtitle: 'Where the world first forgot',
    description:
      'A fishing coast turned to ash and driftwood. Vermilion gates stand in the shallows, and the sea repeats a name no one can finish.',
    chapter: 0,
    theme: {
      skyTop: '#0c1e2c', skyHorizon: '#e7a06a', sun: '#ffe0b0', cloud: '#7f8c9a',
      fog: '#c79a78', fogDensity: 0.0026, ambient: '#6b7a80',
      groundLow: '#6d7b57', groundMid: '#8d7c50', groundHigh: '#b9a77a',
      rock: '#585750', water: '#2b6d72', waterDeep: '#0c3237',
      grass: '#7d8a48', foliage: '#3d5a39', accent: '#c94b3a',
      particle: 'petal', weather: 'clear', hour: 17.5, wind: 0.7,
    },
    terrain: {
      size: 720, segments: 220, seed: 101, amplitude: 20, ridges: 24, warp: 18,
      waterLevel: 0, lavaLevel: null, falloff: 'south', shape: 'coast',
    },
    shrines: [
      { id: 'shore_first', name: 'Shrine of First Light', region: 'shore', x: 0, z: 120, chapter: 0, description: 'A stone lantern, a bell with no clapper, and a view of the drowned road.' },
      { id: 'shore_village', name: 'Village Shrine', region: 'shore', x: 36, z: 52, chapter: 1, description: 'Someone has left rice, salt, and a child\'s wooden sword.' },
    ],
    landmarks: [
      { id: 'lm_shore_start', kind: 'shrine', name: 'Shrine of First Light', x: 0, z: 120, scale: 1, rotation: 0, flatten: 9, interact: 4, shrine: 'shore_first' },
      { id: 'lm_shore_torii_1', kind: 'torii', name: 'Gate of Returning', x: 0, z: 98, scale: 1.15, rotation: 0, flatten: 5 },
      { id: 'lm_shore_torii_2', kind: 'torii', name: 'The Second Gate', x: 6, z: -16, scale: 0.9, rotation: 0.2, flatten: 4 },
      { id: 'lm_shore_village', kind: 'village', name: 'Nameless Village', x: -26, z: 36, scale: 1, rotation: 0.15, flatten: 34, padHeight: 8 },
      { id: 'lm_shore_house_1', kind: 'house', name: 'Ame\'s House', x: -20, z: 24, scale: 1, rotation: 0.3, flatten: 10 },
      { id: 'lm_shore_house_2', kind: 'house', name: 'Empty House', x: -48, z: 38, scale: 1.1, rotation: -0.4, flatten: 10 },
      { id: 'lm_shore_house_3', kind: 'house', name: 'The Tinker\'s', x: 16, z: 34, scale: 0.9, rotation: 0.8, flatten: 9 },
      { id: 'lm_shore_village_shrine', kind: 'shrine', name: 'Village Shrine', x: 36, z: 52, scale: 1, rotation: -0.2, flatten: 8, interact: 4, shrine: 'shore_village' },
      { id: 'lm_shore_arena', kind: 'arena', name: 'The Drowned General\'s Rest', x: 24, z: -138, scale: 1.3, rotation: 0.4, flatten: 34, arena: 'ushio_arena' },
      { id: 'lm_shore_shipwreck', kind: 'shipwreck', name: 'The Last Ferry', x: 156, z: 128, scale: 1.25, rotation: 1.2, flatten: 12, padHeight: 2 },
      { id: 'lm_shore_watchtower', kind: 'watchtower', name: 'Salt Watch', x: -142, z: 18, scale: 1.1, rotation: 0.3, flatten: 9 },
      { id: 'lm_shore_grave', kind: 'grave', name: 'The Unmarked Grave', x: -76, z: -62, scale: 1, rotation: 0.7, flatten: 6 },
      { id: 'lm_shore_camp', kind: 'camp', name: 'Ronin Camp', x: -172, z: -104, scale: 1.1, rotation: -0.3, flatten: 18 },
      { id: 'lm_shore_cave', kind: 'cave', name: 'Salt Cave', x: 178, z: -38, scale: 1.2, rotation: -0.6, flatten: 10 },
      { id: 'lm_shore_bridge', kind: 'bridge', name: 'The Broken Bridge', x: 4, z: -58, scale: 1, rotation: 0, flatten: 6 },
      { id: 'lm_shore_lanterns', kind: 'lantern', name: 'Road Lanterns', x: -4, z: 70, scale: 1, rotation: 0, flatten: 2, chapters: [0, 1, 2] },
    ],
    npcs: [
      {
        id: 'ame', name: 'Ame', title: 'Shrine Keeper', region: 'shore', x: -12, z: 20, rot: 0.5, chapter: 0, untilChapter: 10,
        dialogue: 'ame_shore', quest: 'sq_lantern', silhouette: 'shrine',
        colors: { robe: '#c8c2b2', sash: '#a8443a', skin: '#d6b49a', hair: '#1f1c1a', accent: '#d9b36a' },
        essential: true, lore: 'Sixteen years old. She keeps a shrine no one visits and remembers everyone who does not.',
      },
      {
        id: 'tobi', name: 'Tobi', title: 'One-Armed Fisherman', region: 'shore', x: -46, z: 58, rot: 2.2, chapter: 0, untilChapter: 10,
        dialogue: 'tobi_shore', quest: 'sq_tobi_arm', silhouette: 'villager',
        colors: { robe: '#5a5044', sash: '#8b6b42', skin: '#b98d6e', hair: '#4a4038', accent: '#d0b080' },
        essential: true, lore: 'He says he lost the arm to a fish. The fish was a war.',
      },
      {
        id: 'ito', name: 'Ito', title: 'Pedlar of Small Things', region: 'shore', x: 22, z: 40, rot: -1.2, chapter: 1, untilChapter: 10,
        dialogue: 'ito_shore', quest: 'sq_ito_ledger', silhouette: 'merchant',
        colors: { robe: '#6b5a3c', sash: '#c9a45a', skin: '#c4a080', hair: '#3a3028', accent: '#e0c080' },
      },
      {
        id: 'yomi_shore', name: 'Yomi', title: 'The Fox in the Bell', region: 'shore', x: 3, z: 116, rot: 3.1, chapter: 0, untilChapter: 10,
        dialogue: 'yomi_intro', silhouette: 'fox',
        colors: { robe: '#d9d2c0', sash: '#c94b3a', skin: '#f0e6d2', hair: '#e8dcc0', accent: '#d9b36a' },
        essential: true, lore: 'A voice that arrives before its body. She claims to be an archivist. She claims a lot of things.',
      },
    ],
    enemies: [
      { id: 'sh_ronin_1', enemy: 'ronin', x: 88, z: 72, count: 2, radius: 6, chapter: 0 },
      { id: 'sh_ronin_2', enemy: 'ronin', x: -108, z: 62, count: 2, radius: 5, chapter: 1 },
      { id: 'sh_archer_1', enemy: 'archer', x: -44, z: -24, count: 2, radius: 7, chapter: 1 },
      { id: 'sh_brute_1', enemy: 'brute', x: 112, z: -44, count: 1, radius: 2, chapter: 1 },
      { id: 'sh_ambush', enemy: 'drowned_spirit', x: 150, z: 108, count: 2, radius: 8, chapter: 1 },
      { id: 'sh_juzo', enemy: 'juzo', x: -172, z: -104, count: 1, radius: 0, chapter: 1, elite: true },
      { id: 'sh_ronin_3', enemy: 'ronin', x: 60, z: -100, count: 3, radius: 8, chapter: 2 },
      { id: 'sh_archer_2', enemy: 'archer', x: -80, z: -130, count: 2, radius: 6, chapter: 2 },
    ],
    collectibles: [
      { id: 'c_sh_mem_1', kind: 'memory', x: 146, z: 92, name: 'Memory: The Ferryman\'s Coin', codex: 'mem_ferryman' },
      { id: 'c_sh_mem_2', kind: 'memory', x: -150, z: 30, name: 'Memory: Salt Watch', codex: 'mem_salt_watch' },
      { id: 'c_sh_mem_3', kind: 'memory', x: 30, z: -80, name: 'Memory: A Child\'s Vow', codex: 'mem_child_vow' },
      { id: 'c_sh_item_1', kind: 'item', x: -88, z: -66, item: 'incense', amount: 2, name: 'Wound Incense' },
      { id: 'c_sh_item_2', kind: 'item', x: 172, z: -34, item: 'talisman', amount: 1, name: 'Edge Talisman' },
      { id: 'c_sh_item_3', kind: 'item', x: -40, z: 72, item: 'smoke_bomb', amount: 1, name: 'Smoke Bomb' },
      { id: 'c_sh_lore_1', kind: 'lore', x: 12, z: 4, name: 'Lore: The First Silence', codex: 'lore_first_silence' },
    ],
    secrets: [
      { id: 'sec_shore_cave', name: 'Salt Cave Cache', x: 178, z: -38, radius: 5, flag: 'secret_shore_cave', description: 'A cache behind the tide line.', reward: { item: 'talisman', count: 2, essence: 80 } },
      { id: 'sec_shore_grave', name: 'The Unmarked Grave', x: -76, z: -62, radius: 4, flag: 'secret_shore_grave', description: 'Someone left a sword here. It is still warm.', reward: { essence: 120, xp: 60 } },
      { id: 'sec_shore_cliff', name: 'Cliffside Shrine', x: 196, z: -112, radius: 4, flag: 'secret_shore_cliff', description: 'A tiny shrine facing the open sea.', reward: { item: 'shrine_seed', count: 1, essence: 50 } },
    ],
    arenas: [
      { id: 'ushio_arena', x: 24, z: -138, radius: 34, boss: 'ushio', chapter: 1, fogColor: '#7fe0d0', entryFlag: 'arena_ushio' },
    ],
    spawns: [
      { id: 'shore_start', name: 'Shore of Broken Words', x: 0, z: 132, rot: Math.PI, chapter: 0 },
      { id: 'shore_village_spawn', name: 'Nameless Village', x: -8, z: 44, rot: Math.PI, chapter: 1 },
      { id: 'shore_arena_spawn', name: 'Drowned General\'s Rest', x: 24, z: -96, rot: Math.PI, chapter: 2 },
    ],
    map: { x: 0, z: 0, scale: 0.0009, rotation: 0 },
    ambience: { wind: 0.5, birds: 0.2, water: 0.7, crowd: 0.1 },
  },

  // ───────────────────────────────────────────────────────────────────────────
  bell_island: {
    id: 'bell_island',
    name: 'The Drowned Bell',
    kanji: '沈鐘',
    subtitle: 'A temple that rings beneath the waves',
    description:
      'A black island in a black sea. The temple bell rings every thirteen minutes, though the tower fell a century ago.',
    chapter: 2,
    theme: {
      skyTop: '#030814', skyHorizon: '#15303c', sun: '#b9d6e2', cloud: '#334a55',
      fog: '#102a34', fogDensity: 0.0062, ambient: '#3f6068',
      groundLow: '#37453c', groundMid: '#4c5a4a', groundHigh: '#68745a',
      rock: '#343c3e', water: '#0e3038', waterDeep: '#03161c',
      grass: '#52644a', foliage: '#26382e', accent: '#d8c59a',
      particle: 'spray', weather: 'storm', hour: 22, wind: 1.1,
    },
    terrain: {
      size: 460, segments: 168, seed: 202, amplitude: 16, ridges: 18, warp: 10,
      waterLevel: 0, lavaLevel: null, falloff: 'radial', shape: 'coast',
    },
    shrines: [
      { id: 'bell_dock', name: 'Dock Shrine', region: 'bell_island', x: 0, z: 118, chapter: 2, description: 'The dock is newer than the island. Someone expected visitors.' },
      { id: 'bell_temple', name: 'Bell Temple Shrine', region: 'bell_island', x: 18, z: -44, chapter: 2, description: 'The bell rope is wet. The bell is not.' },
    ],
    landmarks: [
      { id: 'lm_bell_dock', kind: 'shrine', name: 'Dock Shrine', x: 0, z: 118, scale: 1, rotation: 0, flatten: 10, interact: 4, shrine: 'bell_dock' },
      { id: 'lm_bell_torii', kind: 'torii', name: 'Gate of the Drowned', x: 0, z: 84, scale: 1.2, rotation: 0, flatten: 4 },
      { id: 'lm_bell_temple', kind: 'bell', name: 'The Drowned Temple', x: -16, z: -34, scale: 1.4, rotation: 0.5, flatten: 22 },
      { id: 'lm_bell_temple_shrine', kind: 'shrine', name: 'Bell Temple Shrine', x: 18, z: -44, scale: 1, rotation: -0.4, flatten: 8, interact: 4, shrine: 'bell_temple' },
      { id: 'lm_bell_arena', kind: 'arena', name: 'The Bell Chamber', x: 0, z: -92, scale: 1.25, rotation: 0, flatten: 28, arena: 'kane_arena' },
      { id: 'lm_bell_shipwreck', kind: 'shipwreck', name: 'The Pilgrim Boat', x: 118, z: 62, scale: 1, rotation: -1.1, flatten: 9, padHeight: 2 },
      { id: 'lm_bell_grave', kind: 'grave', name: 'Pilgrim Graves', x: -96, z: 40, scale: 1, rotation: 0.3, flatten: 10 },
      { id: 'lm_bell_watchtower', kind: 'watchtower', name: 'The Blind Watch', x: 92, z: -18, scale: 1, rotation: 0.8, flatten: 8 },
      { id: 'lm_bell_cave', kind: 'cave', name: 'Undertow Cave', x: -84, z: -74, scale: 1.1, rotation: 0.2, flatten: 9 },
      { id: 'lm_bell_lanterns', kind: 'lantern', name: 'Pilgrim Lamps', x: 0, z: 56, scale: 1, rotation: 0, flatten: 2 },
    ],
    npcs: [
      {
        id: 'yomi_bell', name: 'Yomi', title: 'The Fox in the Bell', region: 'bell_island', x: 4, z: 114, rot: 3.1, chapter: 2,
        dialogue: 'yomi_bell', silhouette: 'fox',
        colors: { robe: '#d9d2c0', sash: '#c94b3a', skin: '#f0e6d2', hair: '#e8dcc0', accent: '#d9b36a' },
        essential: true,
      },
      {
        id: 'sayo', name: 'Sayo', title: 'The Last Pilgrim', region: 'bell_island', x: 26, z: 60, rot: 2.6, chapter: 2,
        dialogue: 'sayo_bell', quest: 'sq_bell_child', silhouette: 'child',
        colors: { robe: '#8a8a7a', sash: '#5a6a6a', skin: '#d6b49a', hair: '#2a2622', accent: '#b9d8d0' },
        lore: 'She has been waiting for her mother since the bell last rang. That was nine years ago.',
      },
    ],
    enemies: [
      { id: 'bi_monk_1', enemy: 'bell_monk', x: 44, z: 40, count: 2, radius: 6, chapter: 2 },
      { id: 'bi_monk_2', enemy: 'bell_monk', x: -46, z: -8, count: 3, radius: 7, chapter: 2 },
      { id: 'bi_spirit_1', enemy: 'drowned_spirit', x: 84, z: 76, count: 2, radius: 5, chapter: 2 },
      { id: 'bi_spirit_2', enemy: 'drowned_spirit', x: -96, z: 34, count: 2, radius: 6, chapter: 2 },
      { id: 'bi_archer', enemy: 'archer', x: 96, z: -16, count: 2, radius: 4, chapter: 2 },
      { id: 'bi_warden', enemy: 'bell_warden', x: -84, z: -74, count: 1, radius: 0, chapter: 2, elite: true },
      { id: 'bi_monk_3', enemy: 'bell_monk', x: 0, z: -52, count: 2, radius: 6, chapter: 2 },
    ],
    collectibles: [
      { id: 'c_bi_mem_1', kind: 'memory', x: 118, z: 54, name: 'Memory: The Pilgrim Boat', codex: 'mem_pilgrim_boat' },
      { id: 'c_bi_mem_2', kind: 'memory', x: -92, z: 44, name: 'Memory: A Mother\'s Voice', codex: 'mem_mother_voice' },
      { id: 'c_bi_item_1', kind: 'item', x: 92, z: -14, item: 'bell_token', amount: 2, name: 'Bell Token' },
      { id: 'c_bi_item_2', kind: 'item', x: -84, z: -70, item: 'incense', amount: 2, name: 'Wound Incense' },
      { id: 'c_bi_lore', kind: 'lore', x: -18, z: -20, name: 'Lore: The Bell That Would Not Stop', codex: 'lore_bell' },
    ],
    secrets: [
      { id: 'sec_bell_under', name: 'The Bell Beneath', x: -84, z: -78, radius: 5, flag: 'secret_bell_under', description: 'A second bell, smaller, buried mouth-up.', reward: { item: 'bell_token', count: 3, essence: 100 } },
      { id: 'sec_bell_boat', name: 'Pilgrim\'s Cache', x: 120, z: 58, radius: 4, flag: 'secret_bell_boat', description: 'A dry chest in a wet boat.', reward: { item: 'talisman', count: 1, essence: 80 } },
    ],
    arenas: [
      { id: 'kane_arena', x: 0, z: -92, radius: 28, boss: 'kane', chapter: 2, fogColor: '#e0c98a' },
    ],
    spawns: [{ id: 'bell_dock_spawn', name: 'Dock of the Drowned', x: 0, z: 128, rot: Math.PI, chapter: 2 }],
    map: { x: 0, z: 0, scale: 0.0013, rotation: 0 },
    ambience: { wind: 0.8, birds: 0, water: 1, crowd: 0 },
  },

  // ───────────────────────────────────────────────────────────────────────────
  snow: {
    id: 'snow',
    name: 'The White Silence',
    kanji: '白き静寂',
    subtitle: 'A wedding frozen at the altar',
    description:
      'A pass that has not heard a bird in thirty years. The snow falls upward at dusk, and a bride still waits in the ruined chapel.',
    chapter: 3,
    theme: {
      skyTop: '#8fa6b8', skyHorizon: '#e8eff2', sun: '#fff4dc', cloud: '#c9d4da',
      fog: '#dce7ec', fogDensity: 0.0058, ambient: '#9fb2bc',
      groundLow: '#c9d4d6', groundMid: '#dde6e6', groundHigh: '#eef4f3',
      rock: '#6f7e86', water: '#9fd8e4', waterDeep: '#4f8898',
      grass: '#8a9a90', foliage: '#3e574c', accent: '#7fd9ff',
      particle: 'snow', weather: 'snow', hour: 9, wind: 0.9,
    },
    terrain: {
      size: 760, segments: 230, seed: 303, amplitude: 30, ridges: 52, warp: 22,
      waterLevel: null, lavaLevel: null, falloff: 'north', shape: 'alpine', snowLine: 18,
    },
    shrines: [
      { id: 'snow_gate', name: 'Shrine of the Frozen Gate', region: 'snow', x: 0, z: 190, chapter: 3, description: 'The gate is open. The snow has been kind enough not to bury it.' },
      { id: 'snow_village', name: 'Hearth Shrine', region: 'snow', x: -26, z: 92, chapter: 3, description: 'The hearth is cold, but someone still leaves tea.' },
      { id: 'snow_ruins', name: 'Chapel Shrine', region: 'snow', x: 146, z: -62, chapter: 4, description: 'A chapel with no roof and a bell with no tongue.' },
    ],
    landmarks: [
      { id: 'lm_snow_gate', kind: 'shrine', name: 'Shrine of the Frozen Gate', x: 0, z: 190, scale: 1, rotation: 0, flatten: 10, interact: 4, shrine: 'snow_gate' },
      { id: 'lm_snow_torii', kind: 'torii', name: 'The Last Gate', x: 0, z: 160, scale: 1.3, rotation: 0, flatten: 4 },
      { id: 'lm_snow_village', kind: 'village', name: 'Hearth Village', x: -30, z: 94, scale: 1, rotation: 0.2, flatten: 34, padHeight: 48 },
      { id: 'lm_snow_village_shrine', kind: 'shrine', name: 'Hearth Shrine', x: -26, z: 92, scale: 1, rotation: 0, flatten: 8, interact: 4, shrine: 'snow_village' },
      { id: 'lm_snow_house_1', kind: 'house', name: 'Elder\'s House', x: -54, z: 76, scale: 1, rotation: 0.4, flatten: 10 },
      { id: 'lm_snow_house_2', kind: 'house', name: 'Nao\'s House', x: -8, z: 78, scale: 0.9, rotation: -0.2, flatten: 9 },
      { id: 'lm_snow_lake', kind: 'oasis', name: 'Mirror Lake', x: 92, z: -18, scale: 1.4, rotation: 0, flatten: 40, padHeight: 42, variant: 'ice' },
      { id: 'lm_snow_yuki_arena', kind: 'arena', name: 'The Frozen Chapel', x: 0, z: -172, scale: 1.3, rotation: 0.1, flatten: 34, arena: 'yuki_arena' },
      { id: 'lm_snow_kaji_arena', kind: 'arena', name: 'The Burned Monastery', x: 148, z: -108, scale: 1.25, rotation: -0.3, flatten: 30, arena: 'kaji_arena' },
      { id: 'lm_snow_ruins_shrine', kind: 'shrine', name: 'Chapel Shrine', x: 146, z: -62, scale: 1, rotation: 0.2, flatten: 8, interact: 4, shrine: 'snow_ruins' },
      { id: 'lm_snow_monastery', kind: 'ruin', name: 'Monastery of the Warm Hand', x: 158, z: -86, scale: 1.2, rotation: -0.4, flatten: 18 },
      { id: 'lm_snow_cave', kind: 'cave', name: 'The Hollow Pass', x: -160, z: -24, scale: 1.2, rotation: 0.8, flatten: 10 },
      { id: 'lm_snow_ape', kind: 'camp', name: 'Ape\'s Nest', x: 128, z: 52, scale: 1, rotation: 0, flatten: 14 },
      { id: 'lm_snow_grave', kind: 'grave', name: 'The Groom\'s Grave', x: -82, z: -108, scale: 1, rotation: 0.6, flatten: 6 },
      { id: 'lm_snow_lanterns', kind: 'lantern', name: 'Snow Lamps', x: -4, z: 132, scale: 1, rotation: 0, flatten: 2 },
    ],
    npcs: [
      {
        id: 'fuyu', name: 'Elder Fuyu', title: 'Keeper of the Hearth', region: 'snow', x: -50, z: 82, rot: 1.2, chapter: 3,
        dialogue: 'fuyu_snow', quest: 'sq_fuyu_wolves', silhouette: 'villager',
        colors: { robe: '#5a5a52', sash: '#8a6a4a', skin: '#c9b0a0', hair: '#d8d8d0', accent: '#c9a45a' },
        essential: true, lore: 'She has not slept in the same room as a fire since the monastery burned.',
      },
      {
        id: 'nao', name: 'Nao', title: 'The Snow Child', region: 'snow', x: -6, z: 74, rot: 2.8, chapter: 3,
        dialogue: 'nao_snow', quest: 'sq_nao_snowman', silhouette: 'child',
        colors: { robe: '#d8dcd8', sash: '#7a8a8a', skin: '#d6b49a', hair: '#2a2622', accent: '#7fd9ff' },
      },
      {
        id: 'yomi_snow', name: 'Yomi', title: 'The Fox in the Bell', region: 'snow', x: 6, z: 186, rot: 3.1, chapter: 3,
        dialogue: 'yomi_snow', silhouette: 'fox',
        colors: { robe: '#d9d2c0', sash: '#c94b3a', skin: '#f0e6d2', hair: '#e8dcc0', accent: '#d9b36a' },
        essential: true,
      },
    ],
    enemies: [
      { id: 'sn_ronin_1', enemy: 'frost_ronin', x: 64, z: 120, count: 2, radius: 6, chapter: 3 },
      { id: 'sn_ronin_2', enemy: 'frost_ronin', x: -96, z: 30, count: 3, radius: 8, chapter: 3 },
      { id: 'sn_archer_1', enemy: 'ice_archer', x: 34, z: 30, count: 2, radius: 6, chapter: 3 },
      { id: 'sn_beast_1', enemy: 'snow_beast', x: -60, z: -40, count: 2, radius: 7, chapter: 3 },
      { id: 'sn_beast_2', enemy: 'snow_beast', x: 92, z: -80, count: 2, radius: 8, chapter: 3 },
      { id: 'sn_ape', enemy: 'frost_ape', x: 128, z: 52, count: 1, radius: 0, chapter: 3, elite: true },
      { id: 'sn_ronin_3', enemy: 'frost_ronin', x: 140, z: -76, count: 3, radius: 7, chapter: 4 },
      { id: 'sn_monk', enemy: 'flame_monk', x: 120, z: -60, count: 2, radius: 6, chapter: 4 },
      { id: 'sn_spirit', enemy: 'drowned_spirit', x: 0, z: -140, count: 2, radius: 7, chapter: 3 },
    ],
    collectibles: [
      { id: 'c_sn_mem_1', kind: 'memory', x: 96, z: -22, name: 'Memory: The Frozen Bouquet', codex: 'mem_bouquet' },
      { id: 'c_sn_mem_2', kind: 'memory', x: -166, z: -28, name: 'Memory: The Warm Hand', codex: 'mem_warm_hand' },
      { id: 'c_sn_mem_3', kind: 'memory', x: -78, z: -104, name: 'Memory: The Groom\'s Road', codex: 'mem_groom' },
      { id: 'c_sn_item_1', kind: 'item', x: 128, z: 56, item: 'snow_lotus', amount: 1, name: 'Snow Lotus' },
      { id: 'c_sn_item_2', kind: 'item', x: 152, z: -84, item: 'incense', amount: 2, name: 'Wound Incense' },
      { id: 'c_sn_lore', kind: 'lore', x: 150, z: -58, name: 'Lore: The Warm Hand', codex: 'lore_warm_hand' },
    ],
    secrets: [
      { id: 'sec_snow_cave', name: 'Hollow Pass Cache', x: -160, z: -28, radius: 5, flag: 'secret_snow_cave', description: 'A climber\'s pack, frozen shut.', reward: { item: 'dune_glass', count: 1, essence: 100 } },
      { id: 'sec_snow_lake', name: 'Under the Ice', x: 92, z: -18, radius: 6, flag: 'secret_snow_lake', description: 'Something pale moves beneath the ice. It is only a fish. Probably.', reward: { item: 'snow_lotus', count: 1, essence: 80 } },
      { id: 'sec_snow_grave', name: 'The Groom\'s Gift', x: -82, z: -108, radius: 4, flag: 'secret_snow_grave', description: 'A wedding band, sized for a hand that never came.', reward: { essence: 150, xp: 80 } },
    ],
    arenas: [
      { id: 'yuki_arena', x: 0, z: -172, radius: 32, boss: 'yuki', chapter: 3, fogColor: '#bfefff' },
      { id: 'kaji_arena', x: 148, z: -108, radius: 28, boss: 'kaji', chapter: 4, fogColor: '#ff8a45' },
    ],
    spawns: [
      { id: 'snow_start', name: 'Frozen Gate', x: 0, z: 204, rot: Math.PI, chapter: 3 },
      { id: 'snow_village_spawn', name: 'Hearth Village', x: -18, z: 106, rot: Math.PI, chapter: 3 },
      { id: 'snow_ruins_spawn', name: 'Burned Monastery', x: 148, z: -36, rot: Math.PI, chapter: 4 },
    ],
    map: { x: 0, z: 0, scale: 0.0009, rotation: 0 },
    ambience: { wind: 1, birds: 0, water: 0.1, crowd: 0.05 },
  },

  // ───────────────────────────────────────────────────────────────────────────
  desert: {
    id: 'desert',
    name: 'The Drowned Dunes',
    kanji: '沈砂',
    subtitle: 'A sea that forgot it was water',
    description:
      'An ocean of sand over a buried kingdom. At night the dunes hum like tide, and the dead queens walk their gardens.',
    chapter: 5,
    theme: {
      skyTop: '#2c2340', skyHorizon: '#e8a45a', sun: '#ffe2a0', cloud: '#7a5a6a',
      fog: '#d1a06a', fogDensity: 0.0038, ambient: '#8a7058',
      groundLow: '#9a7244', groundMid: '#c49a58', groundHigh: '#e2c080',
      rock: '#6e523a', water: '#2f7a72', waterDeep: '#15443f',
      grass: '#8a7a4a', foliage: '#4a5a3a', accent: '#ffd27a',
      particle: 'sand', weather: 'clear', hour: 18.5, wind: 1.35,
    },
    terrain: {
      size: 760, segments: 230, seed: 404, amplitude: 18, ridges: 28, warp: 22,
      waterLevel: null, lavaLevel: null, falloff: 'none', shape: 'dunes',
    },
    shrines: [
      { id: 'desert_gate', name: 'Shrine of the Dry Road', region: 'desert', x: 0, z: 214, chapter: 5, description: 'A cup of water that never empties. Do not ask where it comes from.' },
      { id: 'desert_camp', name: 'Caravan Shrine', region: 'desert', x: -34, z: 128, chapter: 5, description: 'Forty knots tied in the shrine rope. Forty safe crossings.' },
      { id: 'desert_oasis', name: 'Garden Shrine', region: 'desert', x: 126, z: -4, chapter: 6, description: 'The only green for a hundred leagues. It is not a mirage. That is the problem.' },
    ],
    landmarks: [
      { id: 'lm_desert_gate', kind: 'shrine', name: 'Shrine of the Dry Road', x: 0, z: 214, scale: 1, rotation: 0, flatten: 10, interact: 4, shrine: 'desert_gate' },
      { id: 'lm_desert_torii', kind: 'torii', name: 'The Dry Gate', x: 0, z: 188, scale: 1.25, rotation: 0.1, flatten: 4 },
      { id: 'lm_desert_camp', kind: 'camp', name: 'Caravan of the Last Well', x: -34, z: 128, scale: 1.2, rotation: 0.3, flatten: 26 },
      { id: 'lm_desert_camp_shrine', kind: 'shrine', name: 'Caravan Shrine', x: -34, z: 128, scale: 0.9, rotation: 0, flatten: 8, interact: 4, shrine: 'desert_camp' },
      { id: 'lm_desert_oasis', kind: 'oasis', name: 'The Last Garden', x: 126, z: -8, scale: 1.4, rotation: 0, flatten: 38, padHeight: 16, variant: 'water' },
      { id: 'lm_desert_oasis_shrine', kind: 'shrine', name: 'Garden Shrine', x: 126, z: -4, scale: 1, rotation: 0.5, flatten: 8, interact: 4, shrine: 'desert_oasis' },
      { id: 'lm_desert_sabaku_arena', kind: 'arena', name: 'The Dune Throne', x: -112, z: -158, scale: 1.35, rotation: 0.2, flatten: 38, arena: 'sabaku_arena' },
      { id: 'lm_desert_mori_arena', kind: 'arena', name: 'The Garden Heart', x: 142, z: -38, scale: 1.2, rotation: -0.2, flatten: 30, arena: 'mori_arena' },
      { id: 'lm_desert_ruins', kind: 'ruin', name: 'The Sunken Court', x: 16, z: -78, scale: 1.3, rotation: 0.4, flatten: 20 },
      { id: 'lm_desert_tomb', kind: 'cave', name: 'The Tomb of Rain', x: -182, z: -36, scale: 1.2, rotation: -0.5, flatten: 12 },
      { id: 'lm_desert_watchtower', kind: 'watchtower', name: 'The Glass Watch', x: 82, z: 74, scale: 1.1, rotation: 0.7, flatten: 9 },
      { id: 'lm_desert_statue', kind: 'statue', name: 'The Queen Without a Face', x: -72, z: -50, scale: 1.4, rotation: 0.5, flatten: 12 },
      { id: 'lm_desert_grave', kind: 'grave', name: 'The Caravan That Didn\'t', x: -128, z: 76, scale: 1, rotation: 0.2, flatten: 8 },
      { id: 'lm_desert_lanterns', kind: 'lantern', name: 'Road of Small Suns', x: 0, z: 160, scale: 1, rotation: 0, flatten: 2 },
    ],
    npcs: [
      {
        id: 'zahra', name: 'Zahra', title: 'Caravan Master', region: 'desert', x: -30, z: 122, rot: 1.8, chapter: 5,
        dialogue: 'zahra_desert', quest: 'sq_zahra_water', silhouette: 'merchant',
        colors: { robe: '#7a5a3a', sash: '#d9b36a', skin: '#a87a5a', hair: '#2a2220', accent: '#ffd27a' },
        essential: true, lore: 'She has crossed the dunes forty times. She has never seen the same dune twice.',
      },
      {
        id: 'sami', name: 'Sami', title: 'Star Cartographer', region: 'desert', x: 24, z: 104, rot: 2.4, chapter: 5,
        dialogue: 'sami_desert', quest: 'sq_sami_star', silhouette: 'child',
        colors: { robe: '#8a7a5a', sash: '#4a6a7a', skin: '#b98d6e', hair: '#2a2622', accent: '#b8d8ff' },
      },
      {
        id: 'yomi_desert', name: 'Yomi', title: 'The Fox in the Bell', region: 'desert', x: 6, z: 208, rot: 3.1, chapter: 5,
        dialogue: 'yomi_desert', silhouette: 'fox',
        colors: { robe: '#d9d2c0', sash: '#c94b3a', skin: '#f0e6d2', hair: '#e8dcc0', accent: '#d9b36a' },
        essential: true,
      },
    ],
    enemies: [
      { id: 'de_bandit_1', enemy: 'sand_bandit', x: 64, z: 150, count: 3, radius: 7, chapter: 5 },
      { id: 'de_bandit_2', enemy: 'sand_bandit', x: -92, z: 30, count: 3, radius: 8, chapter: 5 },
      { id: 'de_stalker_1', enemy: 'dune_stalker', x: 110, z: 40, count: 2, radius: 8, chapter: 5 },
      { id: 'de_stalker_2', enemy: 'dune_stalker', x: -140, z: -60, count: 2, radius: 7, chapter: 5 },
      { id: 'de_wyrm', enemy: 'dune_wyrm', x: -168, z: 12, count: 1, radius: 0, chapter: 5, elite: true },
      { id: 'de_bandit_3', enemy: 'sand_bandit', x: 140, z: -30, count: 3, radius: 6, chapter: 6 },
      { id: 'de_guardian', enemy: 'ash_knight', x: 142, z: -50, count: 1, radius: 0, chapter: 6 },
      { id: 'de_stalker_3', enemy: 'dune_stalker', x: 0, z: -100, count: 2, radius: 8, chapter: 6 },
    ],
    collectibles: [
      { id: 'c_de_mem_1', kind: 'memory', x: 20, z: -74, name: 'Memory: The Sunken Court', codex: 'mem_sunken_court' },
      { id: 'c_de_mem_2', kind: 'memory', x: -182, z: -40, name: 'Memory: The Tomb of Rain', codex: 'mem_tomb_rain' },
      { id: 'c_de_mem_3', kind: 'memory', x: 126, z: -8, name: 'Memory: The Last Garden', codex: 'mem_last_garden' },
      { id: 'c_de_item_1', kind: 'item', x: -180, z: -32, item: 'dune_glass', amount: 1, name: 'Dune Glass' },
      { id: 'c_de_item_2', kind: 'item', x: 84, z: 78, item: 'incense', amount: 2, name: 'Wound Incense' },
      { id: 'c_de_lore', kind: 'lore', x: -70, z: -46, name: 'Lore: The Queen\'s Bargain', codex: 'lore_queen_bargain' },
    ],
    secrets: [
      { id: 'sec_desert_tomb', name: 'The Tomb of Rain', x: -182, z: -40, radius: 5, flag: 'secret_desert_tomb', description: 'A tomb built for water. It is empty.', reward: { item: 'dune_glass', count: 1, essence: 120 } },
      { id: 'sec_desert_mirage', name: 'The Mirage Well', x: 188, z: 60, radius: 5, flag: 'secret_desert_well', description: 'A well with no bottom. A rope with no end.', reward: { essence: 160, xp: 90 } },
      { id: 'sec_desert_statue', name: 'The Queen\'s Face', x: -72, z: -50, radius: 5, flag: 'secret_desert_face', description: 'The face is buried at the statue\'s feet. It is smiling.', reward: { item: 'shrine_seed', count: 1, essence: 60 } },
    ],
    arenas: [
      { id: 'sabaku_arena', x: -112, z: -158, radius: 36, boss: 'sabaku', chapter: 5, fogColor: '#ffd27a' },
      { id: 'mori_arena', x: 142, z: -38, radius: 30, boss: 'mori', chapter: 6, fogColor: '#a8d98a' },
    ],
    spawns: [
      { id: 'desert_start', name: 'Shrine of the Dry Road', x: 0, z: 228, rot: Math.PI, chapter: 5 },
      { id: 'desert_camp_spawn', name: 'Caravan of the Last Well', x: -26, z: 134, rot: Math.PI, chapter: 5 },
      { id: 'desert_oasis_spawn', name: 'The Last Garden', x: 120, z: -2, rot: Math.PI, chapter: 6 },
    ],
    map: { x: 0, z: 0, scale: 0.0009, rotation: 0 },
    ambience: { wind: 0.9, birds: 0, water: 0.1, crowd: 0.1 },
  },

  // ───────────────────────────────────────────────────────────────────────────
  bamboo: {
    id: 'bamboo',
    name: 'The Bamboo Requiem',
    kanji: '竹の鎮魂歌',
    subtitle: 'A forest that learned to keep time',
    description:
      'Green rain, green light, green silence. The stalks tap against each other in a rhythm the monks call the Requiem. Something in the grove is still counting.',
    chapter: 7,
    theme: {
      skyTop: '#12241f', skyHorizon: '#6a8a72', sun: '#d8e8c0', cloud: '#4a6a5a',
      fog: '#3f5c4c', fogDensity: 0.0055, ambient: '#557060',
      groundLow: '#2f4a36', groundMid: '#456044', groundHigh: '#6a8054',
      rock: '#4a5a4a', water: '#2f6a5a', waterDeep: '#123a30',
      grass: '#5f8a4a', foliage: '#2f5a38', accent: '#b8ff9a',
      particle: 'rain', weather: 'rain', hour: 7, wind: 0.6,
    },
    terrain: {
      size: 720, segments: 220, seed: 505, amplitude: 22, ridges: 26, warp: 16,
      waterLevel: null, lavaLevel: null, falloff: 'none', shape: 'vale',
    },
    shrines: [
      { id: 'bamboo_gate', name: 'Shrine of Green Rain', region: 'bamboo', x: 0, z: 190, chapter: 7, description: 'The rain does not fall here so much as arrive.' },
      { id: 'bamboo_village', name: 'Weaver\'s Shrine', region: 'bamboo', x: -42, z: 116, chapter: 7, description: 'Silk offerings, all of them green.' },
      { id: 'bamboo_moon', name: 'Moonlit Shrine', region: 'bamboo', x: 4, z: -104, chapter: 7, description: 'The clearing is always lit by a moon that is not there.' },
    ],
    landmarks: [
      { id: 'lm_bamboo_gate', kind: 'shrine', name: 'Shrine of Green Rain', x: 0, z: 190, scale: 1, rotation: 0, flatten: 10, interact: 4, shrine: 'bamboo_gate' },
      { id: 'lm_bamboo_torii', kind: 'torii', name: 'The Green Gate', x: 0, z: 162, scale: 1.3, rotation: 0, flatten: 4 },
      { id: 'lm_bamboo_village', kind: 'village', name: 'Weaver\'s Village', x: -46, z: 114, scale: 0.9, rotation: 0.1, flatten: 30, padHeight: 20 },
      { id: 'lm_bamboo_village_shrine', kind: 'shrine', name: 'Weaver\'s Shrine', x: -42, z: 116, scale: 0.9, rotation: 0, flatten: 8, interact: 4, shrine: 'bamboo_village' },
      { id: 'lm_bamboo_house_1', kind: 'house', name: 'Silk House', x: -66, z: 98, scale: 1, rotation: 0.5, flatten: 10 },
      { id: 'lm_bamboo_house_2', kind: 'house', name: 'The Empty Loom', x: -20, z: 96, scale: 0.9, rotation: -0.4, flatten: 9 },
      { id: 'lm_bamboo_grove', kind: 'bamboo_grove', name: 'The Requiem Grove', x: 54, z: 18, scale: 1.5, rotation: 0.2, flatten: 26 },
      { id: 'lm_bamboo_futari_arena', kind: 'arena', name: 'The Moonlit Clearing', x: 0, z: -148, scale: 1.3, rotation: 0, flatten: 32, arena: 'futari_arena' },
      { id: 'lm_bamboo_moon_shrine', kind: 'shrine', name: 'Moonlit Shrine', x: 4, z: -104, scale: 1, rotation: 0.2, flatten: 8, interact: 4, shrine: 'bamboo_moon' },
      { id: 'lm_bamboo_fortress', kind: 'gate', name: 'Gate of Masks', x: 152, z: -58, scale: 1.4, rotation: 0.3, flatten: 24 },
      { id: 'lm_bamboo_kage_arena', kind: 'arena', name: 'The Hall of Masks', x: 154, z: -92, scale: 1.2, rotation: 0, flatten: 30, arena: 'kage_arena' },
      { id: 'lm_bamboo_bridge', kind: 'bridge', name: 'The Long Bridge', x: 76, z: -30, scale: 1.2, rotation: 1.4, flatten: 6 },
      { id: 'lm_bamboo_grave', kind: 'grave', name: 'The Nameless Weavers', x: -118, z: -10, scale: 1, rotation: 0.5, flatten: 8 },
      { id: 'lm_bamboo_cave', kind: 'cave', name: 'The Root Cellar', x: -128, z: -92, scale: 1.1, rotation: 0.7, flatten: 10 },
      { id: 'lm_bamboo_lanterns', kind: 'lantern', name: 'Rain Lanterns', x: 0, z: 140, scale: 1, rotation: 0, flatten: 2 },
    ],
    npcs: [
      {
        id: 'ren', name: 'Ren', title: 'Blind Bell Monk', region: 'bamboo', x: -38, z: 108, rot: 1.4, chapter: 7,
        dialogue: 'ren_bamboo', quest: 'sq_ren_bells', silhouette: 'monk',
        colors: { robe: '#4a5a4a', sash: '#8a9a6a', skin: '#b89a7a', hair: '#d8d8d0', accent: '#c9e0a0' },
        essential: true, lore: 'He can hear a name being forgotten. He says it sounds like a bell underwater.',
      },
      {
        id: 'lin', name: 'Lin', title: 'The Last Weaver', region: 'bamboo', x: -58, z: 120, rot: 2.0, chapter: 7,
        dialogue: 'lin_bamboo', quest: 'sq_lin_letter', silhouette: 'villager',
        colors: { robe: '#3a4a3e', sash: '#8a6a4a', skin: '#c4a080', hair: '#2a2622', accent: '#b8d59a' },
      },
      {
        id: 'yomi_bamboo', name: 'Yomi', title: 'The Fox in the Bell', region: 'bamboo', x: 6, z: 186, rot: 3.1, chapter: 7,
        dialogue: 'yomi_bamboo', silhouette: 'fox',
        colors: { robe: '#d9d2c0', sash: '#c94b3a', skin: '#f0e6d2', hair: '#e8dcc0', accent: '#d9b36a' },
        essential: true,
      },
    ],
    enemies: [
      { id: 'ba_guard_1', enemy: 'bamboo_guard', x: 42, z: 130, count: 3, radius: 8, chapter: 7 },
      { id: 'ba_assassin_1', enemy: 'bamboo_assassin', x: -86, z: 40, count: 3, radius: 8, chapter: 7 },
      { id: 'ba_assassin_2', enemy: 'bamboo_assassin', x: 62, z: -30, count: 2, radius: 7, chapter: 7 },
      { id: 'ba_guard_2', enemy: 'bamboo_guard', x: -10, z: -88, count: 2, radius: 6, chapter: 7 },
      { id: 'ba_widow', enemy: 'bamboo_widow', x: -128, z: -92, count: 1, radius: 0, chapter: 7, elite: true },
      { id: 'ba_guard_3', enemy: 'bamboo_guard', x: 148, z: -54, count: 4, radius: 9, chapter: 8 },
      { id: 'ba_assassin_3', enemy: 'bamboo_assassin', x: 100, z: -70, count: 3, radius: 8, chapter: 8 },
      { id: 'ba_monk', enemy: 'bell_monk', x: 156, z: -96, count: 2, radius: 6, chapter: 8 },
    ],
    collectibles: [
      { id: 'c_ba_mem_1', kind: 'memory', x: 56, z: 14, name: 'Memory: The Requiem', codex: 'mem_requiem' },
      { id: 'c_ba_mem_2', kind: 'memory', x: -118, z: -8, name: 'Memory: The Nameless Weavers', codex: 'mem_weavers' },
      { id: 'c_ba_mem_3', kind: 'memory', x: 154, z: -92, name: 'Memory: A Borrowed Face', codex: 'mem_borrowed_face' },
      { id: 'c_ba_item_1', kind: 'item', x: -128, z: -96, item: 'shrine_seed', amount: 1, name: 'Shrine Seed' },
      { id: 'c_ba_item_2', kind: 'item', x: 76, z: -30, item: 'talisman', amount: 2, name: 'Edge Talisman' },
      { id: 'c_ba_lore', kind: 'lore', x: -40, z: 100, name: 'Lore: The Requiem Count', codex: 'lore_requiem' },
    ],
    secrets: [
      { id: 'sec_bamboo_root', name: 'The Root Cellar', x: -128, z: -96, radius: 5, flag: 'secret_bamboo_root', description: 'The roots are growing around something metal.', reward: { item: 'bell_token', count: 2, essence: 140 } },
      { id: 'sec_bamboo_grave', name: 'The Nameless Weavers', x: -118, z: -8, radius: 5, flag: 'secret_bamboo_grave', description: 'A loom buried with its weaver. The silk is still warm.', reward: { item: 'talisman', count: 1, essence: 100 } },
      { id: 'sec_bamboo_masks', name: 'The Mask Room', x: 176, z: -70, radius: 5, flag: 'secret_bamboo_masks', description: 'A room of masks. One has your face.', reward: { essence: 180, xp: 100 } },
    ],
    arenas: [
      { id: 'futari_arena', x: 0, z: -148, radius: 30, boss: 'futari', chapter: 7, fogColor: '#b8b6ff' },
      { id: 'kage_arena', x: 154, z: -92, radius: 28, boss: 'kage', chapter: 8, fogColor: '#c94b3a' },
    ],
    spawns: [
      { id: 'bamboo_start', name: 'Shrine of Green Rain', x: 0, z: 204, rot: Math.PI, chapter: 7 },
      { id: 'bamboo_village_spawn', name: 'Weaver\'s Village', x: -34, z: 126, rot: Math.PI, chapter: 7 },
      { id: 'bamboo_fortress_spawn', name: 'Gate of Masks', x: 150, z: -42, rot: Math.PI, chapter: 8 },
    ],
    map: { x: 0, z: 0, scale: 0.0009, rotation: 0 },
    ambience: { wind: 0.4, birds: 0.1, water: 0.4, crowd: 0.05 },
  },

  // ───────────────────────────────────────────────────────────────────────────
  crown: {
    id: 'crown',
    name: 'The Hollow Crown',
    kanji: '空洞の冠',
    subtitle: 'The throne at the end of the sentence',
    description:
      'A volcano palace built around a name that was never spoken. Lava falls in slow curtains, and every hall is a different memory of the same wedding.',
    chapter: 9,
    theme: {
      skyTop: '#0f0a10', skyHorizon: '#a33b2a', sun: '#ff9a5a', cloud: '#4a2428',
      fog: '#3a1e1c', fogDensity: 0.005, ambient: '#70403a',
      groundLow: '#3a2a26', groundMid: '#4f342c', groundHigh: '#6a4636',
      rock: '#2a2020', water: '#ff6a3a', waterDeep: '#8a1e12',
      grass: '#4a3a30', foliage: '#2a1a18', accent: '#ff6a3a',
      particle: 'ash', weather: 'ash', hour: 20, wind: 1.1,
    },
    terrain: {
      size: 700, segments: 220, seed: 606, amplitude: 26, ridges: 54, warp: 20,
      waterLevel: null, lavaLevel: 1.5, falloff: 'radial', shape: 'volcano',
    },
    shrines: [
      { id: 'crown_gate', name: 'Shrine of the Last Step', region: 'crown', x: 0, z: 190, chapter: 9, description: 'The steps behind you are gone. The steps ahead are not.' },
      { id: 'crown_citadel', name: 'Citadel Shrine', region: 'crown', x: -6, z: 84, chapter: 10, description: 'A throne room with no throne. The cushion is still warm.' },
      { id: 'crown_final', name: 'Shrine of the Unspoken', region: 'crown', x: 28, z: -120, chapter: 10, description: 'The last shrine. It has no bell, no offering box, no god. It waits.' },
    ],
    landmarks: [
      { id: 'lm_crown_gate', kind: 'shrine', name: 'Shrine of the Last Step', x: 0, z: 190, scale: 1, rotation: 0, flatten: 10, interact: 4, shrine: 'crown_gate' },
      { id: 'lm_crown_torii', kind: 'torii', name: 'The Final Gate', x: 0, z: 164, scale: 1.5, rotation: 0, flatten: 4 },
      { id: 'lm_crown_citadel', kind: 'citadel', name: 'The Hollow Court', x: -8, z: 78, scale: 1.6, rotation: 0, flatten: 46, padHeight: 34 },
      { id: 'lm_crown_citadel_shrine', kind: 'shrine', name: 'Citadel Shrine', x: -6, z: 84, scale: 1, rotation: 0.2, flatten: 8, interact: 4, shrine: 'crown_citadel' },
      { id: 'lm_crown_yu_arena', kind: 'arena', name: 'The Wedding Hall', x: -106, z: -66, scale: 1.3, rotation: 0.2, flatten: 34, arena: 'yu_arena' },
      { id: 'lm_crown_arena', kind: 'arena', name: 'The Hollow Crown', x: 42, z: -164, scale: 1.6, rotation: 0, flatten: 44, arena: 'crown_arena' },
      { id: 'lm_crown_final_shrine', kind: 'shrine', name: 'Shrine of the Unspoken', x: 28, z: -120, scale: 1.1, rotation: 0, flatten: 8, interact: 4, shrine: 'crown_final' },
      { id: 'lm_crown_bridge', kind: 'bridge', name: 'The Bridge of Names', x: -40, z: 20, scale: 1.3, rotation: 0.9, flatten: 6 },
      { id: 'lm_crown_statue_1', kind: 'statue', name: 'The First King', x: 48, z: 60, scale: 1.4, rotation: -0.5, flatten: 10 },
      { id: 'lm_crown_statue_2', kind: 'statue', name: 'The Last King', x: -56, z: 44, scale: 1.4, rotation: 0.6, flatten: 10 },
      { id: 'lm_crown_bell', kind: 'bell', name: 'The Bell Without a Name', x: 96, z: -30, scale: 1.3, rotation: 0.4, flatten: 16 },
      { id: 'lm_crown_cave', kind: 'cave', name: 'The Ash Vent', x: -152, z: -34, scale: 1.1, rotation: 0.8, flatten: 10 },
      { id: 'lm_crown_grave', kind: 'grave', name: 'The Unnamed', x: 118, z: 128, scale: 1.2, rotation: 0.4, flatten: 8 },
      { id: 'lm_crown_lanterns', kind: 'lantern', name: 'Ash Lamps', x: 0, z: 142, scale: 1, rotation: 0, flatten: 2 },
    ],
    npcs: [
      {
        id: 'ame_crown', name: 'Ame', title: 'The Namekeeper', region: 'crown', x: 6, z: 142, rot: 3.0, chapter: 10,
        dialogue: 'ame_crown', quest: 'sq_ame_name', silhouette: 'shrine',
        colors: { robe: '#c8c2b2', sash: '#a8443a', skin: '#d6b49a', hair: '#1f1c1a', accent: '#d9b36a' },
        essential: true,
      },
      {
        id: 'yomi_crown', name: 'Yomi', title: 'The Fox in the Bell', region: 'crown', x: -2, z: 186, rot: 3.1, chapter: 9,
        dialogue: 'yomi_crown', silhouette: 'fox',
        colors: { robe: '#d9d2c0', sash: '#c94b3a', skin: '#f0e6d2', hair: '#e8dcc0', accent: '#d9b36a' },
        essential: true,
      },
      {
        id: 'kage_ally', name: 'Kage', title: 'The Masked Shogun', region: 'crown', x: 18, z: 100, rot: 2.4, chapter: 10,
        dialogue: 'kage_crown', silhouette: 'samurai',
        colors: { robe: '#1f2228', sash: '#3d414c', accent: '#c94b3a', skin: '#b89680', hair: '#22202a' },
        essential: true,
      },
    ],
    enemies: [
      { id: 'cr_knight_1', enemy: 'ash_knight', x: 62, z: 150, count: 2, radius: 7, chapter: 9 },
      { id: 'cr_monk_1', enemy: 'flame_monk', x: -70, z: 120, count: 2, radius: 7, chapter: 9 },
      { id: 'cr_spirit_1', enemy: 'hollow_spirit', x: 0, z: 60, count: 3, radius: 8, chapter: 9 },
      { id: 'cr_spirit_2', enemy: 'hollow_spirit', x: -96, z: -20, count: 2, radius: 7, chapter: 9 },
      { id: 'cr_knight_2', enemy: 'ash_knight', x: 90, z: -80, count: 2, radius: 7, chapter: 10 },
      { id: 'cr_captain', enemy: 'ash_knight_captain', x: -152, z: -34, count: 1, radius: 0, chapter: 10, elite: true },
      { id: 'cr_monk_2', enemy: 'flame_monk', x: 118, z: -124, count: 2, radius: 6, chapter: 10 },
      { id: 'cr_spirit_3', enemy: 'hollow_spirit', x: 40, z: -100, count: 3, radius: 8, chapter: 10 },
    ],
    collectibles: [
      { id: 'c_cr_mem_1', kind: 'memory', x: 118, z: 124, name: 'Memory: The Unnamed', codex: 'mem_unnamed' },
      { id: 'c_cr_mem_2', kind: 'memory', x: 96, z: -30, name: 'Memory: The Bell Without a Name', codex: 'mem_bell_name' },
      { id: 'c_cr_mem_3', kind: 'memory', x: -152, z: -38, name: 'Memory: The Ash Vent', codex: 'mem_ash_vent' },
      { id: 'c_cr_item_1', kind: 'item', x: 118, z: 124, item: 'snow_lotus', amount: 1, name: 'Snow Lotus' },
      { id: 'c_cr_item_2', kind: 'item', x: -150, z: -30, item: 'dune_glass', amount: 1, name: 'Dune Glass' },
      { id: 'c_cr_lore', kind: 'lore', x: -8, z: 78, name: 'Lore: The First Name', codex: 'lore_first_name' },
    ],
    secrets: [
      { id: 'sec_crown_vent', name: 'The Ash Vent', x: -152, z: -38, radius: 5, flag: 'secret_crown_vent', description: 'A vent that breathes in. Something below is listening.', reward: { item: 'bell_token', count: 3, essence: 200 } },
      { id: 'sec_crown_bell', name: 'The Bell Without a Name', x: 96, z: -30, radius: 5, flag: 'secret_crown_bell', description: 'Strike it. It makes no sound. You hear it anyway.', reward: { essence: 240, xp: 140 } },
      { id: 'sec_crown_grave', name: 'The Unnamed Grave', x: 118, z: 124, radius: 5, flag: 'secret_crown_grave', description: 'The stone is blank. The ground is warm.', reward: { item: 'shrine_seed', count: 1, essence: 120 } },
    ],
    arenas: [
      { id: 'yu_arena', x: -106, z: -66, radius: 34, boss: 'yu', chapter: 9, fogColor: '#ff6a5a' },
      { id: 'crown_arena', x: 42, z: -164, radius: 40, boss: 'crown', chapter: 10, fogColor: '#e8dcff' },
    ],
    spawns: [
      { id: 'crown_start', name: 'Shrine of the Last Step', x: 0, z: 204, rot: Math.PI, chapter: 9 },
      { id: 'crown_citadel_spawn', name: 'Citadel Shrine', x: -6, z: 92, rot: Math.PI, chapter: 10 },
      { id: 'crown_final_spawn', name: 'Shrine of the Unspoken', x: 28, z: -112, rot: Math.PI, chapter: 10 },
    ],
    map: { x: 0, z: 0, scale: 0.0009, rotation: 0 },
    ambience: { wind: 0.8, birds: 0, water: 0, crowd: 0 },
  },
};

export const REGION_ORDER = ['shore', 'bell_island', 'snow', 'desert', 'bamboo', 'crown'];

export const REGION_ARENAS = Object.fromEntries(
  Object.values(REGIONS).flatMap((region) => region.arenas.map((arena) => [arena.id, { ...arena, region: region.id }])),
);
