import type { QuestDef } from '../types';

/**
 * Quests are pure data. The QuestSystem listens for world events
 * (talk / kill / collect / reach / flag / boss) and advances every active
 * quest whose current stage matches. Choices are recorded as flags and read by
 * the ending evaluator.
 */

export const MAIN_QUESTS: Record<string, QuestDef> = {
  mq_prologue: {
    id: 'mq_prologue', title: 'The Girl at the Shrine', chapter: 0, type: 'main', giver: 'Yomi',
    summary: 'Yomi says the village shrine keeper has been waiting for someone with a name like yours. Go and speak to Ame.',
    stages: [{ id: 'talk_ame', text: 'Speak with Ame at the village shrine.', kind: 'talk', target: 'ame' }],
    rewards: { xp: 40, essence: 20 },
  },
  mq_ushio: {
    id: 'mq_ushio', title: 'The General Who Drowned', chapter: 1, type: 'main', giver: 'Ame',
    summary: 'Ushio holds the coast against an army of memories. Break his posture, take his name, and let the village bury its dead.',
    stages: [{ id: 'kill_ushio', text: 'Defeat Ushio at the Drowned General\'s Rest.', kind: 'boss', target: 'ushio' }],
    rewards: { xp: 200, essence: 120 },
  },
  mq_kane: {
    id: 'mq_kane', title: 'The Bell That Would Not Stop', chapter: 2, type: 'main', giver: 'Yomi',
    summary: 'Every thirteen minutes the bell erases a name. Find Kane beneath the drowned temple and make him stop.',
    stages: [{ id: 'kill_kane', text: 'Defeat Kane, the Bellkeeper.', kind: 'boss', target: 'kane' }],
    rewards: { xp: 240, essence: 160 },
  },
  mq_yuki: {
    id: 'mq_yuki', title: 'A Wedding in Winter', chapter: 3, type: 'main', giver: 'Elder Fuyu',
    summary: 'The bride at the Frozen Chapel has been waiting thirty years. Bring her the truth, even if it is sharp.',
    stages: [{ id: 'kill_yuki', text: 'Defeat Yuki at the Frozen Chapel.', kind: 'boss', target: 'yuki' }],
    rewards: { xp: 280, essence: 200 },
  },
  mq_kaji: {
    id: 'mq_kaji', title: 'The Warm Hand', chapter: 4, type: 'main', giver: 'Elder Fuyu',
    summary: 'The monastery fire was lit to save a child. The child is gone. The fire is not. Go into the warmth and end it.',
    stages: [{ id: 'kill_kaji', text: 'Defeat Kaji in the Burned Monastery.', kind: 'boss', target: 'kaji' }],
    rewards: { xp: 320, essence: 240 },
  },
  mq_sabaku: {
    id: 'mq_sabaku', title: 'Queen of the Drowned Dunes', chapter: 5, type: 'main', giver: 'Zahra',
    summary: 'Sabaku sold an oasis for rain that never came. She has been collecting ever since. Cross the dunes and settle the debt.',
    stages: [{ id: 'kill_sabaku', text: 'Defeat Sabaku at the Dune Throne.', kind: 'boss', target: 'sabaku' }],
    rewards: { xp: 360, essence: 280 },
  },
  mq_mori: {
    id: 'mq_mori', title: 'The Last Garden', chapter: 6, type: 'main', giver: 'Zahra',
    summary: 'The garden is real. The caravan is dying. Mori has kept the last water alive for a hundred years. Find a way through.',
    stages: [{ id: 'kill_mori', text: 'Face Mori in the Garden Heart.', kind: 'boss', target: 'mori' }],
    rewards: { xp: 400, essence: 300 },
  },
  mq_futari: {
    id: 'mq_futari', title: 'Two Names, One Blade', chapter: 7, type: 'main', giver: 'Ren',
    summary: 'The twins share one name and one grudge. The grove repeats their rhythm. Step into it.',
    stages: [{ id: 'kill_futari', text: 'Defeat Futari in the Moonlit Clearing.', kind: 'boss', target: 'futari' }],
    rewards: { xp: 440, essence: 340 },
  },
  mq_kage: {
    id: 'mq_kage', title: 'The City of Masks', chapter: 8, type: 'main', giver: 'Ren',
    summary: 'Kage has worn a different face every year. This year he is wearing yours. Enter the Hall of Masks and ask him why.',
    stages: [{ id: 'kill_kage', text: 'Defeat Kage in the Hall of Masks.', kind: 'boss', target: 'kage' }],
    rewards: { xp: 520, essence: 400 },
  },
  mq_yu: {
    id: 'mq_yu', title: 'The Bride of Ash', chapter: 9, type: 'main', giver: 'Yomi',
    summary: 'The wedding ended the guests. The bride is still waiting. The volcano has been waiting with her. Climb.',
    stages: [{ id: 'kill_yu', text: 'Defeat Yū in the Wedding Hall.', kind: 'boss', target: 'yu' }],
    rewards: { xp: 620, essence: 480 },
  },
  mq_crown: {
    id: 'mq_crown', title: 'The Hollow Crown', chapter: 10, type: 'main', giver: 'Yomi',
    summary: 'There is a throne with no king and a crown with no head. It wants a name. Yours will do. Decide what the world becomes.',
    stages: [{ id: 'kill_crown', text: 'Defeat the Hollow Crown.', kind: 'boss', target: 'crown' }],
    rewards: { xp: 1200, essence: 900 },
  },
};

export const SIDE_QUESTS: Record<string, QuestDef> = {
  sq_lantern: {
    id: 'sq_lantern', title: 'A Lantern for the Unnamed', chapter: 0, type: 'side', giver: 'Ame',
    summary: 'Ame wants to light the shrine lantern for everyone the sea took. She needs three memory fragments to give the flame something to remember.',
    stages: [
      { id: 'memories', text: 'Collect 3 memory fragments.', kind: 'collect', target: 'memory_fragment', count: 3, hint: 'Memory fragments glow pale blue at the edges of the world.' },
      { id: 'return', text: 'Return to Ame at the village shrine.', kind: 'talk', target: 'ame' },
    ],
    rewards: { xp: 260, essence: 160, items: [{ id: 'talisman', count: 2 }, { id: 'incense', count: 2 }] },
    acceptFlags: { sq_lantern_started: true },
    completeFlags: { sq_lantern_done: true, ame_lantern: true },
    endingWeight: { remember: 2, speak: 1 },
    lore: 'Ame never met her mother. She lights the lantern anyway.',
  },
  sq_tobi_arm: {
    id: 'sq_tobi_arm', title: 'The Arm That Stayed', chapter: 1, type: 'side', giver: 'Tobi',
    summary: 'Tobi lost his sword arm in a war he will not name. His old blade is still at the ronin camp, and so is the man who took the arm.',
    stages: [
      { id: 'juzo', text: 'Defeat Juzo the Unbowed at the ronin camp.', kind: 'kill', target: 'juzo', hint: 'The camp is west of the village, past the salt watch.' },
      { id: 'ship', text: 'Find Tobi\'s old sword at the Last Ferry wreck.', kind: 'reach', target: 'lm_shore_shipwreck', hint: 'The ferry went down east of the village, where the sea begins.' },
      { id: 'return', text: 'Bring the sword back to Tobi.', kind: 'talk', target: 'tobi' },
    ],
    rewards: { xp: 300, essence: 220, items: [{ id: 'talisman', count: 1 }] },
    completeFlags: { sq_tobi_done: true, tobi_sword: true },
    endingWeight: { remember: 1 },
    lore: 'He says the fish took the arm. The fish had a name, and the name was Juzo.',
  },
  sq_ito_ledger: {
    id: 'sq_ito_ledger', title: 'The Pedlar\'s Debt', chapter: 1, type: 'side', giver: 'Ito',
    summary: 'Ito sold a name to a ronin and now cannot remember his daughter. His ledger is in the salt cave. Get it back before he forgets why he wanted it.',
    stages: [
      { id: 'cave', text: 'Recover the ledger from the Salt Cave.', kind: 'reach', target: 'sec_shore_cave' },
      { id: 'return', text: 'Return the ledger to Ito.', kind: 'talk', target: 'ito' },
    ],
    rewards: { xp: 180, essence: 240, items: [{ id: 'incense', count: 3 }] },
    completeFlags: { sq_ito_done: true, ito_daughter: true },
    endingWeight: { speak: 1 },
    lore: 'There is no daughter in the ledger. There is a payment, and a blank space shaped like one.',
  },
  sq_bell_child: {
    id: 'sq_bell_child', title: 'The Name in the Bell', chapter: 2, type: 'side', giver: 'Sayo',
    summary: 'Sayo has waited nine years for a mother the bell erased. Her name is still inside the temple. You can hear it if you listen. You can also choose not to.',
    stages: [
      { id: 'memories', text: 'Collect 2 memory fragments on the island.', kind: 'collect', target: 'memory_fragment', count: 2 },
      { id: 'return', text: 'Return to Sayo at the temple gate.', kind: 'talk', target: 'sayo' },
    ],
    rewards: { xp: 320, essence: 260, items: [{ id: 'bell_token', count: 3 }] },
    completeFlags: { sq_sayo_done: true },
    endingWeight: { remember: 1, silence: 1 },
    lore: 'Some names are better left in the bell. Some are not.',
  },
  sq_fuyu_wolves: {
    id: 'sq_fuyu_wolves', title: 'The Hearth Must Burn', chapter: 3, type: 'side', giver: 'Elder Fuyu',
    summary: 'Three snow beasts have been circling the village, drawn by the smell of the last hearth. Fuyu is too old to chase them. You are not.',
    stages: [
      { id: 'beasts', text: 'Kill 3 Yuki Apes near the village.', kind: 'kill', target: 'snow_beast', count: 3 },
      { id: 'return', text: 'Return to Elder Fuyu.', kind: 'talk', target: 'fuyu' },
    ],
    rewards: { xp: 300, essence: 220, items: [{ id: 'incense', count: 3 }] },
    completeFlags: { sq_fuyu_done: true, fuyu_hearth: true },
    lore: 'She keeps the hearth cold so the dead will not think she is waiting for them.',
  },
  sq_nao_snowman: {
    id: 'sq_nao_snowman', title: 'A Snowman for Tomorrow', chapter: 3, type: 'side', giver: 'Nao',
    summary: 'Nao built a snowman that looks like her brother. She wants you to leave a flower at Mirror Lake so it knows where to come back to.',
    stages: [
      { id: 'lake', text: 'Reach Mirror Lake and leave the offering.', kind: 'reach', target: 'lm_snow_lake' },
      { id: 'return', text: 'Tell Nao the lake is still there.', kind: 'talk', target: 'nao' },
    ],
    rewards: { xp: 220, essence: 180, items: [{ id: 'snow_lotus', count: 1 }] },
    completeFlags: { sq_nao_done: true, nao_brother: true },
    endingWeight: { remember: 1 },
  },
  sq_zahra_water: {
    id: 'sq_zahra_water', title: 'A Cup for the Caravan', chapter: 5, type: 'side', giver: 'Zahra',
    summary: 'The caravan is dying of thirst. The last garden is real. Zahra will not take the water by force, but she will not let her people die either. Find another way.',
    stages: [
      { id: 'garden', text: 'Reach the Last Garden.', kind: 'reach', target: 'lm_desert_oasis' },
      { id: 'choice', text: 'Decide what happens to the garden.', kind: 'choice', target: 'garden_choice', hint: 'Speak to Zahra after the garden.' },
    ],
    rewards: { xp: 380, essence: 300, items: [{ id: 'dune_glass', count: 1 }] },
    completeFlags: { sq_zahra_done: true },
    endingWeight: { speak: 1, become: 1 },
    lore: 'Water is a name the desert refuses to learn.',
  },
  sq_sami_star: {
    id: 'sq_sami_star', title: 'The Star That Fell', chapter: 5, type: 'side', giver: 'Sami',
    summary: 'Sami has been mapping stars no one else can see. He wants a reading from the Glass Watch, at the top of the tower east of camp.',
    stages: [
      { id: 'tower', text: 'Climb the Glass Watch.', kind: 'reach', target: 'lm_desert_watchtower' },
      { id: 'return', text: 'Bring the reading back to Sami.', kind: 'talk', target: 'sami' },
    ],
    rewards: { xp: 240, essence: 220, items: [{ id: 'talisman', count: 2 }] },
    completeFlags: { sq_sami_done: true, sami_stars: true },
    endingWeight: { remember: 2 },
    lore: 'The stars are not gone. They are just very far away, like everyone else.',
  },
  sq_ren_bells: {
    id: 'sq_ren_bells', title: 'Three Bells for the Blind', chapter: 7, type: 'side', giver: 'Ren',
    summary: 'Ren can hear a name being forgotten. He asks you to ring three shrine bells so the forest remembers its own rhythm.',
    stages: [
      { id: 'gate', text: 'Ring the bell at the Shrine of Green Rain.', kind: 'reach', target: 'bamboo_gate' },
      { id: 'village', text: 'Ring the bell at the Weaver\'s Shrine.', kind: 'reach', target: 'bamboo_village' },
      { id: 'moon', text: 'Ring the bell at the Moonlit Shrine.', kind: 'reach', target: 'bamboo_moon' },
      { id: 'return', text: 'Tell Ren the Requiem has changed.', kind: 'talk', target: 'ren' },
    ],
    rewards: { xp: 420, essence: 320, items: [{ id: 'shrine_seed', count: 1 }] },
    completeFlags: { sq_ren_done: true, requiem_changed: true },
    endingWeight: { remember: 2 },
  },
  sq_lin_letter: {
    id: 'sq_lin_letter', title: 'The Letter in the Loom', chapter: 7, type: 'side', giver: 'Lin',
    summary: 'Lin\'s husband went to the fortress to buy silk and never came back. His last letter is in the mask room. She wants to know what it says. She also does not.',
    stages: [
      { id: 'masks', text: 'Find the letter in the Mask Room.', kind: 'reach', target: 'sec_bamboo_masks' },
      { id: 'return', text: 'Return to Lin with the letter.', kind: 'talk', target: 'lin' },
    ],
    rewards: { xp: 340, essence: 280, items: [{ id: 'talisman', count: 2 }] },
    completeFlags: { sq_lin_done: true, lin_letter: true },
    endingWeight: { speak: 1 },
    lore: 'The letter says he is sorry. It does not say for what.',
  },
  sq_ame_name: {
    id: 'sq_ame_name', title: 'The Name Ame Forgot', chapter: 10, type: 'side', giver: 'Ame',
    summary: 'Ame cannot remember her own name. Three memories are buried in the crown. Find them, and she will speak the fourth name — yours.',
    stages: [
      { id: 'memories', text: 'Collect 3 memory fragments in the Hollow Crown.', kind: 'collect', target: 'memory_fragment', count: 3 },
      { id: 'return', text: 'Return to Ame at the Citadel Shrine.', kind: 'talk', target: 'ame_crown' },
    ],
    rewards: { xp: 800, essence: 600, items: [{ id: 'shrine_seed', count: 1 }] },
    completeFlags: { sq_ame_name_done: true, ame_name: true },
    endingWeight: { remember: 4 },
    lore: 'She wrote your name on the inside of her wrist so she would not forget it. It is the only name she has left.',
  },
  sq_kage_answer: {
    id: 'sq_kage_answer', title: 'The Shogun\'s Answer', chapter: 10, type: 'side', giver: 'Kage',
    summary: 'Kage has one question left, and he will only ask it at the end of the world. Hear him out before you climb the citadel.',
    stages: [
      { id: 'talk', text: 'Speak with Kage at the citadel gate.', kind: 'talk', target: 'kage_ally' },
      { id: 'choice', text: 'Give Kage his answer.', kind: 'choice', target: 'kage_choice' },
    ],
    rewards: { xp: 500, essence: 400, items: [{ id: 'talisman', count: 3 }] },
    completeFlags: { sq_kage_done: true },
    endingWeight: { remember: 1, become: 1 },
  },
};

export const ALL_QUESTS: Record<string, QuestDef> = { ...MAIN_QUESTS, ...SIDE_QUESTS };

export const SIDE_QUEST_ORDER = [
  'sq_lantern', 'sq_tobi_arm', 'sq_ito_ledger', 'sq_bell_child', 'sq_fuyu_wolves',
  'sq_nao_snowman', 'sq_zahra_water', 'sq_sami_star', 'sq_ren_bells', 'sq_lin_letter',
  'sq_ame_name', 'sq_kage_answer',
];

export function mainQuestForChapter(chapter: number): QuestDef {
  const id = ['mq_prologue', 'mq_ushio', 'mq_kane', 'mq_yuki', 'mq_kaji', 'mq_sabaku', 'mq_mori', 'mq_futari', 'mq_kage', 'mq_yu', 'mq_crown'][chapter];
  return MAIN_QUESTS[id];
}
