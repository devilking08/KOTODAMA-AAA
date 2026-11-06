import type { EndingDef } from '../types';

/**
 * Four endings, all reachable from the final choice. The true ending only
 * appears if the player has heard Ame's forgotten name and has done enough of
 * the world's small work; it is a reward for attention, not a difficulty gate.
 */
export const ENDINGS: Record<string, EndingDef> = {
  speak: {
    id: 'speak',
    title: 'The World, Spoken',
    kanji: '言霊',
    requirement: 'Choose to speak the world\'s name.',
    color: '#e8c982',
    flags: { ending_speak: true, world_restored: true },
    text: [
      'Kuro opens his mouth and the Hush leans in, curious, as if someone has finally offered it a chair.',
      'He does not speak a word he learned. He speaks the one underneath all of them: the first thing the world was called before it knew it was a world. The syllable is small. It is enough.',
      'The names come back the way water comes back to a dry riverbed — not all at once, but in a rush that sounds like rain on a thousand roofs. Ame\'s lantern lights itself. Tobi\'s arm remembers the shape of a tiller. Somewhere in the snow, a bride stops waiting and starts walking home.',
      'The Hush does not die. It cannot. But it is no longer the only thing listening.',
    ],
    epilogue: 'The coast rebuilt itself around the shrine. Ame kept the lantern burning, and on clear nights you could hear, very faintly, a fox laughing at a joke nobody had told yet.',
  },
  silence: {
    id: 'silence',
    title: 'The Quiet End',
    kanji: '静寂',
    requirement: 'Choose to let the silence finish.',
    color: '#8fa6b8',
    flags: { ending_silence: true, world_rested: true },
    text: [
      'Kuro does not speak. He sits down on the lip of the broken throne, lays the nameless sword across his knees, and waits.',
      'The Hush takes the world gently. There is no scream, no dissolution, no villain\'s laughter — only a long exhale, the sound a house makes when the last person leaves. The sea forgets the shore. The bell forgets the hour. The snow stops falling because there is no longer anywhere for it to land.',
      'Yomi sits beside him. A fox does not have the shoulders for a vigil, but she manages.',
      '"You could have fixed it," she says.',
      '"I could have made it louder," Kuro says. "That is not the same."',
      'They stay until the last word. It is not a sad ending. It is a finished one.',
    ],
    epilogue: 'Nothing remained of the islands but a sea that did not know it was a sea. In the middle of it, a small stone lantern kept a light nobody had lit. It stayed on for a long time.',
  },
  become: {
    id: 'become',
    title: 'The Keeper',
    kanji: '空位',
    requirement: 'Choose to take the crown.',
    color: '#c94b3a',
    flags: { ending_become: true, crown_taken: true },
    text: [
      'Kuro lifts the crown. It is lighter than it looks, and colder than it should be, and it fits in a way that feels less like wearing and more like being remembered.',
      'The Hush surges — then stops, confused. There is no longer a gap for it to fill. Someone is standing in it.',
      '"You cannot hold it forever," Yomi says. Her voice is steady. Her ears are not.',
      '"I do not have to hold it forever," Kuro says. "I have to hold it long enough for someone else to be ready."',
      'The throne accepts him. The mountain closes its mouth around the court, and the world goes on, and the silence has a keeper now, and the keeper has a name he refuses to give it.',
    ],
    epilogue: 'Travellers still leave offerings at the foot of the volcano. They say the ash tastes like tea. They say if you listen closely, someone inside is practising the same sentence, over and over, trying to get the ending right.',
  },
  remember: {
    id: 'remember',
    title: 'My Name Is Kuro',
    kanji: '記憶',
    requirement: 'Hear Ame\'s forgotten name, complete enough of the world, and choose to remember yourself.',
    color: '#d9b36a',
    flags: { ending_remember: true, true_ending: true, world_restored: true },
    text: [
      'Kuro does not speak the world\'s name. He speaks his own.',
      '"My name is Kuro. I was not a lock. I was a door."',
      'The Hush recoils. It has spent a thousand years looking for the name at the centre of everything, and it never occurred to it that the name might be walking around in a chipped sword and a borrowed coat, being ordinary on purpose.',
      'The crown cracks. The throne becomes a chair. The volcano\'s mouth opens on a sky that is not ash but morning, and the names come home not as a flood but as a conversation — one voice at a time, learning each other again.',
      'Yomi is laughing. Ame is crying. Somewhere far below, a bell rings once, on time, and is allowed to stop.',
    ],
    epilogue: 'Kuro went back to the shore. He built a house with one wall missing, because Yomi liked to come and go as a fox. Ame visited on the first day of every month. The lantern never went out again. The world did not become perfect. It became speakable.',
  },
};

export const ENDING_ORDER = ['speak', 'silence', 'become', 'remember'];

export function pickEnding(flags: Record<string, unknown>): EndingDef {
  const chosen = String(flags['ending_choice'] ?? '');
  return ENDINGS[chosen] ?? ENDINGS.speak;
}

export function trueEndingAvailable(flags: Record<string, unknown>, completedSideQuests: number): boolean {
  return Boolean(flags['ame_name']) && completedSideQuests >= 6;
}
