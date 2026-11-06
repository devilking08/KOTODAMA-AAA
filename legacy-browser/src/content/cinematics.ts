import type { CinematicDef } from '../types';

const line = (at: number, speaker: string, text: string, duration = 4.2) =>
  ({ at, kind: 'line' as const, speaker, text, duration });

const fade = (at: number, value: number, duration = 0.8) =>
  ({ at, kind: 'fade' as const, value, duration });

const title = (at: number, text: string, duration = 3.6) =>
  ({ at, kind: 'title' as const, text, duration });

/**
 * Cinematics are timeline data, not scripts. The player can skip any of them;
 * on a second viewing a "skip" prompt appears immediately. Chapter intros lean
 * on atmosphere rather than exposition — the world is meant to be overheard.
 */
export const CINEMATICS: Record<string, CinematicDef> = {
  cine_prologue: {
    id: 'cine_prologue', duration: 13, skippable: true, letterbox: true,
    music: { mood: 'shore', root: 146.83, scale: [0, 3, 5, 7, 10], bpm: 62 },
    steps: [
      fade(0, 1, 1.2),
      line(1.2, 'Yomi', 'You are awake. Good. The sea was starting to look smug.'),
      line(5.0, 'Kuro', 'Where am I?'),
      line(7.0, 'Yomi', 'The shore of broken words. Try not to add to the pile.'),
      title(10.4, 'KOTODAMA', 2.4),
      fade(12.4, 0, 0.6),
    ],
  },

  cine_ch1_intro: {
    id: 'cine_ch1_intro', duration: 12, skippable: true, letterbox: true,
    music: { mood: 'shore', root: 130.81, scale: [0, 2, 3, 7, 9], bpm: 58 },
    steps: [
      fade(0, 1, 1),
      title(0.9, 'CHAPTER I', 2.6),
      title(3.0, 'The General Who Drowned', 3.2),
      line(6.0, 'Ame', 'He is still standing at the cliff. The sea keeps him there.'),
      line(9.4, 'Kuro', 'Then I will give him a reason to sit down.'),
      fade(11.2, 0, 0.8),
    ],
  },
  cine_ch1_outro: {
    id: 'cine_ch1_outro', duration: 11, skippable: true, letterbox: true,
    steps: [
      fade(0, 1, 0.8),
      line(0.8, 'Ushio', 'Tide... that was my name. I had forgotten the shape of it.'),
      line(4.2, 'Kuro', 'The village will remember.'),
      line(6.8, 'Ushio', 'Then I can be still. Thank you, nameless one.'),
      line(9.4, 'Yomi', 'One name returned. Nine hundred and ninety-nine to go. No pressure.'),
      fade(10.4, 0, 0.6),
    ],
  },

  cine_ch2_intro: {
    id: 'cine_ch2_intro', duration: 12, skippable: true, letterbox: true,
    music: { mood: 'shore', root: 110, scale: [0, 2, 5, 7, 10], bpm: 54 },
    steps: [
      fade(0, 1, 1),
      title(0.9, 'CHAPTER II', 2.4),
      title(2.9, 'The Bell That Would Not Stop', 3.4),
      line(6.2, 'Sayo', 'Thirteen minutes. That is how long we have between names.'),
      line(9.6, 'Kuro', 'Then I will not waste the thirteenth.'),
      fade(11.2, 0, 0.8),
    ],
  },
  cine_ch2_outro: {
    id: 'cine_ch2_outro', duration: 10, skippable: true, letterbox: true,
    steps: [
      fade(0, 1, 0.8),
      line(0.8, 'Kane', 'If I stop... who will keep the count?'),
      line(3.8, 'Kuro', 'The living. We will keep it badly, and that is better.'),
      line(7.0, 'Kane', '...Yes. That is better.'),
      line(9.0, 'Yomi', 'The bell is quiet. Listen: the island is still here.'),
      fade(9.6, 0, 0.6),
    ],
  },

  cine_ch3_intro: {
    id: 'cine_ch3_intro', duration: 12.4, skippable: true, letterbox: true,
    music: { mood: 'snow', root: 98, scale: [0, 2, 3, 7, 8], bpm: 48 },
    steps: [
      fade(0, 1, 1.1),
      title(1.0, 'CHAPTER III', 2.4),
      title(3.0, 'A Wedding in Winter', 3.4),
      line(6.4, 'Fuyu', 'Do not tell her the groom is dead. She has heard it. She has chosen not to agree.'),
      line(9.8, 'Kuro', 'I am not here to argue with grief.'),
      fade(11.6, 0, 0.8),
    ],
  },
  cine_ch3_outro: {
    id: 'cine_ch3_outro', duration: 10.4, skippable: true, letterbox: true,
    steps: [
      fade(0, 1, 0.8),
      line(0.8, 'Yuki', 'He was late. That is all. He was always late.'),
      line(4.2, 'Kuro', 'He was not late. He took the wrong road. There is a difference.'),
      line(7.2, 'Yuki', '...Then I can stop waiting for the wrong one.'),
      line(9.2, 'Yomi', 'The snow is letting go. Look. The mountain is breathing out.'),
      fade(9.8, 0, 0.6),
    ],
  },

  cine_ch4_intro: {
    id: 'cine_ch4_intro', duration: 12, skippable: true, letterbox: true,
    music: { mood: 'snow', root: 116.54, scale: [0, 1, 5, 7, 8], bpm: 52 },
    steps: [
      fade(0, 1, 1),
      title(0.9, 'CHAPTER IV', 2.4),
      title(2.9, 'The Warm Hand', 3.2),
      line(6.0, 'Fuyu', 'The monastery has been burning for thirty years. The fire is patient. It has learned to wait.'),
      line(9.4, 'Kuro', 'Fires do not wait. People do.'),
      fade(11.2, 0, 0.8),
    ],
  },
  cine_ch4_outro: {
    id: 'cine_ch4_outro', duration: 10.8, skippable: true, letterbox: true,
    steps: [
      fade(0, 1, 0.8),
      line(0.8, 'Kaji', 'Is the child warm?'),
      line(3.4, 'Kuro', 'The child is grown. The child is alive because of you.'),
      line(6.6, 'Kaji', 'Then the fire can go out. I have been keeping it for the wrong person.'),
      line(9.0, 'Yomi', 'The snow is falling on the ashes. It looks almost kind.'),
      fade(9.9, 0, 0.6),
    ],
  },

  cine_ch5_intro: {
    id: 'cine_ch5_intro', duration: 12.4, skippable: true, letterbox: true,
    music: { mood: 'desert', root: 146.83, scale: [0, 1, 4, 5, 7], bpm: 64 },
    steps: [
      fade(0, 1, 1.1),
      title(1.0, 'CHAPTER V', 2.4),
      title(3.0, 'Queen of the Drowned Dunes', 3.6),
      line(6.6, 'Zahra', 'The queen sold our water for a rain that never came. She is still collecting the debt.'),
      line(10.0, 'Kuro', 'Debts have a way of outliving the reason for them.'),
      fade(11.6, 0, 0.8),
    ],
  },
  cine_ch5_outro: {
    id: 'cine_ch5_outro', duration: 11.2, skippable: true, letterbox: true,
    steps: [
      fade(0, 1, 0.8),
      line(0.8, 'Sabaku', 'The rain never came. I was so certain it would come.'),
      line(4.4, 'Kuro', 'You kept the desert waiting with you. It did not deserve that.'),
      line(7.6, 'Sabaku', 'No. It did not. Take the water back to the caravan. Tell them the debt is cancelled.'),
      line(10.0, 'Yomi', 'The sand is settling. Somewhere, a well is remembering how to be a well.'),
      fade(10.4, 0, 0.6),
    ],
  },

  cine_ch6_intro: {
    id: 'cine_ch6_intro', duration: 12.4, skippable: true, letterbox: true,
    music: { mood: 'desert', root: 130.81, scale: [0, 3, 5, 7, 10], bpm: 56 },
    steps: [
      fade(0, 1, 1.1),
      title(1.0, 'CHAPTER VI', 2.4),
      title(3.0, 'The Last Garden', 3.2),
      line(6.2, 'Zahra', 'We can drink it or we can leave it. There is no third answer that keeps everyone alive.'),
      line(9.8, 'Kuro', 'There is always a third answer. It is usually the one nobody wants to say out loud.'),
      fade(11.6, 0, 0.8),
    ],
  },
  cine_ch6_outro: {
    id: 'cine_ch6_outro', duration: 11.6, skippable: true, letterbox: true,
    steps: [
      fade(0, 1, 0.8),
      line(0.8, 'Mori', 'I cannot remember why I started. But I remember that it was worth it.'),
      line(4.6, 'Kuro', 'The garden remembers. That is enough for now.'),
      line(7.8, 'Zahra', 'We will take half the water and leave the seeds. In ten years, there will be two gardens.'),
      line(10.4, 'Yomi', 'A compromise. How terrifying. How grown-up.'),
      fade(10.8, 0, 0.6),
    ],
  },

  cine_ch7_intro: {
    id: 'cine_ch7_intro', duration: 12.4, skippable: true, letterbox: true,
    music: { mood: 'bamboo', root: 174.61, scale: [0, 2, 3, 7, 9], bpm: 72 },
    steps: [
      fade(0, 1, 1.1),
      title(1.0, 'CHAPTER VII', 2.4),
      title(3.0, 'Two Names, One Blade', 3.4),
      line(6.4, 'Ren', 'They were born with one name. Neither of them can bear to be the one who keeps it.'),
      line(9.8, 'Kuro', 'Then I will give them a third thing to fight over: the truth.'),
      fade(11.6, 0, 0.8),
    ],
  },
  cine_ch7_outro: {
    id: 'cine_ch7_outro', duration: 11.2, skippable: true, letterbox: true,
    steps: [
      fade(0, 1, 0.8),
      line(0.8, 'Futari', 'If we are both Futari... then neither of us is.'),
      line(4.4, 'Kuro', 'You are two people. That is not a smaller thing than being one.'),
      line(7.6, 'Futari', 'No one has ever said that to us.'),
      line(9.8, 'Yomi', 'The grove is quiet. It has been waiting thirty years to hear that.'),
      fade(10.4, 0, 0.6),
    ],
  },

  cine_ch8_intro: {
    id: 'cine_ch8_intro', duration: 12.4, skippable: true, letterbox: true,
    music: { mood: 'bamboo', root: 155.56, scale: [0, 1, 5, 6, 10], bpm: 76 },
    steps: [
      fade(0, 1, 1.1),
      title(1.0, 'CHAPTER VIII', 2.4),
      title(3.0, 'The City of Masks', 3.2),
      line(6.2, 'Ren', 'The shogun has worn a different face every year. This year the face is yours.'),
      line(9.8, 'Kuro', 'Then I will ask him what he did with the man underneath.'),
      fade(11.6, 0, 0.8),
    ],
  },
  cine_ch8_outro: {
    id: 'cine_ch8_outro', duration: 11.6, skippable: true, letterbox: true,
    steps: [
      fade(0, 1, 0.8),
      line(0.8, 'Kage', 'I wore your face because you were the only one who had not chosen yet.'),
      line(4.6, 'Kuro', 'A mask is not a choice. It is a delay.'),
      line(7.6, 'Kage', 'Then I am out of time. Take the mask. Ask me anything.'),
      line(10.2, 'Yomi', 'One more city, one more crown. The end is getting closer. I can smell it.'),
      fade(10.8, 0, 0.6),
    ],
  },

  cine_ch9_intro: {
    id: 'cine_ch9_intro', duration: 13, skippable: true, letterbox: true,
    music: { mood: 'crown', root: 87.31, scale: [0, 1, 4, 6, 7], bpm: 50 },
    steps: [
      fade(0, 1, 1.2),
      title(1.0, 'CHAPTER IX', 2.4),
      title(3.0, 'The Bride of Ash', 3.4),
      line(6.4, 'Yomi', 'She has been waiting at the altar since the wedding killed everyone. She is not a ghost. Ghosts get to leave.'),
      line(10.4, 'Kuro', 'Then I will bring her the last guest\'s apology.'),
      fade(12.2, 0, 0.8),
    ],
  },
  cine_ch9_outro: {
    id: 'cine_ch9_outro', duration: 11.6, skippable: true, letterbox: true,
    steps: [
      fade(0, 1, 0.8),
      line(0.8, 'Yū', 'The groom became the mountain. The guests became the ash. What did I become?'),
      line(4.8, 'Kuro', 'The one who survived. That is not a small thing.'),
      line(8.0, 'Yū', 'No. It is the heaviest thing I have ever carried. Put it down for me.'),
      line(10.4, 'Yomi', 'The volcano is quiet. I did not know it could be quiet.'),
      fade(10.8, 0, 0.6),
    ],
  },

  cine_ch10_intro: {
    id: 'cine_ch10_intro', duration: 14, skippable: true, letterbox: true,
    music: { mood: 'crown', root: 73.42, scale: [0, 1, 3, 6, 8], bpm: 44 },
    steps: [
      fade(0, 1, 1.2),
      title(1.0, 'CHAPTER X', 2.4),
      title(3.0, 'The Hollow Crown', 3.6),
      line(6.8, 'Yomi', 'This is where I stop being a fox and start being honest.'),
      line(10.2, 'Kuro', 'I know what you are.'),
      line(12.2, 'Yomi', 'Then you know what it will cost to hear the last name.'),
      fade(13.2, 0, 0.8),
    ],
  },

  cine_ending: {
    id: 'cine_ending', duration: 22, skippable: true, letterbox: true,
    music: { mood: 'ending', root: 110, scale: [0, 2, 4, 7, 9], bpm: 54 },
    steps: [
      fade(0, 1, 1.2),
      line(1.0, 'Yomi', 'The Crown is broken. The names are free. They are waiting for someone to speak them.'),
      line(5.6, 'Kuro', 'Or to let them go.'),
      line(8.4, 'Ame', 'Whatever you choose, the lantern is lit. I will keep it lit.'),
      fade(11.0, 1, 1.0),
      title(12.0, 'The last word is yours.', 5.0),
      fade(17.5, 0, 1.5),
    ],
  },
};

export const CHAPTER_INTRO_IDS = Array.from({ length: 10 }, (_, index) => `cine_ch${index + 1}_intro`);
