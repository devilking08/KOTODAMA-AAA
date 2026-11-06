import type { CodexEntry } from '../types';

/**
 * The Codex is the world's memory made legible. Every entry is unlocked by a
 * flag so it works identically for lore pickups, boss kills, weapon finds and
 * story beats. Text is written in the voice of an in-world archivist.
 */
export const CODEX: Record<string, CodexEntry> = {
  // ── World ────────────────────────────────────────────────────────────────
  the_hush: {
    id: 'the_hush', category: 'world', title: 'The Hush', unlockFlag: 'codex_the_hush',
    text: 'Not a silence. A subtraction. The Hush does not kill a thing; it removes the word for it, and then the memory, and finally the shape. People do not notice they have lost a name until they try to call someone home.',
  },
  names: {
    id: 'names', category: 'world', title: 'Names Are Nails', unlockFlag: 'codex_names',
    text: 'The old faith held that a true name is a nail driven through a person into the world. Pull the nail and the person comes loose. Kotodama is the craft of driving it back in — or of choosing, at last, not to.',
  },
  shrines: {
    id: 'shrines', category: 'world', title: 'Road Shrines', unlockFlag: 'codex_shrines',
    text: 'A shrine is a promise that someone will return. Rest at one and the world resets its small cruelties: wounds close, gourds fill, and the dead are permitted to stay dead until morning.',
  },
  ink_road: {
    id: 'ink_road', category: 'world', title: 'The Ink Road', unlockFlag: 'codex_ink_road',
    text: 'The road between regions is drawn in ink, not stone. It changes when nobody is watching. The lanterns are the only fixed points, and even they have been known to move one step to the left.',
  },
  drowned_coast: {
    id: 'drowned_coast', category: 'world', title: 'The Drowned Coast', unlockFlag: 'codex_drowned_coast',
    text: 'Once the wealthiest shore in the islands. Now the sea owns three streets, a temple, and the entire month of harvest. Fishermen still set nets over the roofs.',
  },
  bell_island: {
    id: 'bell_island', category: 'world', title: 'The Bell Island', unlockFlag: 'codex_bell_island',
    text: 'A monastery built on a drowned caldera. The bell is older than the island and rings on a schedule no living monk set. Pilgrims came to hear it once. Now they come to make sure it is still ringing, which is a different kind of prayer.',
  },
  snow_pass: {
    id: 'snow_pass', category: 'world', title: 'The Snow Pass', unlockFlag: 'codex_snow_pass',
    text: 'The pass is a corridor of white with no horizon. Travellers tie red thread between trees so the mountain knows where they meant to go. The mountain keeps the thread.',
  },
  drowned_dunes: {
    id: 'drowned_dunes', category: 'world', title: 'The Drowned Dunes', unlockFlag: 'codex_dunes',
    text: 'A sea that dried into sand and never told anyone. Beneath the dunes are the ribs of ships, the foundations of a court, and a queen who still expects rain.',
  },
  requiem_grove: {
    id: 'requiem_grove', category: 'world', title: 'The Requiem Grove', unlockFlag: 'codex_requiem_grove',
    text: 'Bamboo remembers rhythm. Strike a blade here and the grove repeats it hours later, slightly wrong. The twins have been practising in this forest for thirty years; the forest has been practising them.',
  },
  hollow_crown: {
    id: 'hollow_crown', category: 'world', title: 'The Hollow Crown', unlockFlag: 'codex_hollow_crown',
    text: 'A palace built inside a volcano around a wedding that never happened. Every hall remembers the same day differently. The throne is empty because the crown is the throne, and the crown is a name with the name taken out.',
  },
  endings: {
    id: 'endings', category: 'world', title: 'Four Ways to End a Sentence', unlockFlag: 'codex_endings',
    text: 'Speak: the world resumes. Silence: the world is allowed to stop. Become: the silence is given a keeper. Remember: the lock is opened from the inside. The fourth is not hidden; it is simply difficult to deserve.',
  },

  // ── Characters ───────────────────────────────────────────────────────────
  kuro: {
    id: 'kuro', category: 'characters', title: 'Kuro, the Nameless', unlockFlag: 'codex_kuro',
    text: 'A swordsman with no family name and no memory before the beach. His blade is chipped, his bell has no clapper, and the Hush cannot seem to find the word for him. This is either a blessing or a very old trap.',
  },
  yomi: {
    id: 'yomi', category: 'characters', title: 'Yomi, the Fox in the Bell', unlockFlag: 'codex_yomi',
    text: 'A white fox who speaks in riddles and walks like a person who has practised. Claims to be a minor shrine spirit. Knows the true name of every road, every bell, and — eventually — the protagonist. The ears are real. The rest is negotiable.',
  },
  ame: {
    id: 'ame', category: 'characters', title: 'Ame, the Namekeeper', unlockFlag: 'codex_ame',
    text: 'Shrine keeper of the Nameless Village. She writes the names of the dead on paper lanterns because paper is the only thing the Hush has trouble eating. Her mother is one of the lanterns. She has never been able to read which one.',
  },
  ushio: {
    id: 'ushio', category: 'characters', title: 'Ushio, Warden of the Tide', unlockFlag: 'boss_ushio',
    text: 'A general who held a causeway for nine days after the war had ended. The sea offered him a command: stand here and no one you love will be forgotten. He accepted. The sea lied, but it lied in a way that kept him standing.',
  },
  kane: {
    id: 'kane', category: 'characters', title: 'Kane, the Bellkeeper', unlockFlag: 'boss_kane',
    text: 'The last monk of the drowned temple. He rings the bell every thirteen minutes because each toll takes one name instead of all of them. He believes he is saving the world. He is, in the way a tourniquet saves a limb.',
  },
  yuki: {
    id: 'yuki', category: 'characters', title: 'Yuki, the White Silence', unlockFlag: 'boss_yuki',
    text: 'A bride who waited at the altar while the pass filled with snow. The groom took the wrong road. Yuki kept the bouquet fresh by refusing to accept that time had continued. The mountain obliged her. That is the trouble with mountains.',
  },
  kaji: {
    id: 'kaji', category: 'characters', title: 'Kaji, the Ember Monk', unlockFlag: 'boss_kaji',
    text: 'He set the monastery alight to keep one child warm through a blizzard. The child lived. So did the fire. Kaji has been feeding it his memories ever since, one warm hand at a time, because it will not accept anything colder.',
  },
  sabaku: {
    id: 'sabaku', category: 'characters', title: 'Sabaku, Queen of the Drowned Dunes', unlockFlag: 'boss_sabaku',
    text: 'Sold the last oasis to a rain god for a single storm. The god forgot. Sabaku did not. She has been collecting the debt from every caravan since, in water, in years, in names. The interest is the desert.',
  },
  mori: {
    id: 'mori', category: 'characters', title: 'Mori, the Last Gardener', unlockFlag: 'boss_mori',
    text: 'A gardener who refused to let the last green thing die. He waters it with his own memories. The garden is beautiful. Mori can no longer remember his own name, his mother, or why he started. The garden remembers for him.',
  },
  futari: {
    id: 'futari', category: 'characters', title: 'Futari, the Twin Blades', unlockFlag: 'boss_futari',
    text: 'Two swordsmen born with one name between them. They have spent thirty years deciding who keeps it. Neither will kill the other, so they kill everyone who might choose. The forest considers this a form of marriage.',
  },
  kage: {
    id: 'kage', category: 'characters', title: 'Kage, the Masked Shogun', unlockFlag: 'boss_kage',
    text: 'The shogun of a city whose throne is empty. Every year he wears a new face so that no one can ask him who he was before. This year he wears the protagonist\'s. Under the mask is a man who has forgotten which of his choices were his.',
  },
  yu: {
    id: 'yu', category: 'characters', title: 'Yū, Bride of Ash', unlockFlag: 'boss_yu',
    text: 'The bride of the wedding that ended the war by ending the guests. Yū survived because she was already dead. She has been waiting at the altar for a groom who became the volcano. She is not angry. She is precise.',
  },
  crown: {
    id: 'crown', category: 'characters', title: 'That Which Forgot Itself', unlockFlag: 'boss_crown',
    text: 'The first name ever spoken, worn hollow by being spoken too many times. It created the world as a sentence and has been trying to finish the sentence ever since. It does not hate you. It has simply run out of words.',
  },

  // ── Bestiary ─────────────────────────────────────────────────────────────
  ronin: {
    id: 'ronin', category: 'bestiary', title: 'Nameless Ronin', unlockFlag: 'bestiary_ronin',
    text: 'Masterless swordsmen whose masters were erased. They fight for a name no one can give them. Parry the second cut; the first is a formality.',
  },
  archer: {
    id: 'archer', category: 'bestiary', title: 'Ash Archer', unlockFlag: 'bestiary_archer',
    text: 'Uses arrows fletched with written prayers. The prayers are for the arrow, not the target. Close the distance or deflect the shaft.',
  },
  brute: {
    id: 'brute', category: 'bestiary', title: 'Bell Brute', unlockFlag: 'bestiary_brute',
    text: 'A labourer who carried the temple bell up the cliff and never put it down. Slow, enormous, and strangely polite about the wind-up.',
  },
  drowned_spirit: {
    id: 'drowned_spirit', category: 'bestiary', title: 'Drowned Spirit', unlockFlag: 'bestiary_drowned_spirit',
    text: 'A memory of a drowning, repeating. It cannot leave the water that killed it and resents anything that can. Fire and steel both work; pity works faster.',
  },
  bell_monk: {
    id: 'bell_monk', category: 'bestiary', title: 'Bell Monk', unlockFlag: 'bestiary_bell_monk',
    text: 'A monk who bound his voice to a hand-bell. Every strike is also a syllable. Break the bell and the man remembers how to be quiet.',
  },
  snow_beast: {
    id: 'snow_beast', category: 'bestiary', title: 'Yuki Ape', unlockFlag: 'bestiary_snow_beast',
    text: 'White-furred, black-eyed, and convinced the pass belongs to it. Throws ice and grudges with equal accuracy.',
  },
  frost_ronin: {
    id: 'frost_ronin', category: 'bestiary', title: 'Frostbound Ronin', unlockFlag: 'bestiary_frost_ronin',
    text: 'A swordsman who froze mid-duel and kept duelling. The ice is part of the technique now.',
  },
  sand_bandit: {
    id: 'sand_bandit', category: 'bestiary', title: 'Dune Bandit', unlockFlag: 'bestiary_sand_bandit',
    text: 'A caravan guard who became the thing caravans fear. Wraps his blade in cloth so the sand does not dull it and the wind does not warn you.',
  },
  dune_stalker: {
    id: 'dune_stalker', category: 'bestiary', title: 'Dune Stalker', unlockFlag: 'bestiary_dune_stalker',
    text: 'A predator that swims through sand the way sharks swim through water. The dorsal ridge is the only warning. It is not a generous warning.',
  },
  bamboo_assassin: {
    id: 'bamboo_assassin', category: 'bestiary', title: 'Bamboo Assassin', unlockFlag: 'bestiary_bamboo_assassin',
    text: 'Trained to move only when the bamboo moves. In a grove, that is always. Listen for the pause in the rain.',
  },
  hollow_spirit: {
    id: 'hollow_spirit', category: 'bestiary', title: 'Hollow Spirit', unlockFlag: 'bestiary_hollow_spirit',
    text: 'What remains when the Hush takes everything but the outline. It attacks because it remembers that hands are for holding. It has forgotten what.',
  },
  ash_knight: {
    id: 'ash_knight', category: 'bestiary', title: 'Ash Knight', unlockFlag: 'bestiary_ash_knight',
    text: 'Armour filled with the memory of a knight. The armour is loyal. The memory is not. Strike the joints; the ash remembers being a body.',
  },
  elite_note: {
    id: 'elite_note', category: 'bestiary', title: 'On Elites', unlockFlag: 'bestiary_elite',
    text: 'Some names refuse to be erased quietly. They grow armour made of the things they refuse to forget: a bell, a wedding ring, a debt. Break the posture and the memory spills out. Do not stand in it.',
  },

  // ── Blades ───────────────────────────────────────────────────────────────
  blade_katana: {
    id: 'blade_katana', category: 'blades', title: 'Nameless (Katana)', unlockFlag: 'codex_kuro',
    text: 'A chipped uchigatana with no smith\'s mark. Balanced, honest, and quick. The last cut of its combo breaks guard. The blade remembers every hand that held it; yours is the first it has chosen.',
  },
  blade_odachi: {
    id: 'blade_odachi', category: 'blades', title: 'Sunder (Odachi)', unlockFlag: 'weapon_odachi',
    text: 'A field sword carried upright through a hundred years of tide. Slow, enormous, and built to end arguments. Its art splits the ground and everything standing on it.',
  },
  blade_spear: {
    id: 'blade_spear', category: 'blades', title: 'Longing (Yari)', unlockFlag: 'weapon_spear',
    text: 'Reach is a kind of courtesy: it keeps the other person at the distance where you can still see them. Its art crosses the whole battlefield in a single line.',
  },
  blade_dual: {
    id: 'blade_dual', category: 'blades', title: 'Twin Echo (Dual Blades)', unlockFlag: 'weapon_dual',
    text: 'Two short blades that answer each other. The fastest weapon, the lowest posture damage, the most chances to be brave. Its art is a storm with a centre you can stand in.',
  },
  blade_greatsword: {
    id: 'blade_greatsword', category: 'blades', title: 'Bone Bell (Greatsword)', unlockFlag: 'weapon_greatsword',
    text: 'Funeral bronze beaten into an edge. Every swing tolls for someone. The heaviest posture damage in the game; the longest commitment. Its art rings the dead awake.',
  },

  // ── Memories ─────────────────────────────────────────────────────────────
  mem_ferryman: {
    id: 'mem_ferryman', category: 'memories', title: 'The Ferryman\'s Coin', unlockFlag: 'codex_mem_ferryman',
    text: 'A coin placed under a tongue for a ferry that never came. The ferryman waited too. The coin is warm. Somebody is still paying the fare, one small memory at a time.',
  },
  mem_salt_watch: {
    id: 'mem_salt_watch', category: 'memories', title: 'Salt Watch', unlockFlag: 'codex_mem_salt_watch',
    text: 'A watchtower log: "Third night. No ships. Lit the lamp anyway. If the sea is going to take the coast, it can take it in daylight." The handwriting gets larger toward the end.',
  },
  mem_child_vow: {
    id: 'mem_child_vow', category: 'memories', title: 'A Child\'s Vow', unlockFlag: 'codex_mem_child_vow',
    text: 'Two children promised to meet at the second gate when the war ended. One came. The other became a general who could not leave the water. The gate is still standing. The promise is still a promise.',
  },
  mem_pilgrim_boat: {
    id: 'mem_pilgrim_boat', category: 'memories', title: 'The Pilgrim Boat', unlockFlag: 'codex_mem_pilgrim_boat',
    text: 'A boat built for a pilgrimage to a bell that had already stopped. The pilgrims rowed anyway. Faith, the log says, is not the bell; it is the rowing.',
  },
  mem_mother_voice: {
    id: 'mem_mother_voice', category: 'memories', title: 'A Mother\'s Voice', unlockFlag: 'codex_mem_mother_voice',
    text: 'A voice saying a name over and over, getting the consonants wrong on purpose because the child used to laugh. The Hush has taken the name. It could not take the laugh.',
  },
  mem_bouquet: {
    id: 'mem_bouquet', category: 'memories', title: 'The Frozen Bouquet', unlockFlag: 'codex_mem_bouquet',
    text: 'Winter flowers, picked on a morning that never ended. The bride arranged them by colour: white for the road, red for the promise, yellow for the person she was before.',
  },
  mem_warm_hand: {
    id: 'mem_warm_hand', category: 'memories', title: 'The Warm Hand', unlockFlag: 'codex_mem_warm_hand',
    text: 'A child\'s hand in a monk\'s hand, both blue with cold. The monk is repeating a prayer. The child is asleep. The fire is deciding what it is willing to eat.',
  },
  mem_groom: {
    id: 'mem_groom', category: 'memories', title: 'The Groom\'s Road', unlockFlag: 'codex_mem_groom',
    text: 'A man walking the wrong road in a blizzard, certain he is early. He is carrying a ring and a joke about the weather. He will not arrive. The mountain keeps him walking because it likes the joke.',
  },
  mem_sunken_court: {
    id: 'mem_sunken_court', category: 'memories', title: 'The Sunken Court', unlockFlag: 'codex_mem_sunken_court',
    text: 'A queen\'s court, preserved beneath the sand. The chairs are arranged for a banquet. Every plate has a name written on it. One plate is yours.',
  },
  mem_tomb_rain: {
    id: 'mem_tomb_rain', category: 'memories', title: 'The Tomb of Rain', unlockFlag: 'codex_mem_tomb_rain',
    text: 'A tomb built for rain, with channels and gutters and a roof shaped like a cloud. It is dry. The architect is inside it, still waiting for the first drop.',
  },
  mem_last_garden: {
    id: 'mem_last_garden', category: 'memories', title: 'The Last Garden', unlockFlag: 'codex_mem_last_garden',
    text: 'A garden that survived a desert by being loved too specifically. Every plant is a memory with roots. The gardener can no longer remember the names, but the garden remembers his.',
  },
  mem_requiem: {
    id: 'mem_requiem', category: 'memories', title: 'The Requiem', unlockFlag: 'codex_mem_requiem',
    text: 'A song for two voices. One voice starts, the other answers half a beat late. The forest learned it by accident and has been answering ever since. It is not a sad song. That is what makes it sad.',
  },
  mem_weavers: {
    id: 'mem_weavers', category: 'memories', title: 'The Nameless Weavers', unlockFlag: 'codex_mem_weavers',
    text: 'A loom with a half-finished bolt of silk. The pattern is a list of names. The weaver got as far as the letter K before the Hush arrived. The shuttle is still in the warp.',
  },
  mem_borrowed_face: {
    id: 'mem_borrowed_face', category: 'memories', title: 'A Borrowed Face', unlockFlag: 'codex_mem_borrowed_face',
    text: 'A mask room. Each mask is a year. The newest has no face at all; it is a smooth oval waiting. On the back, in fresh ink: "Next year I will need a better reason."',
  },
  mem_unnamed: {
    id: 'mem_unnamed', category: 'memories', title: 'The Unnamed', unlockFlag: 'codex_mem_unnamed',
    text: 'A grave with no inscription. The ground is warm. Under the grass, someone has carved a single word and then filled it in with lead. The lead is still soft.',
  },
  mem_bell_name: {
    id: 'mem_bell_name', category: 'memories', title: 'The Bell Without a Name', unlockFlag: 'codex_mem_bell_name',
    text: 'A bell cast with a name inside the bronze, then cast again without it. Strike it and there is no sound. Your teeth feel the name anyway. It is not yours.',
  },
  mem_ash_vent: {
    id: 'mem_ash_vent', category: 'memories', title: 'The Ash Vent', unlockFlag: 'codex_mem_ash_vent',
    text: 'The vent breathes in. Below the volcano, something is listening with great patience. It has been listening since the first word. It is waiting for the second.',
  },

  // ── Lore ─────────────────────────────────────────────────────────────────
  lore_first_silence: {
    id: 'lore_first_silence', category: 'memories', title: 'The First Silence', unlockFlag: 'codex_lore_first_silence',
    text: 'Before the world, there was a word. The word was lonely, so it spoke the world. The world was loud. The word has been trying to get a word in edgewise ever since.',
  },
  lore_bell: {
    id: 'lore_bell', category: 'memories', title: 'The Bell That Would Not Stop', unlockFlag: 'codex_lore_bell',
    text: 'The bell was cast from the crowns of nine kings. It rings in the key of a name being forgotten. The monks who hung it wrote a single instruction on the beam: "Do not apologize to it."',
  },
  lore_warm_hand: {
    id: 'lore_warm_hand', category: 'memories', title: 'The Warm Hand', unlockFlag: 'codex_lore_warm_hand',
    text: 'The monastery rule was simple: no fire after dark. The night the child arrived, Kaji broke the rule. The abbot wrote him a penance and then stood beside him in the cold until dawn. The penance was never completed. The fire never went out.',
  },
  lore_queen_bargain: {
    id: 'lore_queen_bargain', category: 'memories', title: 'The Queen\'s Bargain', unlockFlag: 'codex_lore_queen_bargain',
    text: 'A contract in the queen\'s own hand: "One rain, freely given, for the last green place. Payment on delivery." Below it, in a different hand: "Payment withheld. Deliver nothing." The queen has been collecting ever since.',
  },
  lore_requiem: {
    id: 'lore_requiem', category: 'memories', title: 'The Requiem Count', unlockFlag: 'codex_lore_requiem',
    text: 'A ledger of the Requiem: 1,822 names sung. 1,301 forgotten before the second verse. 44 sung twice because the singer could not believe they were gone. 1 name never sung at all, circled in red, still waiting.',
  },
  lore_first_name: {
    id: 'lore_first_name', category: 'memories', title: 'The First Name', unlockFlag: 'codex_lore_first_name',
    text: 'In the citadel\'s deepest room, a stone with a single syllable worn almost through. The Hush has been trying to erase it for a thousand years. It has not succeeded. It has not failed, either. The difference is what the game is about.',
  },
};

export const CODEX_CATEGORIES = ['world', 'characters', 'bestiary', 'blades', 'memories'] as const;

export const INITIAL_CODEX = [
  'the_hush', 'names', 'shrines', 'kuro', 'yomi', 'endings', 'blade_katana',
];
