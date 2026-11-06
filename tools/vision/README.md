# Vision review pipeline

This pipeline lets the build loop **see** the game screen instead of guessing:

```
Captured frame (Browser screenshot, JPEG/PNG)
   │
   ▼
Multimodal reviewer (Claude Opus 5 / GPT-5.6 Sol / Nemotron-3.5-VL)
   │  reads the actual pixels with a rubric
   ▼
Actionable report → code changes → recapture → verify
```

## Why

Mercury (the main coding model) is text-only. To do visual work —
readability, animation timing, telegraph clarity, HUD legibility, feedback
contrast, silhouette quality — we route frames through a vision-capable model
and feed its written critique back into the editor.

## How to run a review session

1. Start the game (`npm run dev` or `npm run preview`) and open it in the
   browser harness.
2. Drive the game to the moment you want reviewed (walk, fight, dialogue,
   boss bar, menu).
3. Capture: `browser.screenshot` → a JPEG/PNG file on disk.
4. Spawn a subagent with a vision model (e.g. `agentrouter/claude-opus-5`),
   passing the file path(s) plus `tools/vision/prompt.txt` as the task.
5. Apply the report; recapture; loop.

## Rubric (the reviewer is told to score these)

| Area | What we look for |
| --- | --- |
| Composition | Subject readable, camera framing, no clutter |
| HUD legibility | Bars/numbers readable at a glance, hierarchy correct |
| Animation readability | Windup→strike→recover readable, no muddled poses |
| Telegraph language | Red/gold rings visible, projectile paths clear |
| World silhouette | Player vs enemies vs NPCs distinct at distance |
| Controls | Prompt clarity, key labels, touch layout on mobile |
| Performance feel | Hitstop, shake, particles: present but not noisy |
| Accessibility | Contrast, colorblind pairings, reduced-motion safe |

## Reviewer output format

The subagent should return:

1. `SCORES` — 1–10 per rubric area.
2. `ISSUES` — numbered, each with: what you see, why it hurts the game,
   where in the code it likely lives (engine/UI/content), and a concrete fix.
3. `TOP 5 FIXES` — highest impact first, each small enough to land in one edit.
4. `VERIFY` — the exact in-game moment to recapture to confirm the fix.

## Model fallbacks

- Primary: `agentrouter/claude-opus-5`
- Fallback: `agentrouter/gpt-5.6-sol`
- Free/alt: `opencode/nemotron-3.5-super-vl-free`, `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`
