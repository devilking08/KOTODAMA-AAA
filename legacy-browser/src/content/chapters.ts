import type { ChapterDef } from '../types';

/**
 * Eleven playable chapters (a prologue plus ten named chapters), organised in
 * three acts. Each chapter has a home region, a spawn, a boss or story gate,
 * and an authored objective. The chapter system is data-driven; adding a
 * chapter is a matter of adding an entry here and a spawn point to a region.
 */
export const CHAPTERS: ChapterDef[] = [
  {
    index: 0, id: 'ch0', act: 1,
    title: 'The Shore of Broken Words',
    kanji: '詞の岸',
    subtitle: 'Prologue — Where the world first forgot',
    region: 'shore', spawn: 'shore_start',
    objective: 'Follow the lantern road to the village.',
    description:
      'You wake on a beach with a sword that has no name and a bell that will not stop ringing. The sea has taken the road behind you. A girl is waiting at the shrine.',
    boss: '',
    minutes: 12,
    completeFlags: { chapter_0_done: true, met_ame: true },
    rewards: { xp: 60, essence: 40, skillPoint: 1 },
  },
  {
    index: 1, id: 'ch1', act: 1,
    title: 'The General Who Drowned',
    kanji: '溺将',
    subtitle: 'Ushio, Warden of the Tide',
    region: 'shore', spawn: 'shore_village_spawn',
    objective: 'Reach the Drowned General\'s Rest and put the Warden to rest.',
    description:
      'A drowned general has been holding the coast against an army of memories. The village cannot bury its dead while he stands. Ame asks you to bring back his name.',
    boss: 'ushio',
    intro: 'cine_ch1_intro', outro: 'cine_ch1_outro',
    minutes: 28,
    completeFlags: { chapter_1_done: true, boss_ushio: true },
    rewards: { xp: 220, essence: 140, skillPoint: 1, items: [{ id: 'bell_token', count: 2 }] },
  },
  {
    index: 2, id: 'ch2', act: 1,
    title: 'The Bell That Would Not Stop',
    kanji: '止まぬ鐘',
    subtitle: 'Kane, the Bellkeeper',
    region: 'bell_island', spawn: 'bell_dock_spawn',
    objective: 'Cross the drowned island and silence the Bellkeeper.',
    description:
      'The bell rings every thirteen minutes. Each toll erases a name from the world. Kane has been ringing it for a hundred years because he is afraid of what happens when he stops.',
    boss: 'kane',
    intro: 'cine_ch2_intro', outro: 'cine_ch2_outro',
    minutes: 30,
    completeFlags: { chapter_2_done: true, boss_kane: true },
    rewards: { xp: 260, essence: 180, skillPoint: 1, weapon: 'odachi' },
  },
  {
    index: 3, id: 'ch3', act: 1,
    title: 'A Wedding in Winter',
    kanji: '冬の祝言',
    subtitle: 'Yuki, the White Silence',
    region: 'snow', spawn: 'snow_start',
    objective: 'Climb the pass to the Frozen Chapel and face the bride.',
    description:
      'The pass has not heard a bird in thirty years. Yuki waits at the altar for a groom who took the wrong road. The snow keeps her bouquet fresh. It also keeps everyone else.',
    boss: 'yuki',
    intro: 'cine_ch3_intro', outro: 'cine_ch3_outro',
    minutes: 32,
    completeFlags: { chapter_3_done: true, boss_yuki: true },
    rewards: { xp: 300, essence: 220, skillPoint: 1 },
  },
  {
    index: 4, id: 'ch4', act: 2,
    title: 'The Warm Hand',
    kanji: '温き手',
    subtitle: 'Kaji, the Ember Monk',
    region: 'snow', spawn: 'snow_ruins_spawn',
    objective: 'Enter the burned monastery and learn why the fire never went out.',
    description:
      'Kaji burned his monastery to keep one child warm. The child lived. The fire has been feeding on the memory of that choice ever since. The monastery is still warm.',
    boss: 'kaji',
    intro: 'cine_ch4_intro', outro: 'cine_ch4_outro',
    minutes: 30,
    completeFlags: { chapter_4_done: true, boss_kaji: true },
    rewards: { xp: 340, essence: 260, skillPoint: 1 },
  },
  {
    index: 5, id: 'ch5', act: 2,
    title: 'Queen of the Drowned Dunes',
    kanji: '沈砂の女王',
    subtitle: 'Sabaku, Queen of the Drowned Dunes',
    region: 'desert', spawn: 'desert_start',
    objective: 'Cross the dunes to the Dune Throne and collect the Queen\'s debt.',
    description:
      'Sabaku sold her oasis to a god for a single rain. The god forgot to pay. She has been collecting interest from every caravan since. The dunes are the interest.',
    boss: 'sabaku',
    intro: 'cine_ch5_intro', outro: 'cine_ch5_outro',
    minutes: 34,
    completeFlags: { chapter_5_done: true, boss_sabaku: true },
    rewards: { xp: 380, essence: 300, skillPoint: 2, weapon: 'spear' },
  },
  {
    index: 6, id: 'ch6', act: 2,
    title: 'The Last Garden',
    kanji: '最後の園',
    subtitle: 'Mori, the Last Gardener',
    region: 'desert', spawn: 'desert_oasis_spawn',
    objective: 'Find the hidden garden and decide who it belongs to.',
    description:
      'There is a garden in the desert that should not exist. Mori has kept it alive for a hundred years. Zahra\'s caravan is dying of thirst. The garden is the only water. Nobody is wrong.',
    boss: 'mori',
    intro: 'cine_ch6_intro', outro: 'cine_ch6_outro',
    minutes: 32,
    completeFlags: { chapter_6_done: true, boss_mori: true },
    rewards: { xp: 420, essence: 320, skillPoint: 1 },
  },
  {
    index: 7, id: 'ch7', act: 2,
    title: 'Two Names, One Blade',
    kanji: '二名一刀',
    subtitle: 'Futari, the Twin Blades',
    region: 'bamboo', spawn: 'bamboo_start',
    objective: 'Follow the Requiem into the grove and face the twins.',
    description:
      'They were born with one name between them. They have spent thirty years deciding who keeps it. The forest learned their rhythm and now repeats it in the rain.',
    boss: 'futari',
    intro: 'cine_ch7_intro', outro: 'cine_ch7_outro',
    minutes: 32,
    completeFlags: { chapter_7_done: true, boss_futari: true },
    rewards: { xp: 460, essence: 360, skillPoint: 2, weapon: 'dual' },
  },
  {
    index: 8, id: 'ch8', act: 3,
    title: 'The City of Masks',
    kanji: '面の都',
    subtitle: 'Kage, the Masked Shogun',
    region: 'bamboo', spawn: 'bamboo_fortress_spawn',
    objective: 'Enter the Gate of Masks and take the Shogun\'s answer.',
    description:
      'Kage serves a throne with no king. He has worn a different face every year so no one can ask him why. This year, he is wearing yours.',
    boss: 'kage',
    intro: 'cine_ch8_intro', outro: 'cine_ch8_outro',
    minutes: 36,
    completeFlags: { chapter_8_done: true, boss_kage: true },
    rewards: { xp: 540, essence: 420, skillPoint: 2 },
  },
  {
    index: 9, id: 'ch9', act: 3,
    title: 'The Bride of Ash',
    kanji: '灰の花嫁',
    subtitle: 'Yū, Bride of Ash',
    region: 'crown', spawn: 'crown_start',
    objective: 'Climb the volcano palace to the Wedding Hall.',
    description:
      'The wedding was supposed to end the war. It ended the guests instead. Yū has been waiting at the altar ever since, and the volcano has been waiting with her.',
    boss: 'yu',
    intro: 'cine_ch9_intro', outro: 'cine_ch9_outro',
    minutes: 38,
    completeFlags: { chapter_9_done: true, boss_yu: true },
    rewards: { xp: 640, essence: 500, skillPoint: 2, weapon: 'greatsword' },
  },
  {
    index: 10, id: 'ch10', act: 3,
    title: 'The Hollow Crown',
    kanji: '空洞の冠',
    subtitle: 'That Which Forgot Itself',
    region: 'crown', spawn: 'crown_citadel_spawn',
    objective: 'Climb the citadel. Speak the last name. Choose what the world becomes.',
    description:
      'At the top of the world there is a throne with no king, and a crown with no head. It has been waiting for a name. Yours will do.',
    boss: 'crown',
    intro: 'cine_ch10_intro', outro: 'cine_ending',
    minutes: 40,
    completeFlags: { chapter_10_done: true, boss_crown: true },
    rewards: { xp: 1200, essence: 900, skillPoint: 3 },
  },
];

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));

export const ACT_NAMES: Record<number, string> = {
  1: 'Act I — The Coast of Names',
  2: 'Act II — The Interior',
  3: 'Act III — The Hollow Crown',
};

export function chapterForRegion(region: string): number {
  const found = CHAPTERS.find((c) => c.region === region);
  return found ? found.index : 0;
}
