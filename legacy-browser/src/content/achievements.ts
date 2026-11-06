import type { AchievementDef } from '../types';

/**
 * Achievements are evaluated from the save state, so they survive reloads and
 * never depend on a particular UI sequence. Conditions are intentionally
 * declarative; the AchievementSystem only needs a handful of comparators.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_light', name: 'First Light', description: 'Light the shrine lantern at the Nameless Village.', icon: 'lantern', condition: { type: 'flag', target: 'sq_lantern_done' } },
  { id: 'the_first_cut', name: 'The First Cut', description: 'Defeat Ushio, Warden of the Tide.', icon: 'wave', condition: { type: 'boss', target: 'ushio' } },
  { id: 'silence_the_bell', name: 'Silence the Bell', description: 'Defeat Kane, the Bellkeeper.', icon: 'bell', condition: { type: 'boss', target: 'kane' } },
  { id: 'something_borrowed', name: 'Something Borrowed, Something Blue', description: 'Defeat Yuki, the White Silence.', icon: 'snow', condition: { type: 'boss', target: 'yuki' } },
  { id: 'warm_hand', name: 'The Warm Hand', description: 'Defeat Kaji, the Ember Monk.', icon: 'flame', condition: { type: 'boss', target: 'kaji' } },
  { id: 'dry_debt', name: 'A Debt Paid in Sand', description: 'Defeat Sabaku, Queen of the Drowned Dunes.', icon: 'sand', condition: { type: 'boss', target: 'sabaku' } },
  { id: 'last_green', name: 'The Last Green Thing', description: 'Defeat Mori, the Last Gardener.', icon: 'leaf', condition: { type: 'boss', target: 'mori' } },
  { id: 'one_name', name: 'One Name Between Them', description: 'Defeat Futari, the Twin Blades.', icon: 'twin', condition: { type: 'boss', target: 'futari' } },
  { id: 'face_value', name: 'Face Value', description: 'Defeat Kage, the Masked Shogun.', icon: 'mask', condition: { type: 'boss', target: 'kage' } },
  { id: 'bride_of_ash', name: 'The Bride Wore Ash', description: 'Defeat Yū, Bride of Ash.', icon: 'bride', condition: { type: 'boss', target: 'yu' } },
  { id: 'hollow_no_more', name: 'Hollow No More', description: 'Defeat That Which Forgot Itself.', icon: 'crown', condition: { type: 'boss', target: 'crown' } },
  { id: 'the_long_road', name: 'The Long Road', description: 'Reach Act II.', icon: 'road', condition: { type: 'chapter', target: '4' } },
  { id: 'the_last_step', name: 'The Last Step', description: 'Reach the Hollow Crown.', icon: 'stairs', condition: { type: 'chapter', target: '10' } },
  { id: 'speaker', name: 'Speaker of the World', description: 'Choose to speak the world\'s name.', icon: 'speak', condition: { type: 'ending', target: 'speak' } },
  { id: 'quiet_end', name: 'The Quiet End', description: 'Choose the silence.', icon: 'silence', condition: { type: 'ending', target: 'silence' } },
  { id: 'keeper', name: 'Keeper of the Hollow', description: 'Take the crown for yourself.', icon: 'throne', condition: { type: 'ending', target: 'become' } },
  { id: 'true_name', name: 'My Name Is Kuro', description: 'Unlock and choose the true ending.', icon: 'fox', condition: { type: 'ending', target: 'remember' } },
  { id: 'rememberer', name: 'Rememberer', description: 'Recover 20 memories and codex entries.', icon: 'memory', condition: { type: 'collect', target: 'codex', count: 20 } },
  { id: 'archivist', name: 'Archivist of the Hush', description: 'Complete the Codex.', icon: 'book', condition: { type: 'collect', target: 'codex', count: 45 } },
  { id: 'blade_collector', name: 'Five Ways to Cut', description: 'Unlock every weapon.', icon: 'blade', condition: { type: 'flag', target: 'weapon_greatsword' } },
  { id: 'unbowed', name: 'Unbowed', description: 'Defeat Juzo at the ronin camp.', icon: 'fist', condition: { type: 'boss', target: 'juzo' } },
  { id: 'bell_warden', name: 'The Bell Beneath', description: 'Defeat the Bell Warden.', icon: 'bell', condition: { type: 'boss', target: 'bell_warden' } },
  { id: 'ape_slayer', name: 'Ape Slayer', description: 'Defeat the Frost Ape.', icon: 'claw', condition: { type: 'boss', target: 'frost_ape' } },
  { id: 'wyrm', name: 'Sand Swimmer', description: 'Defeat the Dune Wyrm.', icon: 'wyrm', condition: { type: 'boss', target: 'dune_wyrm' } },
  { id: 'widow', name: 'The Widow\'s Web', description: 'Defeat the Bamboo Widow.', icon: 'spider', condition: { type: 'boss', target: 'bamboo_widow' } },
  { id: 'ash_captain', name: 'Ash to Ash', description: 'Defeat the Ash Knight Captain.', icon: 'ash', condition: { type: 'boss', target: 'ash_knight_captain' } },
  { id: 'side_quests', name: 'Small Kindnesses', description: 'Complete eight side quests.', icon: 'knot', condition: { type: 'quest', target: 'side', count: 8 } },
  { id: 'all_main', name: 'The Sentence Ends', description: 'Complete every main quest.', icon: 'scroll', condition: { type: 'quest', target: 'main', count: 11 } },
  { id: 'parry_master', name: 'Thirteen Deflections', description: 'Land 100 perfect parries.', icon: 'parry', condition: { type: 'parry', target: 'parries', count: 100 } },
  { id: 'death_is_a_teacher', name: 'Death Is a Teacher', description: 'Die twenty-five times. Keep going.', icon: 'skull', condition: { type: 'deaths', target: 'deaths', count: 25 } },
  { id: 'nameless_run', name: 'Nameless Run', description: 'Complete the game on Nameless difficulty.', icon: 'oni', condition: { type: 'flag', target: 'nameless_clear' } },
  { id: 'new_cycle', name: 'A Second Sentence', description: 'Begin New Game Plus.', icon: 'cycle', condition: { type: 'flag', target: 'ng_plus_started' } },
  { id: 'shrine_master', name: 'Every Road Home', description: 'Discover every shrine.', icon: 'torii', condition: { type: 'collect', target: 'shrines', count: 15 } },
  { id: 'secret_keeper', name: 'What the Tide Left', description: 'Find ten secrets.', icon: 'key', condition: { type: 'collect', target: 'secrets', count: 10 } },
  { id: 'gourmand', name: 'A Taste for Trouble', description: 'Use 30 healing gourds.', icon: 'gourd', condition: { type: 'flag', target: 'gourds_30' } },
  { id: 'flow', name: 'In the Flow', description: 'Reach maximum Flow and land a weapon art.', icon: 'wave', condition: { type: 'flag', target: 'flow_art' } },
];
