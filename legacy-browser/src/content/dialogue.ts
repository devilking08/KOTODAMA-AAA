import type { DialogueTree } from '../types';

/**
 * Dialogue is authored as branching trees. `startByFlag` lets a character
 * remember what has happened without duplicating whole trees. Choices can be
 * gated by flags, so the same conversation changes after a boss, a quest, or a
 * name you chose to keep.
 */

export const DIALOGUE: Record<string, DialogueTree> = {
  // ───────────────────────────────────────────────────────────────────────────
  yomi_intro: {
    id: 'yomi_intro', start: 'intro', duckMusic: true,
    startByFlag: [
      { flag: 'boss_ushio', node: 'after_ushio' },
      { flag: 'chapter_1_done', node: 'after_ushio' },
    ],
    nodes: {
      intro: {
        id: 'intro', camera: 'close', end: false,
        lines: [
          { speaker: 'Yomi', text: 'There you are. I have been ringing that bell for an hour and you did not even flinch.', mood: 'wry' },
          { speaker: 'Kuro', text: 'I heard it.', mood: 'solemn' },
          { speaker: 'Yomi', text: 'Names are the nails the world hangs on. Something has been pulling them out. That sword of yours is the last nail I could find.', mood: 'neutral' },
        ],
        choices: [
          { text: 'Who are you?', next: 'who' },
          { text: 'What is the Hush?', next: 'hush' },
          { text: 'Why me?', next: 'why' },
        ],
      },
      who: {
        id: 'who', end: false,
        lines: [
          { speaker: 'Yomi', text: 'A fox. An archivist. A voice that got left behind when its body was forgotten. Take your pick; they are all true enough to hurt.', mood: 'wry' },
          { speaker: 'Yomi', text: 'I keep the names that have nowhere else to go. Lately, business is very good.' },
        ],
        next: 'offer',
      },
      hush: {
        id: 'hush', end: false,
        lines: [
          { speaker: 'Yomi', text: 'The Hush is not silence. Silence is a thing that happens between sounds. The Hush is what happens when a thing is no longer sure it ever made a sound at all.', mood: 'solemn' },
          { speaker: 'Yomi', text: 'It starts at the edges. A fish forgets its river. A widow forgets the face she kept. Then a god forgets why it is worshipped, and the weather changes.' },
        ],
        next: 'offer',
      },
      why: {
        id: 'why', end: false,
        lines: [
          { speaker: 'Yomi', text: 'Because you are still here. That is rarer than you think.', mood: 'sad' },
          { speaker: 'Yomi', text: 'The sword chose you. I would not read too much into it. Swords are sentimental.' },
        ],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [
          { speaker: 'Yomi', text: 'The village shrine keeper is called Ame. She has been waiting for someone with a name like yours. Go to her. Try not to die before the first chapter.' },
        ],
        effects: [
          { type: 'flag', id: 'met_yomi', value: true },
          { type: 'quest', id: 'mq_prologue', value: 'start' },
        ],
        choices: [
          { text: 'I will go.', next: 'end' },
          { text: 'What do I call you?', next: 'name' },
        ],
      },
      name: {
        id: 'name', end: false,
        lines: [
          { speaker: 'Yomi', text: 'Yomi. It means the underworld, or a bad joke, depending on the inflection. I am told I am very funny.', mood: 'wry' },
        ],
        next: 'end',
      },
      end: {
        id: 'end', end: true,
        lines: [{ speaker: 'Yomi', text: 'Lantern road. North. Do not follow the lights into the water.' }],
      },
      after_ushio: {
        id: 'after_ushio', end: false,
        lines: [
          { speaker: 'Yomi', text: 'You took his name. I felt it go into the sword. It is heavier now, isn\'t it?', mood: 'solemn' },
          { speaker: 'Kuro', text: 'He thanked me.' },
          { speaker: 'Yomi', text: 'They usually do. It is the ones who do not that you should worry about.' },
        ],
        choices: [
          { text: 'What happens now?', next: 'after_next' },
          { text: 'Did you know him?', next: 'after_knew' },
        ],
      },
      after_knew: {
        id: 'after_knew', end: false,
        lines: [
          { speaker: 'Yomi', text: 'I knew the name. The man was mostly weather by the time I met him.', mood: 'sad' },
        ],
        next: 'after_next',
      },
      after_next: {
        id: 'after_next', end: true,
        lines: [
          { speaker: 'Yomi', text: 'There is an island east of here. A bell rings every thirteen minutes. Each toll takes a name. We should introduce ourselves before it takes yours.' },
        ],
        effects: [{ type: 'codex', id: 'lore_first_silence' }],
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  ame_shore: {
    id: 'ame_shore', start: 'first', duckMusic: true,
    startByFlag: [
      { flag: 'sq_lantern_done', node: 'thanks' },
      { flag: 'quest_sq_lantern_stage_1', node: 'memories_ready' },
      { flag: 'sq_lantern_started', node: 'reminder' },
      { flag: 'met_ame', node: 'after' },
    ],
    nodes: {
      first: {
        id: 'first', end: false, camera: 'close',
        lines: [
          { speaker: 'Ame', text: 'You came up from the beach. The sea usually keeps what it takes.', mood: 'neutral' },
          { speaker: 'Kuro', text: 'It missed.' },
          { speaker: 'Ame', text: 'Then it is getting careless. Good.', mood: 'wry' },
          { speaker: 'Ame', text: 'I am Ame. I keep the shrine. I used to keep it with my mother, but the Hush took her name and now I only remember the shape of her hands.' },
        ],
        choices: [
          { text: 'I am sorry.', next: 'sorry' },
          { text: 'What do you need?', next: 'need' },
        ],
      },
      sorry: {
        id: 'sorry', end: false,
        lines: [
          { speaker: 'Ame', text: 'Do not be. Sorry does not light a lantern.', mood: 'sad' },
          { speaker: 'Ame', text: 'But a memory might. The shrine lantern has gone out. It needs something to remember. Three fragments should do it.' },
        ],
        next: 'offer',
      },
      need: {
        id: 'need', end: false,
        lines: [
          { speaker: 'Ame', text: 'The lantern is out. It has been out since the sea took the road. I need three memory fragments. They glow blue at the edges of things. You cannot miss them.' },
        ],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [
          { speaker: 'Ame', text: 'Bring them here and I will light it for everyone the sea took. Even the ones whose names I cannot say anymore.' },
        ],
        choices: [
          {
            text: 'I will find them.', next: 'accept',
            effects: [
              { type: 'quest', id: 'sq_lantern', value: 'start' },
              { type: 'flag', id: 'met_ame', value: true },
            ],
          },
          { text: 'Later.', next: 'decline' },
        ],
      },
      accept: {
        id: 'accept', end: false,
        lines: [
          { speaker: 'Ame', text: 'Thank you. And — if you see a man with one arm by the boats, do not let him tell you the fish story. It gets longer every year.' },
        ],
        effects: [{ type: 'flag', id: 'met_ame', value: true }],
        next: 'end',
      },
      decline: {
        id: 'decline', end: true,
        lines: [{ speaker: 'Ame', text: 'The lantern will wait. It is good at that.' }],
        effects: [{ type: 'flag', id: 'met_ame', value: true }],
      },
      after: {
        id: 'after', end: false,
        lines: [
          { speaker: 'Ame', text: 'The general at the cliff still has not moved. The village cannot bury anyone while he is standing there. If you are going to carry that sword, carry it that way.', mood: 'solemn' },
        ],
        choices: [
          { text: 'I will bring him peace.', next: 'end' },
          { text: 'What was his name?', next: 'name' },
        ],
      },
      name: {
        id: 'name', end: false,
        lines: [
          { speaker: 'Ame', text: 'Ushio. It means tide. He used to laugh at that. I remember the laugh. I do not remember his face.', mood: 'sad' },
        ],
        next: 'end',
      },
      reminder: {
        id: 'reminder', end: false,
        lines: [{ speaker: 'Ame', text: 'The fragments are out there. Blue, like a fish under ice. Bring them back and I will make the lantern remember.' }],
        next: 'end',
      },
      memories_ready: {
        id: 'memories_ready', end: false,
        lines: [
          { speaker: 'Ame', text: 'You found them. I can hear them from here. They sound like rain on a roof.', mood: 'neutral' },
          { speaker: 'Ame', text: 'Put them in the lantern. Do not say anything. Let it listen.' },
          { speaker: 'Ame', text: 'There. Look. It is not much of a light, but it is ours.' },
        ],
        effects: [{ type: 'quest', id: 'sq_lantern', value: 'complete' }],
        next: 'thanks',
      },
      thanks: {
        id: 'thanks', end: false,
        lines: [
          { speaker: 'Ame', text: 'The lantern is still burning. I keep expecting it to go out. It has not.', mood: 'wry' },
          { speaker: 'Ame', text: 'When you find your name, come back. I want to be able to say it properly.' },
        ],
        next: 'end',
      },
      end: {
        id: 'end', end: true,
        lines: [],
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  tobi_shore: {
    id: 'tobi_shore', start: 'first',
    startByFlag: [
      { flag: 'sq_tobi_done', node: 'done' },
      { flag: 'quest_sq_tobi_arm_stage_2', node: 'sword_back' },
      { flag: 'sq_tobi_arm_started', node: 'reminder' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Tobi', text: 'You are the one who came out of the sea. I once came out of the sea. Terrible experience. Would not recommend it.', mood: 'wry' },
          { speaker: 'Kuro', text: 'You have one arm.' },
          { speaker: 'Tobi', text: 'I noticed. The fish noticed too. It was a very large fish.' },
        ],
        choices: [
          { text: 'What really took your arm?', next: 'truth' },
          { text: 'Do you need help?', next: 'help' },
        ],
      },
      truth: {
        id: 'truth', end: false,
        lines: [
          { speaker: 'Tobi', text: 'A man named Juzo. He took the arm and the sword with it. He kept the sword. I kept the story about the fish. It is a better story.', mood: 'sad' },
        ],
        next: 'offer',
      },
      help: {
        id: 'help', end: false,
        lines: [
          { speaker: 'Tobi', text: 'There is a sword at the ronin camp west of the salt watch. It was mine. I would like it back. Not for revenge. I just want to hold it once more before I forget what it was for.' },
        ],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [{ speaker: 'Tobi', text: 'Juzo will not give it up. He is very attached to things that are not his.' }],
        choices: [
          {
            text: 'I will get it back.',
            next: 'accept',
            effects: [{ type: 'quest', id: 'sq_tobi_arm', value: 'start' }],
          },
          { text: 'Another time.', next: 'end' },
        ],
      },
      accept: {
        id: 'accept', end: false,
        lines: [{ speaker: 'Tobi', text: 'If he asks, tell him the fish says hello.' }],
        next: 'end',
      },
      reminder: {
        id: 'reminder', end: false,
        lines: [{ speaker: 'Tobi', text: 'West. Salt watch. Camp full of men who think a story is a thing you can own.' }],
        next: 'end',
      },
      sword_back: {
        id: 'sword_back', end: false,
        lines: [
          { speaker: 'Tobi', text: 'That is it. That is the old thing. It is lighter than I remember.', mood: 'sad' },
          { speaker: 'Tobi', text: 'Keep it. I cannot swing it anymore, and you have the look of someone who needs a second edge. Just — when you use it, use it for something that will be remembered.' },
        ],
        effects: [
          { type: 'quest', id: 'sq_tobi_arm', value: 'complete' },
          { type: 'item', id: 'talisman', value: 1 },
        ],
        next: 'done',
      },
      done: {
        id: 'done', end: true,
        lines: [{ speaker: 'Tobi', text: 'The fish says hello, by the way. I have decided it is a friendly fish.' }],
      },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  ito_shore: {
    id: 'ito_shore', start: 'first',
    startByFlag: [
      { flag: 'sq_ito_done', node: 'done' },
      { flag: 'sq_ito_ledger_started', node: 'reminder' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Ito', text: 'A sword with no name! Rare. Expensive. I can find you a name. Very reasonable names. Some of them only slightly used.', mood: 'wry' },
          { speaker: 'Kuro', text: 'I am not buying a name.' },
          { speaker: 'Ito', text: 'Everyone says that until they lose their own.' },
        ],
        choices: [
          { text: 'What do you sell?', next: 'shop' },
          { text: 'You look troubled.', next: 'trouble' },
        ],
      },
      shop: {
        id: 'shop', end: false,
        lines: [
          { speaker: 'Ito', text: 'Incense. Talismans. Regrets. The usual. I am low on regrets at the moment. Very popular item.' },
        ],
        next: 'trouble',
      },
      trouble: {
        id: 'trouble', end: false,
        lines: [
          { speaker: 'Ito', text: 'I sold a name to a ronin. Not my name. My daughter\'s. I needed money for medicine. Now I cannot remember her face, and I cannot find the ledger that says where the name went.', mood: 'sad' },
          { speaker: 'Ito', text: 'The ledger is in the salt cave east of here. I would go myself, but I have forgotten what I am looking for twice already.' },
        ],
        choices: [
          {
            text: 'I will find it.',
            next: 'accept',
            effects: [{ type: 'quest', id: 'sq_ito_ledger', value: 'start' }],
          },
          { text: 'Names are not property.', next: 'reprimand' },
        ],
      },
      reprimand: {
        id: 'reprimand', end: false,
        lines: [
          { speaker: 'Ito', text: 'No. They are not. That is why the market for them is so good.', mood: 'sad' },
        ],
        choices: [
          { text: 'I will get the ledger.', next: 'accept', effects: [{ type: 'quest', id: 'sq_ito_ledger', value: 'start' }] },
          { text: 'Goodbye.', next: 'end' },
        ],
      },
      accept: {
        id: 'accept', end: false,
        lines: [{ speaker: 'Ito', text: 'The cave is east, past the salt watch. If you hear singing, do not answer it. It is not a person. Probably.' }],
        next: 'end',
      },
      reminder: {
        id: 'reminder', end: false,
        lines: [{ speaker: 'Ito', text: 'Salt cave. East. Ledger. Daughter. I am writing it down this time. On my hand.' }],
        next: 'end',
      },
      done: {
        id: 'done', end: false,
        lines: [
          { speaker: 'Ito', text: 'Her name was — is — Hana. I can see her now. Small nose. Terrible laugh. Thank you.', mood: 'sad' },
          { speaker: 'Ito', text: 'Take this. It is not payment. It is a bribe so you will come back and buy something.' },
        ],
        effects: [{ type: 'quest', id: 'sq_ito_ledger', value: 'complete' }],
        next: 'end',
      },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  yomi_bell: {
    id: 'yomi_bell', start: 'intro',
    startByFlag: [{ flag: 'boss_kane', node: 'after' }],
    nodes: {
      intro: {
        id: 'intro', end: false,
        lines: [
          { speaker: 'Yomi', text: 'Thirteen minutes. Did you count? The bell is very punctual. It was a monk in its last life, I think.', mood: 'wry' },
          { speaker: 'Kuro', text: 'The bell is alive?' },
          { speaker: 'Yomi', text: 'Everything is alive if you refuse to let it die. That is the whole problem.' },
        ],
        choices: [
          { text: 'Who is ringing it?', next: 'kane' },
          { text: 'What does it want?', next: 'want' },
        ],
      },
      kane: {
        id: 'kane', end: false,
        lines: [
          { speaker: 'Yomi', text: 'Kane. The last monk of the drowned temple. He believes the world ended a hundred years ago and the bell is the only thing keeping the echo going.', mood: 'sad' },
        ],
        next: 'end',
      },
      want: {
        id: 'want', end: false,
        lines: [
          { speaker: 'Yomi', text: 'To be heard. That is all any of us want. The trouble is what he is willing to erase so the sound carries.' },
        ],
        next: 'end',
      },
      end: { id: 'end', end: true, lines: [{ speaker: 'Yomi', text: 'Go down. The temple is under the temple. Try not to become an echo.' }] },
      after: {
        id: 'after', end: false,
        lines: [
          { speaker: 'Yomi', text: 'The bell stopped. The island is quieter. I did not know how much I hated that sound until it was gone.', mood: 'solemn' },
          { speaker: 'Kuro', text: 'Kane said something before he died.' },
          { speaker: 'Yomi', text: 'They always do. What did he say?' },
          { speaker: 'Kuro', text: '"You are late, Inari."' },
          { speaker: 'Yomi', text: '...Old men say strange things at the end. Come. The snow pass is north.' , mood: 'afraid' },
        ],
        effects: [{ type: 'flag', id: 'yomi_secret_hint', value: true }],
        next: 'end',
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  sayo_bell: {
    id: 'sayo_bell', start: 'first',
    startByFlag: [
      { flag: 'sq_sayo_done', node: 'done' },
      { flag: 'quest_sq_bell_child_stage_1', node: 'ready' },
      { flag: 'sq_bell_child_started', node: 'reminder' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Sayo', text: 'Are you the one who is going to make the bell stop?', mood: 'neutral' },
          { speaker: 'Kuro', text: 'I am going to try.' },
          { speaker: 'Sayo', text: 'Good. My mother is inside it. I hear her when it rings. She says my name wrong. She never used to do that.' },
        ],
        choices: [
          { text: 'What is her name?', next: 'name' },
          { text: 'How long have you been here?', next: 'long' },
        ],
      },
      name: {
        id: 'name', end: false,
        lines: [
          { speaker: 'Sayo', text: 'I do not know. That is the problem. The bell took it. I only know the sound of it. Two notes. Like a bird that is not a bird.' },
        ],
        next: 'offer',
      },
      long: {
        id: 'long', end: false,
        lines: [
          { speaker: 'Sayo', text: 'Nine years, maybe. The pilgrims stopped coming. The bell keeps ringing. I keep listening.' },
        ],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [
          { speaker: 'Sayo', text: 'If you find two memories on the island, I can put them together. I am good at that. I used to fix nets with my mother.' },
        ],
        choices: [
          { text: 'I will look for them.', next: 'accept', effects: [{ type: 'quest', id: 'sq_bell_child', value: 'start' }] },
          { text: 'What if you do not like what you find?', next: 'doubt' },
        ],
      },
      doubt: {
        id: 'doubt', end: false,
        lines: [
          { speaker: 'Sayo', text: 'Then I will have found it anyway. Not knowing is worse. Not knowing is a room with no door.', mood: 'sad' },
        ],
        choices: [
          { text: 'I will look.', next: 'accept', effects: [{ type: 'quest', id: 'sq_bell_child', value: 'start' }] },
          { text: 'I cannot promise anything.', next: 'end' },
        ],
      },
      accept: {
        id: 'accept', end: false,
        lines: [{ speaker: 'Sayo', text: 'The memories are blue. Like the inside of a wave. You can hear them if you hold them to your ear.' }],
        next: 'end',
      },
      reminder: {
        id: 'reminder', end: false,
        lines: [{ speaker: 'Sayo', text: 'Two memories. Blue. I will wait here. I am very good at waiting.' }],
        next: 'end',
      },
      ready: {
        id: 'ready', end: false,
        lines: [
          { speaker: 'Sayo', text: 'You found them. Put them here, on the step. Not too close. They are loud.' },
          { speaker: 'Sayo', text: '...Hana. Her name was Hana. And she did not say my name wrong. She was saying goodbye.', mood: 'sad' },
        ],
        choices: [
          {
            text: 'Keep the name. It is yours now.',
            next: 'kept',
            effects: [
              { type: 'quest', id: 'sq_bell_child', value: 'complete' },
              { type: 'flag', id: 'sayo_saved', value: true },
              { type: 'flag', id: 'sayo_name_kept', value: true },
            ],
          },
          {
            text: 'Let the bell keep her. Some names are too heavy.',
            next: 'let_go',
            effects: [
              { type: 'quest', id: 'sq_bell_child', value: 'complete' },
              { type: 'flag', id: 'sayo_saved', value: false },
              { type: 'flag', id: 'sayo_let_go', value: true },
            ],
          },
        ],
      },
      kept: {
        id: 'kept', end: false,
        lines: [
          { speaker: 'Sayo', text: 'I will say it every morning. Hana. Hana. Hana. Until the bell forgets it again.', mood: 'neutral' },
          { speaker: 'Sayo', text: 'If you find your name, I will say that too.' },
        ],
        next: 'end',
      },
      let_go: {
        id: 'let_go', end: false,
        lines: [
          { speaker: 'Sayo', text: '...Yes. Maybe. She always said I held on too tight.', mood: 'sad' },
          { speaker: 'Sayo', text: 'The bell is quieter now. I do not know if that is better.' },
        ],
        next: 'end',
      },
      done: {
        id: 'done', end: true,
        lines: [{ speaker: 'Sayo', text: 'I am still here. The bell is not. That is a kind of trade, I think.' }],
      },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  yomi_snow: {
    id: 'yomi_snow', start: 'intro',
    startByFlag: [{ flag: 'boss_yuki', node: 'after' }],
    nodes: {
      intro: {
        id: 'intro', end: false,
        lines: [
          { speaker: 'Yomi', text: 'The snow is going up again. I hate it when it does that.', mood: 'wry' },
          { speaker: 'Kuro', text: 'The Hush is here.' },
          { speaker: 'Yomi', text: 'The Hush is everywhere. Here it has a bride. Yuki waited at the chapel for a man who took the wrong road. The mountain has been apologizing ever since, in snow.' },
        ],
        choices: [
          { text: 'Did he ever come?', next: 'groom' },
          { text: 'Why does she stay?', next: 'stay' },
        ],
      },
      groom: {
        id: 'groom', end: false,
        lines: [{ speaker: 'Yomi', text: 'He is buried at the bottom of the pass. He was late by about six hours. She has been late by thirty years.', mood: 'sad' }],
        next: 'end',
      },
      stay: {
        id: 'stay', end: false,
        lines: [{ speaker: 'Yomi', text: 'Because leaving would mean he is not coming. As long as she waits, he is still on the road.' }],
        next: 'end',
      },
      end: { id: 'end', end: true, lines: [{ speaker: 'Yomi', text: 'The chapel is south. Bring something warm. It will not help, but bring it anyway.' }] },
      after: {
        id: 'after', end: false,
        lines: [
          { speaker: 'Yomi', text: 'Her bouquet is still frozen on the altar. I could not make myself move it.', mood: 'sad' },
          { speaker: 'Kuro', text: 'There is a monastery above the pass. It is still burning.' },
          { speaker: 'Yomi', text: 'Kaji. He was a kind man. Kindness with no one left to give it to is just a fire.' },
        ],
        next: 'end',
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  fuyu_snow: {
    id: 'fuyu_snow', start: 'first',
    startByFlag: [
      { flag: 'sq_fuyu_done', node: 'done' },
      { flag: 'quest_sq_fuyu_wolves_stage_1', node: 'ready' },
      { flag: 'sq_fuyu_wolves_started', node: 'reminder' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Elder Fuyu', text: 'You are not dressed for the pass. Nobody ever is.', mood: 'neutral' },
          { speaker: 'Kuro', text: 'I am looking for the chapel.' },
          { speaker: 'Fuyu', text: 'Everyone is. The chapel is where the mountain keeps its dead. Lately it has been keeping the living too.' },
        ],
        choices: [
          { text: 'What is happening here?', next: 'what' },
          { text: 'Can I help?', next: 'help' },
        ],
      },
      what: {
        id: 'what', end: false,
        lines: [
          { speaker: 'Fuyu', text: 'Three apes have been circling the village. They are not hungry. They are afraid. The mountain is telling them something and they cannot obey it fast enough.' },
        ],
        next: 'offer',
      },
      help: {
        id: 'help', end: false,
        lines: [
          { speaker: 'Fuyu', text: 'The apes. Three of them. If you can send them off, the hearth will burn another winter. If not, we will burn what is left of the roofs.' },
        ],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [{ speaker: 'Fuyu', text: 'Do not hate them. They are only carrying the mountain\'s fear. Put it down for them.' }],
        choices: [
          { text: 'I will do it.', next: 'accept', effects: [{ type: 'quest', id: 'sq_fuyu_wolves', value: 'start' }] },
          { text: 'Not now.', next: 'end' },
        ],
      },
      accept: { id: 'accept', end: false, lines: [{ speaker: 'Fuyu', text: 'Good. And if you see Nao, tell her the snowman will not melt. She worries.' }], next: 'end' },
      reminder: { id: 'reminder', end: false, lines: [{ speaker: 'Fuyu', text: 'The apes are still out there. So is the cold. One of you is more patient.' }], next: 'end' },
      ready: {
        id: 'ready', end: false,
        lines: [
          { speaker: 'Fuyu', text: 'They are gone. The mountain is quieter. You have a way with endings.', mood: 'neutral' },
        ],
        effects: [{ type: 'quest', id: 'sq_fuyu_wolves', value: 'complete' }],
        next: 'done',
      },
      done: { id: 'done', end: true, lines: [{ speaker: 'Fuyu', text: 'Take this. It is warm. That is all I know how to give anymore.' }] },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  nao_snow: {
    id: 'nao_snow', start: 'first',
    startByFlag: [
      { flag: 'sq_nao_done', node: 'done' },
      { flag: 'quest_sq_nao_snowman_stage_1', node: 'ready' },
      { flag: 'sq_nao_snowman_started', node: 'reminder' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Nao', text: 'Do you want to see my snowman? It looks like my brother. He is not dead. He is just not here.' },
          { speaker: 'Kuro', text: 'Where is he?' },
          { speaker: 'Nao', text: 'At Mirror Lake. He went to get the moon out of the water. He has been gone since before the snow.' },
        ],
        choices: [
          { text: 'I will look for him.', next: 'offer' },
          { text: 'That is a good snowman.', next: 'offer' },
        ],
      },
      offer: {
        id: 'offer', end: false,
        lines: [
          { speaker: 'Nao', text: 'Can you leave a flower at the lake? So he knows which way home is. The snow keeps moving the path.' },
        ],
        choices: [
          { text: 'I will leave one.', next: 'accept', effects: [{ type: 'quest', id: 'sq_nao_snowman', value: 'start' }] },
          { text: 'I am not good at flowers.', next: 'end' },
        ],
      },
      accept: { id: 'accept', end: false, lines: [{ speaker: 'Nao', text: 'There are white ones by the shrine. Do not pick the ones that are looking at you.' }], next: 'end' },
      reminder: { id: 'reminder', end: false, lines: [{ speaker: 'Nao', text: 'Mirror Lake is east. If the ice hums, hum back. It likes that.' }], next: 'end' },
      ready: {
        id: 'ready', end: false,
        lines: [
          { speaker: 'Nao', text: 'You left it? Did he see? Did he wave?', mood: 'neutral' },
          { speaker: 'Kuro', text: 'The lake is still there. The flower is still there.' },
          { speaker: 'Nao', text: 'Then he knows where to come back to. That is enough. That is what a home is, I think.' },
        ],
        effects: [{ type: 'quest', id: 'sq_nao_snowman', value: 'complete' }],
        next: 'done',
      },
      done: { id: 'done', end: true, lines: [{ speaker: 'Nao', text: 'I am going to make another snowman. This one will look like you. It will have a very serious face.' }] },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  yomi_desert: {
    id: 'yomi_desert', start: 'intro',
    startByFlag: [{ flag: 'boss_sabaku', node: 'after' }],
    nodes: {
      intro: {
        id: 'intro', end: false,
        lines: [
          { speaker: 'Yomi', text: 'The dunes are humming. That is not the wind. The sand remembers being an ocean and it is trying to sing the tune.', mood: 'wry' },
          { speaker: 'Kuro', text: 'You said you were an archivist.' },
          { speaker: 'Yomi', text: 'I am. This is the archive. Every grain is a page that has forgotten the sentence.' },
        ],
        choices: [
          { text: 'What is buried here?', next: 'buried' },
          { text: 'You are hiding something.', next: 'hiding' },
        ],
      },
      buried: {
        id: 'buried', end: false,
        lines: [{ speaker: 'Yomi', text: 'A queen. A garden. A rain that was promised. The usual foundations of a kingdom.', mood: 'sad' }],
        next: 'end',
      },
      hiding: {
        id: 'hiding', end: false,
        lines: [
          { speaker: 'Yomi', text: 'I am a fox. Hiding is a professional obligation.', mood: 'wry' },
          { speaker: 'Yomi', text: 'But yes. Ask me again when the sand is quieter.' },
        ],
        effects: [{ type: 'flag', id: 'yomi_desert_doubt', value: true }],
        next: 'end',
      },
      end: { id: 'end', end: true, lines: [{ speaker: 'Yomi', text: 'The Dune Throne is west. Bring water. Do not drink it. That is for later.' }] },
      after: {
        id: 'after', end: false,
        lines: [
          { speaker: 'Yomi', text: 'Sabaku is gone. The sand is still humming, though. It has been humming for a hundred years. I do not think it is about her.' },
          { speaker: 'Kuro', text: 'The garden is east. It is real.' },
          { speaker: 'Yomi', text: 'Of course it is. The last real thing in a desert is always a garden. It is the oldest joke in the world.' },
        ],
        next: 'end',
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  zahra_desert: {
    id: 'zahra_desert', start: 'first',
    startByFlag: [
      { flag: 'sq_zahra_done', node: 'done' },
      { flag: 'quest_sq_zahra_water_stage_1', node: 'garden_found' },
      { flag: 'sq_zahra_water_started', node: 'reminder' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Zahra', text: 'You walk like someone who has not been thirsty. Enjoy it. It is a limited pleasure.', mood: 'wry' },
          { speaker: 'Kuro', text: 'Your caravan is suffering.' },
          { speaker: 'Zahra', text: 'My caravan is dying. There is a difference. Dying takes longer and costs more.' },
        ],
        choices: [
          { text: 'Is there water nearby?', next: 'water' },
          { text: 'What do you need?', next: 'need' },
        ],
      },
      water: {
        id: 'water', end: false,
        lines: [{ speaker: 'Zahra', text: 'There is a garden east of here. A real one. Trees. Water. A man who has kept it alive for a hundred years. He will not share.', mood: 'sad' }],
        next: 'offer',
      },
      need: {
        id: 'need', end: false,
        lines: [{ speaker: 'Zahra', text: 'The garden. I need someone who can talk to a man who has decided that saving one tree is the same as saving the world.' }],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [{ speaker: 'Zahra', text: 'Go and see it. Then come back and tell me if there is a way to save both the garden and my people. I am not asking you to choose. I am asking you to be cleverer than me.' }],
        choices: [
          { text: 'I will find a way.', next: 'accept', effects: [{ type: 'quest', id: 'sq_zahra_water', value: 'start' }] },
          { text: 'What if there is no way?', next: 'noway' },
        ],
      },
      noway: {
        id: 'noway', end: false,
        lines: [{ speaker: 'Zahra', text: 'Then I will take the water, and I will hate myself, and my people will live. That is also a way.' }],
        choices: [
          { text: 'I will look first.', next: 'accept', effects: [{ type: 'quest', id: 'sq_zahra_water', value: 'start' }] },
          { text: 'I understand.', next: 'end' },
        ],
      },
      accept: { id: 'accept', end: false, lines: [{ speaker: 'Zahra', text: 'The garden is east. Follow the green line on the horizon. It is not a mirage. That is the problem.' }], next: 'end' },
      reminder: { id: 'reminder', end: false, lines: [{ speaker: 'Zahra', text: 'East. Green. Real. Come back with an answer, not a handful of leaves.' }], next: 'end' },
      garden_found: {
        id: 'garden_found', end: false,
        lines: [
          { speaker: 'Zahra', text: 'You saw it. The gardener is dead? Then the water is free. Why do you look like that?', mood: 'neutral' },
        ],
        choices: [
          {
            text: 'Share the garden with the caravan.',
            next: 'share',
            effects: [
              { type: 'flag', id: 'garden_choice', value: 'shared' },
              { type: 'flag', id: 'zahra_water', value: true },
              { type: 'quest', id: 'sq_zahra_water', value: 'complete' },
            ],
          },
          {
            text: 'Leave the garden to grow wild.',
            next: 'wild',
            effects: [
              { type: 'flag', id: 'garden_choice', value: 'kept' },
              { type: 'flag', id: 'garden_kept', value: true },
              { type: 'quest', id: 'sq_zahra_water', value: 'complete' },
            ],
          },
        ],
      },
      share: {
        id: 'share', end: false,
        lines: [
          { speaker: 'Zahra', text: 'You are giving me a garden and a guilt at the same time. That is a very expensive gift.', mood: 'wry' },
          { speaker: 'Zahra', text: 'We will take only what the garden can spare. I will make sure of it. Thank you.' },
        ],
        next: 'done',
      },
      wild: {
        id: 'wild', end: false,
        lines: [
          { speaker: 'Zahra', text: 'Then we will move north. There is a well there. It is dry, but it is a direction.', mood: 'sad' },
          { speaker: 'Zahra', text: 'You made a choice. I will not say it was wrong. I will say it was made from a full cup.' },
        ],
        next: 'done',
      },
      done: { id: 'done', end: true, lines: [{ speaker: 'Zahra', text: 'Go on. The dunes are patient, but they are not kind.' }] },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  sami_desert: {
    id: 'sami_desert', start: 'first',
    startByFlag: [
      { flag: 'sq_sami_done', node: 'done' },
      { flag: 'quest_sq_sami_star_stage_1', node: 'ready' },
      { flag: 'sq_sami_star_started', node: 'reminder' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Sami', text: 'Do you know any stars? I have named eleven. None of them answer.', mood: 'neutral' },
          { speaker: 'Kuro', text: 'Stars do not answer.' },
          { speaker: 'Sami', text: 'That is what my mother says. She also says the desert used to be a sea. Nobody believes her either.' },
        ],
        choices: [
          { text: 'What are you looking for?', next: 'looking' },
          { text: 'Show me your map.', next: 'map' },
        ],
      },
      looking: {
        id: 'looking', end: false,
        lines: [{ speaker: 'Sami', text: 'A star that fell. If I can find where it landed, I can prove the sky is still there. Everyone says it is, but nobody looks up anymore.' }],
        next: 'offer',
      },
      map: {
        id: 'map', end: false,
        lines: [{ speaker: 'Sami', text: 'It is mostly blank. The blank parts are where the stars went. I am filling them in as I find them.' }],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [{ speaker: 'Sami', text: 'The Glass Watch is east of camp. If you climb it and tell me what the sky looks like from up there, I can finish the map.' }],
        choices: [
          { text: 'I will climb it.', next: 'accept', effects: [{ type: 'quest', id: 'sq_sami_star', value: 'start' }] },
          { text: 'Why not climb it yourself?', next: 'why' },
        ],
      },
      why: {
        id: 'why', end: false,
        lines: [{ speaker: 'Sami', text: 'The stairs are afraid of me. Or I am afraid of the stairs. One of those.', mood: 'wry' }],
        choices: [
          { text: 'I will go.', next: 'accept', effects: [{ type: 'quest', id: 'sq_sami_star', value: 'start' }] },
          { text: 'Maybe later.', next: 'end' },
        ],
      },
      accept: { id: 'accept', end: false, lines: [{ speaker: 'Sami', text: 'Take this. It is a star map. If you get lost, turn it upside down. Then you are lost in a different direction.' }], next: 'end' },
      reminder: { id: 'reminder', end: false, lines: [{ speaker: 'Sami', text: 'The Glass Watch. East. Tall. You cannot miss it. That is the point of tall things.' }], next: 'end' },
      ready: {
        id: 'ready', end: false,
        lines: [
          { speaker: 'Sami', text: 'You saw it? The whole sky? Was it big? Was it still there?', mood: 'neutral' },
          { speaker: 'Kuro', text: 'It was still there.' },
          { speaker: 'Sami', text: 'Then I can finish the map. And when I am done, I am going to go and look at it myself. I promise.' },
        ],
        effects: [{ type: 'quest', id: 'sq_sami_star', value: 'complete' }],
        next: 'done',
      },
      done: { id: 'done', end: true, lines: [{ speaker: 'Sami', text: 'I named a star after you. It is the small one. It is very stubborn and it does not move.' }] },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  yomi_bamboo: {
    id: 'yomi_bamboo', start: 'intro',
    startByFlag: [{ flag: 'boss_futari', node: 'after' }],
    nodes: {
      intro: {
        id: 'intro', end: false,
        lines: [
          { speaker: 'Yomi', text: 'Listen. The forest is counting. One. Two. One. Two. It has been counting since before the monks came.', mood: 'neutral' },
          { speaker: 'Kuro', text: 'The twins.' },
          { speaker: 'Yomi', text: 'They were born with one name. The forest learned the rhythm of them fighting over it. Now the rain falls in that rhythm.' },
        ],
        choices: [
          { text: 'Can a name be split?', next: 'split' },
          { text: 'Did you know them?', next: 'knew' },
        ],
      },
      split: {
        id: 'split', end: false,
        lines: [{ speaker: 'Yomi', text: 'Any name can be split. That is what a lie is. The trick is putting it back together without cutting yourself.', mood: 'solemn' }],
        next: 'end',
      },
      knew: {
        id: 'knew', end: false,
        lines: [{ speaker: 'Yomi', text: 'I gave them the blades. It seemed like a good idea at the time. Most of my good ideas have a body count.', mood: 'sad' }],
        next: 'end',
      },
      end: { id: 'end', end: true, lines: [{ speaker: 'Yomi', text: 'The Moonlit Clearing is south. Walk between the stalks, not through them. The forest is particular.' }] },
      after: {
        id: 'after', end: false,
        lines: [
          { speaker: 'Yomi', text: 'One of them is still alive. I can hear one set of footsteps. I do not know which one. I am not sure they do either.', mood: 'sad' },
          { speaker: 'Kuro', text: 'The fortress is east. Kage is waiting.' },
          { speaker: 'Yomi', text: 'Kage. The Shogun of masks. He has been waiting for you longer than you know.' },
        ],
        next: 'end',
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  ren_bamboo: {
    id: 'ren_bamboo', start: 'first',
    startByFlag: [
      { flag: 'sq_ren_done', node: 'done' },
      { flag: 'quest_sq_ren_bells_stage_3', node: 'ready' },
      { flag: 'sq_ren_bells_started', node: 'reminder' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Ren', text: 'You walk loudly. That is a compliment. Most people arrive quietly and leave a hole.', mood: 'wry' },
          { speaker: 'Kuro', text: 'You can hear that?' },
          { speaker: 'Ren', text: 'I can hear the shape of you. The eyes are not the only way to see. They are only the loudest.' },
        ],
        choices: [
          { text: 'What is the Requiem?', next: 'requiem' },
          { text: 'You are blind.', next: 'blind' },
        ],
      },
      requiem: {
        id: 'requiem', end: false,
        lines: [
          { speaker: 'Ren', text: 'The forest counting its dead. Three shrines keep the count. Lately the count has been wrong. It keeps adding names that are still alive.' },
        ],
        next: 'offer',
      },
      blind: {
        id: 'blind', end: false,
        lines: [
          { speaker: 'Ren', text: 'Yes. It is very restful. I recommend it, though the paperwork is terrible.', mood: 'wry' },
          { speaker: 'Ren', text: 'I hear the Requiem better than I ever saw it. Three shrines. Three bells. They have fallen out of rhythm.' },
        ],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [{ speaker: 'Ren', text: 'Ring them in order. Green Rain, Weaver, Moon. Let the forest hear itself again.' }],
        choices: [
          { text: 'I will ring them.', next: 'accept', effects: [{ type: 'quest', id: 'sq_ren_bells', value: 'start' }] },
          { text: 'What happens if I ring them wrong?', next: 'wrong' },
        ],
      },
      wrong: {
        id: 'wrong', end: false,
        lines: [{ speaker: 'Ren', text: 'The forest forgets which names are dead and which are waiting. You have met the waiting ones. They are not patient forever.' }],
        choices: [
          { text: 'I will be careful.', next: 'accept', effects: [{ type: 'quest', id: 'sq_ren_bells', value: 'start' }] },
          { text: 'I will come back.', next: 'end' },
        ],
      },
      accept: { id: 'accept', end: false, lines: [{ speaker: 'Ren', text: 'Start here. Then the village. Then the moon. Do not ring the moon bell with a full heart. It echoes.' }], next: 'end' },
      reminder: { id: 'reminder', end: false, lines: [{ speaker: 'Ren', text: 'Three bells. The forest is still counting. It is counting on you, which is a pun I apologize for.' }], next: 'end' },
      ready: {
        id: 'ready', end: false,
        lines: [
          { speaker: 'Ren', text: 'There. The count is right again. Listen — the rain is falling in fours now. It was always fours. We forgot.', mood: 'neutral' },
          { speaker: 'Ren', text: 'You have a name in you. It is very quiet. When you find it, do not shout it. Names break when they are shouted.' },
        ],
        effects: [{ type: 'quest', id: 'sq_ren_bells', value: 'complete' }],
        next: 'done',
      },
      done: { id: 'done', end: true, lines: [{ speaker: 'Ren', text: 'Go east. The Shogun is waiting. He has a question for you. He has been holding it for a long time.' }] },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  lin_bamboo: {
    id: 'lin_bamboo', start: 'first',
    startByFlag: [
      { flag: 'sq_lin_done', node: 'done' },
      { flag: 'quest_sq_lin_letter_stage_1', node: 'ready' },
      { flag: 'sq_lin_letter_started', node: 'reminder' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Lin', text: 'The loom is empty. It has been empty for six years. I keep sitting at it. My hands have not noticed.', mood: 'sad' },
          { speaker: 'Kuro', text: 'What happened?' },
          { speaker: 'Lin', text: 'My husband went to the fortress to buy silk. He sent one letter. Then the Shogun started wearing masks, and the fortress stopped sending anything back.' },
        ],
        choices: [
          { text: 'I can look for him.', next: 'offer' },
          { text: 'The letter — do you still have it?', next: 'letter' },
        ],
      },
      letter: {
        id: 'letter', end: false,
        lines: [{ speaker: 'Lin', text: 'I burned it. I could not read it again. But there is another. He always wrote twice. The second one is in the mask room.', mood: 'sad' }],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [{ speaker: 'Lin', text: 'If you find it, bring it to me. I want to know. I also want to keep sitting here. Both can be true.' }],
        choices: [
          { text: 'I will find it.', next: 'accept', effects: [{ type: 'quest', id: 'sq_lin_letter', value: 'start' }] },
          { text: 'Some letters are better lost.', next: 'end' },
        ],
      },
      accept: { id: 'accept', end: false, lines: [{ speaker: 'Lin', text: 'The mask room is inside the fortress, east. Do not put anything on. Not even for a joke.' }], next: 'end' },
      reminder: { id: 'reminder', end: false, lines: [{ speaker: 'Lin', text: 'The fortress. The mask room. The second letter. I am sorry to send you into that place.' }], next: 'end' },
      ready: {
        id: 'ready', end: false,
        lines: [
          { speaker: 'Lin', text: 'You found it. Is it his hand? Yes. I can tell by the way he crosses his sevens.', mood: 'sad' },
          { speaker: 'Lin', text: '...He says he is sorry. He does not say for what. He says the Shogun is not a man anymore. He says he is going to stay.' },
          { speaker: 'Lin', text: 'Then he was already gone when he wrote it. Thank you. Now I can stop waiting for a letter and start waiting for the loom.' },
        ],
        effects: [{ type: 'quest', id: 'sq_lin_letter', value: 'complete' }],
        next: 'done',
      },
      done: { id: 'done', end: true, lines: [{ speaker: 'Lin', text: 'Take this thread. It is green. It is the color of the only thing I ever made that did not unravel.' }] },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  yomi_crown: {
    id: 'yomi_crown', start: 'intro',
    startByFlag: [
      { flag: 'boss_yu', node: 'after_yu' },
      { flag: 'boss_crown', node: 'after_crown' },
    ],
    nodes: {
      intro: {
        id: 'intro', end: false,
        lines: [
          { speaker: 'Yomi', text: 'This is the last quiet place. After this, the mountain stops pretending to be a mountain.', mood: 'solemn' },
          { speaker: 'Kuro', text: 'You have been here before.' },
          { speaker: 'Yomi', text: 'I built it. Not the mountain. The silence inside it.', mood: 'sad' },
        ],
        choices: [
          { text: 'Tell me the truth.', next: 'truth' },
          { text: 'Not yet.', next: 'end' },
        ],
      },
      truth: {
        id: 'truth', end: false,
        lines: [
          { speaker: 'Yomi', text: 'My name is Inari. I was the last god who could speak. The Crown was eating names faster than I could make them, so I took the names first. I hid them in the sword. I hid yours in it too.', mood: 'sad' },
          { speaker: 'Kuro', text: 'You made me nameless.' },
          { speaker: 'Yomi', text: 'I made you the lock. I am sorry. I have been sorry for a hundred years. It has not helped anyone yet.' },
        ],
        effects: [
          { type: 'flag', id: 'yomi_truth', value: true },
          { type: 'codex', id: 'lore_first_name' },
        ],
        next: 'end',
      },
      end: { id: 'end', end: true, lines: [{ speaker: 'Yomi', text: 'The Wedding Hall is west. Yū is waiting. She has been waiting longer than me.' }] },
      after_yu: {
        id: 'after_yu', end: false,
        lines: [
          { speaker: 'Yomi', text: 'Yū is free. The mountain is not. The Crown is at the top. It knows you are coming. It has been practicing your face.', mood: 'solemn' },
          { speaker: 'Kuro', text: 'What happens if I take the crown?' },
          { speaker: 'Yomi', text: 'You become the next silence. It is a very good job. The hours are eternal.' },
        ],
        next: 'end',
      },
      after_crown: {
        id: 'after_crown', end: true,
        lines: [{ speaker: 'Yomi', text: 'It is done. Now comes the part I cannot do for you.' }],
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  ame_crown: {
    id: 'ame_crown', start: 'first',
    startByFlag: [
      { flag: 'sq_ame_name_done', node: 'final' },
      { flag: 'quest_sq_ame_name_stage_1', node: 'ready' },
      { flag: 'sq_ame_name_started', node: 'reminder' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Ame', text: 'You came. I knew you would. I have been trying to remember your name since the beach.', mood: 'sad' },
          { speaker: 'Kuro', text: 'You do not have to.' },
          { speaker: 'Ame', text: 'I do. I wrote it on my wrist. It is the only name I have left that is not mine.', mood: 'neutral' },
        ],
        choices: [
          { text: 'What do you need?', next: 'offer' },
          { text: 'Why are you here?', next: 'why' },
        ],
      },
      why: {
        id: 'why', end: false,
        lines: [{ speaker: 'Ame', text: 'Because someone has to keep the lantern lit at the end of the world. I am very qualified. I have had a lot of practice.' }],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [{ speaker: 'Ame', text: 'Three memories are buried in this place. Find them. They are the last pieces of your name. When you have them, come back and I will say it properly.' }],
        choices: [
          { text: 'I will find them.', next: 'accept', effects: [{ type: 'quest', id: 'sq_ame_name', value: 'start' }] },
          { text: 'What if I do not like the name?', next: 'doubt' },
        ],
      },
      doubt: {
        id: 'doubt', end: false,
        lines: [{ speaker: 'Ame', text: 'Then you can give it back. Names are not debts. Not the real ones.' }],
        choices: [
          { text: 'I will find them.', next: 'accept', effects: [{ type: 'quest', id: 'sq_ame_name', value: 'start' }] },
          { text: 'I need time.', next: 'end' },
        ],
      },
      accept: { id: 'accept', end: false, lines: [{ speaker: 'Ame', text: 'They are blue. Like the lantern. Like the sea before it forgot the sun.' }], next: 'end' },
      reminder: { id: 'reminder', end: false, lines: [{ speaker: 'Ame', text: 'Three memories. I am not going anywhere. I am very good at shrines.' }], next: 'end' },
      ready: {
        id: 'ready', end: false,
        lines: [
          { speaker: 'Ame', text: 'You found them. Give them here. No — hold still. This is going to sound strange for a moment.' },
          { speaker: 'Ame', text: '...Kuro. That is your name. Kuro. It means black. It means the color before the first word. It was never a small name.' },
          { speaker: 'Ame', text: 'There. I said it. Now it is yours again.' },
        ],
        effects: [
          { type: 'quest', id: 'sq_ame_name', value: 'complete' },
          { type: 'flag', id: 'ame_name', value: true },
        ],
        next: 'final',
      },
      final: {
        id: 'final', end: true,
        lines: [
          { speaker: 'Ame', text: 'Go up. Whatever you choose, choose it with your whole name. I will keep the lantern lit either way.' },
        ],
      },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  kage_crown: {
    id: 'kage_crown', start: 'first',
    startByFlag: [
      { flag: 'sq_kage_done', node: 'done' },
      { flag: 'boss_kage', node: 'after' },
    ],
    nodes: {
      first: {
        id: 'first', end: false,
        lines: [
          { speaker: 'Kage', text: 'You beat me. I have been trying to decide whether that means I was wrong, or only slower.', mood: 'neutral' },
          { speaker: 'Kuro', text: 'You let me win.' },
          { speaker: 'Kage', text: 'I let you live. There is a difference. I am still deciding which one it was.' },
        ],
        choices: [
          { text: 'Why did you serve the Crown?', next: 'why' },
          { text: 'Take off the mask.', next: 'mask' },
        ],
      },
      why: {
        id: 'why', end: false,
        lines: [
          { speaker: 'Kage', text: 'Because a throne with no king still needs someone to stand in front of it. I was good at standing. I was less good at asking what I was standing for.', mood: 'sad' },
        ],
        next: 'offer',
      },
      mask: {
        id: 'mask', end: false,
        lines: [
          { speaker: 'Kage', text: 'If I take it off, I will have to be a man again. I am out of practice.', mood: 'wry' },
          { speaker: 'Kage', text: '...There. It is not a good face. It is mine.' },
        ],
        effects: [{ type: 'flag', id: 'kage_unmasked', value: true }],
        next: 'offer',
      },
      offer: {
        id: 'offer', end: false,
        lines: [{ speaker: 'Kage', text: 'I have one question. If you can answer it, I will follow you up the mountain. If not, I will go home and become a gardener.' }],
        choices: [
          { text: 'Ask.' , next: 'question' },
          { text: 'I do not have time.' , next: 'end' },
        ],
      },
      question: {
        id: 'question', end: false,
        lines: [
          { speaker: 'Kage', text: 'When the world forgets you — and it will — what do you want it to remember instead?', mood: 'solemn' },
        ],
        choices: [
          {
            text: 'That I chose to speak.',
            next: 'spare',
            effects: [
              { type: 'flag', id: 'kage_choice', value: 'spared' },
              { type: 'flag', id: 'kage_spared', value: true },
              { type: 'quest', id: 'sq_kage_answer', value: 'complete' },
            ],
          },
          {
            text: 'That I was not afraid.',
            next: 'spare',
            effects: [
              { type: 'flag', id: 'kage_choice', value: 'spared' },
              { type: 'flag', id: 'kage_spared', value: true },
              { type: 'quest', id: 'sq_kage_answer', value: 'complete' },
            ],
          },
          {
            text: 'Nothing. Let me be forgotten.',
            next: 'leave',
            effects: [
              { type: 'flag', id: 'kage_choice', value: 'dismissed' },
              { type: 'flag', id: 'kage_dismissed', value: true },
              { type: 'quest', id: 'sq_kage_answer', value: 'complete' },
            ],
          },
        ],
      },
      spare: {
        id: 'spare', end: false,
        lines: [
          { speaker: 'Kage', text: 'Then I will remember that. I am very good at remembering things I cannot fix.' },
          { speaker: 'Kage', text: 'I will be at the gate. Do not make me wait as long as Yū did.' },
        ],
        next: 'done',
      },
      leave: {
        id: 'leave', end: false,
        lines: [
          { speaker: 'Kage', text: 'That is the first honest answer anyone has given me. I will go home. The garden will be terrible. I will be happy.' },
        ],
        next: 'done',
      },
      after: {
        id: 'after', end: false,
        lines: [{ speaker: 'Kage', text: 'The Crown is at the top. It is not a god. It is a hole with a crown on it. Do not let it make you into a hole.' }],
        next: 'done',
      },
      done: { id: 'done', end: true, lines: [{ speaker: 'Kage', text: 'Go. I will keep the gate. I have always been good at gates.' }] },
      end: { id: 'end', end: true, lines: [] },
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  ending_choice: {
    id: 'ending_choice', start: 'intro', duckMusic: true,
    nodes: {
      intro: {
        id: 'intro', end: false, camera: 'wide',
        lines: [
          { speaker: 'Yomi', text: 'The Crown is broken. The names are free. They are waiting for someone to speak them.', mood: 'solemn' },
          { speaker: 'Kuro', text: 'Or to let them go.' },
          { speaker: 'Yomi', text: 'Yes. That is the other ending. It is quieter. It is not worse.' },
          { speaker: 'Ame', text: 'Kuro. Whatever you choose, I am here. The lantern is lit.' },
        ],
        choices: [
          { text: 'Speak the world\'s name. Restore what was lost.', next: 'speak' },
          { text: 'Let the silence finish. Let the world rest.', next: 'silence' },
          { text: 'Take the crown. Hold the silence yourself.', next: 'become' },
          {
            text: 'Speak your own name. Break the lock.',
            next: 'remember',
            requiresFlag: 'true_ending_unlocked',
          },
        ],
      },
      speak: {
        id: 'speak', end: true,
        lines: [
          { speaker: 'Kuro', text: 'The world was not finished. Let it be finished now.' },
          { speaker: 'Yomi', text: 'Then speak, Kotodama. I will listen. I am very good at listening.' },
        ],
        effects: [{ type: 'flag', id: 'ending_choice', value: 'speak' }],
      },
      silence: {
        id: 'silence', end: true,
        lines: [
          { speaker: 'Kuro', text: 'No more names. No more nails. Let it go.' },
          { speaker: 'Yomi', text: '...All right. I will stay with you. Until the last word.' },
        ],
        effects: [{ type: 'flag', id: 'ending_choice', value: 'silence' }],
      },
      become: {
        id: 'become', end: true,
        lines: [
          { speaker: 'Kuro', text: 'Someone has to hold it. It will not be a god this time.' },
          { speaker: 'Yomi', text: 'You stupid, brave boy. I will bring you tea. Every hundred years. I will bring you tea.' },
        ],
        effects: [{ type: 'flag', id: 'ending_choice', value: 'become' }],
      },
      remember: {
        id: 'remember', end: true,
        lines: [
          { speaker: 'Kuro', text: 'My name is Kuro. I was not a lock. I was a door.' },
          { speaker: 'Ame', text: 'Kuro. I remember. I will always remember.' },
          { speaker: 'Yomi', text: '...Then the Hush has nothing left to hold. Go on. Open.' },
        ],
        effects: [{ type: 'flag', id: 'ending_choice', value: 'remember' }],
      },
    },
  },
};

export function getDialogue(id: string): DialogueTree | undefined {
  return DIALOGUE[id];
}
