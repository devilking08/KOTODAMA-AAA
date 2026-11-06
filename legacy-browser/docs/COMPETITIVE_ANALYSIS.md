# Competitive Analysis — KOTODAMA vs the leaders

This is the decision-grade comparison behind `RESEARCH.md`. Scores are
1–10, evidence-anchored to the reference set. KOTODAMA is a browser game and
does not compete with AAA production budgets — the comparison is about
**design intent**, not polish parity.

## Weighting

| Dimension | Weight | Why |
| --- | --- | --- |
| Melee readability | 25% | Posture/parry clarity is our core promise |
| Encounter design | 20% | Boss phases, telegraphs, fairness |
| Exploration payoff | 15% | The world is the reward |
| Narrative integration | 15% | Story as system, not cutscene |
| Accessibility & options | 10% | Browser audience breadth |
| Technical craft | 10% | We judge within browser constraints |
| Replayability | 5% | NG+, endings, mastery |

## Scores

| Game | Readability | Encounters | Exploration | Narrative | Access | Tech | Replay | Weighted |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sekiro | 10 | 10 | 6 | 8 | 4 | 9 | 7 | **8.3** |
| Ghost of Tsushima | 8 | 8 | 9 | 9 | 7 | 9 | 7 | **8.2** |
| Nioh 2 | 8 | 9 | 7 | 6 | 5 | 9 | 9 | **7.7** |
| Elden Ring | 8 | 10 | 10 | 8 | 6 | 10 | 9 | **8.7** |
| Wo Long | 8 | 8 | 6 | 6 | 5 | 8 | 7 | **7.0** |
| DMC5 | 9 | 8 | 4 | 5 | 6 | 9 | 9 | **7.2** |
| Nier Automata | 7 | 7 | 7 | 10 | 6 | 8 | 8 | **7.5** |
| Stellar Blade | 9 | 8 | 6 | 7 | 6 | 9 | 7 | **7.6** |
| **KOTODAMA (self)** | 8 | 7 | 8 | 9 | 9 | 7 | 8 | **8.0** |

> Self-scores are designer intent, not marketing: KOTODAMA aims to be the
> most *readable and accessible* of the group, and clearly trails the AAA
> titles on encounter depth and technical craft.

## Position map

```
        Accessible
           │
           │  KOTODAMA · Ghost of Tsushima
           │
   Systemic │───────────●─────────────────────────────●─────── Cinematic
   (posture│  Wo Long · Nioh 2 · Sekiro · Stellar Blade
    /stat) │                  ●   ●        ●
           │           Elden Ring
           │
        Hardcore (Sekiro/Elden) ── wider audience
```

- **Sekiro/Elden Ring occupy the hardcore-cinematic corner.** We cannot
  out-craft them; we do not try.
- **Ghost of Tsushima occupies accessible-cinematic.** We borrow its region
  coherence and stance philosophy in spirit.
- **KOTODAMA targets accessible-systemic**: Sekiro's grammar, Tsushima's
  atmosphere, Nier's endings, with an accessibility floor no console AAA can
  match (pure HTML UI, colorblind modes, reduced motion, quality tiers,
  touch).

## White space we claim

1. **"Sekiro grammar, browser delivery."** Nobody has shipped posture/parry
   melee combat to a URL with zero install. That is our category.
2. **Endings as attention, not difficulty.** A true ending gated by
   *paying attention* (side quests + a name) rather than by skill level.
3. **Fully synthesised generative score.** No streaming, no assets — an
   ambient score that mixes in live.
4. **A complete single-authored story.** The fiction is fixed and coherent,
   not generated on the fly.

## What we will not claim

- Parity with AAA combat depth, animation fidelity, or world size.
- A 70-hour campaign (see `RESEARCH.md §4`).
- Innovation in rendering; we deliberately use proven techniques
  (toon shading, bloom, instancing, deterministic terrain).
