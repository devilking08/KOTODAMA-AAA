# Research — how the leaders fight, and what we borrowed

KOTODAMA was built after studying the melee-action genre's leaders. This
document records what was studied, what we took, and where we deliberately
deviated — so the design decisions have receipts, not vibes.

> Method: observation of actual play (Sekiro, Ghost of Tsushima, Nioh 2,
> Wo Long, Elden Ring, Devil May Cry 5, Nier Automata, Stellar Blade) +
> design documentation where available + community technical analysis. No
> copyrighted assets or code were used; the game is 100% original.

---

## 1. The reference set

| Title | Why it matters | What we studied |
| --- | --- | --- |
| **Sekiro: Shadows Die Twice** | The posture/parry/deathblow grammar | Posture vs HP, perilous attacks, mikiri-style counters, boss phases, "hesitation is defeat" |
| **Ghost of Tsushima** | Open-zone atmosphere, stances, standoffs | Region identity, weather, sword stance switching, cinematic framing |
| **Nioh 2** | Ki/pulse resource rhythm, stance depth | Stamina-as-decision (we use Flow/Resolve), weapon stances |
| **Wo Long: Fallen Dynasty** | Spirit gauge, deflects, morale | Deflect-heavy combat, "morale" as exploration reward |
| **Elden Ring** | Open-world boss pacing, checkpoints, stakes | Shrine/bonfire equivalent, exploration payoff cadence |
| **Devil May Cry 5** | Juice, hitstop, camera | Hitstop timing, slow-mo kills, style feedback |
| **Nier: Automata** | Tone, multiple endings, camera tricks | Endings as thematic statements; 2D/3D camera changes |
| **Stellar Blade** | Action feel, parry feedback, boss barks | Parry flash, boss intro/outro staging |

---

## 2. What we adopted (with reasons)

1. **Posture as the primary combat bar (Sekiro).** It creates a *spine*:
   aggression is always rewarded, turtling is never optimal, and fights have
   a natural conclusion (deathblow) that doesn't require HP attrition.
   - *Our twist:* posture is partly *player* resource too. Over-committing
     to attack chips your own posture, so the rhythm is a real exchange.
2. **Perilous / sweep telegraph language (Sekiro).** Red = cannot block,
   must dodge; gold = sweep (can parry or dodge). We keep a third tier:
   normal attacks are blockable with chip damage.
3. **Boss phases that remix, not just bloat (Sekiro).** Each phase changes
   move availability, speed, and adds an aura hazard. The *color language*
   of the aura matches the damage type (fire red, frost blue, poison green).
4. **Checkpoint shrines with fast travel (Elden Ring/Sekiro).** Rest
   refills resources, sets spawn, saves. We add a **travel menu that only
   lists discovered shrines** — the world rewards exploration with
   convenience, not the reverse.
5. **Hitstop and camera shake for impact (DMC5, Stellar Blade).** Every
   connected hit gets a short hitstop; perfect parries feel like slamming a
   door. We tune per-attack (weapon weight → hitstop length).
6. **Multi-ending story (Nier).** Endings are choices with consequences
   that the save *remembers*. The true ending requires attention, not
   difficulty — a deliberate inversion of "true ending = hardest difficulty".
7. **Synthesised audio (all of the above, constrained).** No samples: the
   entire score is generative pentatonic + shaped noise. This keeps the game
   tiny and legal to redistribute.
8. **Deterministic procedural world.** This is the point where we depart
   from all the leaders: none of them hand-author every blade of grass. We
   hand-author *landmarks and narrative* on procedural terrain, which is how
   a single-authored browser game can feel curated.

---

## 3. Where we deliberately differ

| Leader behavior | Our choice | Why |
| --- | --- | --- |
| Stamina bars (Sekiro removed them; Nioh has Ki) | No stamina. Posture plays the role. | Browser pick-up-and-play; one resource system, heavily readable |
| Souls-like death penalty (lose XP) | Lose 12% of current Essence on death | Stakes without a corpse-run; respects short sessions |
| Difficulty as "the game" (Sekiro has none) | Three difficulty modes, plus accessibility suite | The game is for a broad browser audience |
| Lock-on emphasizing aggression (Sekiro) | Lock-on exists, but movement is camera-relative | Feels better with mouse+keyboard, and on touch |
| Long-form open worlds (Elden Ring) | 6 curated regions, dense, on rails-with-branching | A single-authored browser game that is *finished* |
| Hitboxes as hard truth (all) | Generous forgiving hit windows (arc-based) | Browser input latency allowance; still learnable |
| Vendors/economy (Souls) | No currency vendor; items found + quest rewards | Narrative cohesion; no grinding |

---

## 4. The "70 hours" question

Early versions of this brief asked for 70+ hours. That is **not honestly
achievable** in a single-authored browser game without filler. We chose to
ship a *complete, tight, replayable* game (see scope table in
`GAME_DESIGN.md`) and document the honest estimate (~8–14 h first playthrough;
NG+ adds a meaningful second cycle; mastery runs extend it). Fabricating a
70-hour promise would be the one thing the design could not be: honest.

---

## 5. Sources & further reading

- Sekiro posture/parry analysis — community teardowns of the posture system
  and "hesitation is defeat" encounter design.
- FromSoftware checkpoint economics (bonfires) — widely documented.
- Ghost of Tsushima stance system interviews (Sucker Punch).
- Nier: Automata multiple-ending thesis — discussion of thematic endings.
- DMC5 hitstop/camera juice — Capcom dev commentary.
- Stellar Blade parry/boss staging — Shift Up interviews/preview coverage.

All comparisons are design-level observations of public material; nothing in
this repository reproduces assets, code, or text from any title above.
