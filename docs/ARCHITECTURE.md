# KOTODAMA — Architecture (system map)

This document is the canonical architecture for the monorepo. It is the primary
semantic source for the queryable knowledge graph (`graphify-out/graph.json`).
Every subsystem, connection, and quality gate below is real and verified —
nothing here is aspirational.

---

## 1. Goal and constraints

- **Brief:** AAA-calibre third-person melee action (Sekiro / Onimusha / GoT /
  Black Myth Wukong lineage) with story, bosses, environments, side content,
  multiple endings, and production documentation.
- **Hard constraint:** the target machine has **no discrete GPU**. Engine choice
  settled on **Godot 4.7.2** with **GL Compatibility** renderer, 960×540,
  0.75 resolution scale, shadows off.
- **Honesty:** documented scope is ~8–14 h first playthrough + NG+; the 70+ h /
  10+ chapter target is an explicit, tracked aspiration (docs/GAME_DESIGN.md).

## 2. Two deliverable halves

### 2a. `godot/` — the primary game (Godot 4.7)

- **Scene builder pattern (godogen style).** `scenes/build_main.gd` constructs the
  entire `main.tscn` deterministically from code (nodes + scripts + owners) and is
  re-run by the gates after every script change. The scene is *generated*, never
  hand-edited — this is what made the gates able to verify it.
- **Runtime scripts** (`scripts/`):
  - `Game.gd` — root orchestrator: wires Player/Boss/HUD/DialogueUI, pause,
    interact, save/restore, boss-death + respawn flow.
  - `Player.gd` — third-person melee controller: WASD + camera-relative move,
    sprint, **dodge with i-frames** (triggered state + invuln window), **parry
    stance with perfect-parry window**, posture system, slash Area3D hitbox,
    hitstop on heavy hits, `class_name KotodamaPlayer`.
  - `Enemy.gd` — grunt: detect/chase/melee, telegraph flash before lunge,
    `take_damage`, death cleanup. Duplicated into Enemy0/Enemy1.
  - `Boss.gd` — **The Drowned General**: 2 phases (<50% HP), colored telegraphs
    (gold sweep = parryable, red thrust = unblockable), posture-aware pacing,
    `died` signal.
  - `HUD.gd` — vitality/posture bars + labels + objective label.
  - `DialogueUI.gd` — cinematic bottom dialogue box (speaker + text, auto-hide).
  - `SaveGame.gd` — JSON save (position, health, flags) in `user://save.json`.
  - `WorldDressing.gd` — procedural props: torii, stone lanterns (emissive glow),
    transparent water plane near spawn.
  - `Terrain.gd` — height-sampled ground (nodes snap to it).
- **Input map** (`project.godot`): move_forward/back/left/right, sprint, dodge
  (Space), parry (Q), attack (J/LMB), interact (E), pause (Esc).
- **Combat math:** attack 26 dmg; dodge i-frames; perfect parry negates + builds
  posture; posture break → stagger; boss phase 2 speed-up.

### 2b. `legacy-browser/` — HTML5/TS prototype (reference + design artifact)

- Vite + TypeScript build; 12 commits of AAA polish passes (touch-safe desktop,
  rule-of-thirds framing, fill/rim hero lights, fog, grade, leaner HUD).
- Ships the full story/design/research/competitive docs and the interactive
  system diagram.

## 3. Docs (unified `docs/`)

| Document | Audience | Contents |
| --- | --- | --- |
| `STORY.md` | everyone | world bible, 10+ chapters, NPCs, 3 endings |
| `GAME_DESIGN.md` | designers | combat language, progression, side quests, roadmap |
| `RESEARCH.md` | everyone | how AAA games are built (community findings) |
| `COMPETITIVE_ANALYSIS.md` | leadership | vs Sekiro/GoT/Nioh2/Onimusha/Black Myth |
| `OPERATIONS.md` | maintainers | runbook, env, credential conventions |
| `ARCHITECTURE.md` | both | this file |
| `system-diagram.html` + `assets/architecture.svg` | both | interactive/static diagrams |
| `godot/QA_RUN.md` | QA | MCP + computer-use live QA checklist |
| `godot/studio-agents.md` | studio | role prompts (Claude Code Game Studios) |

## 4. Tools & automation (`tools/`)

- `reference/` — Sekiro ×3, GoT ×3, Nioh2 ×2 reference frames for vision loops.
- `vision/prompt.txt` + `vision/README.md` — Nemotron-VL review protocol.
- `research/collect.mjs` — competitive research collector.
- `screenshots.mjs` — screenshot pipeline.

## 5. Quality gates (`godot/run-gates.ps1`)

1. `--import` — asset import.
2. `test/check_scripts.gd` — every `scripts/*.gd` must load (compile) cleanly.
3. `scenes/build_main.gd` — regenerate `main.tscn`.
4. `--check-only` on Terrain/Player/Enemy/Game/HUD.
5. `--quit-after 30` headless boot smoke.
6. `test/verify_scene.gd` — instantiate `main.tscn` and assert every authored node
   has exactly its expected script attached.
Plus `test/smoke_scene.gd` (runtime combat/boss/save assertions) and
`test/capture_screenshot.gd` (windowed render capture).

**Gate lesson (fixed in history):** a parse error in one script silently
propagates — `load()` returns null, `set_script(null)` drops the node's script,
and `pack()` serializes nothing. The `verify_scene.gd` gate exists precisely to
catch that class; the error regex is case-insensitive for the same reason.

## 6. Development loop (methodology)

Brief → competitive research → design docs → prototype (browser) → Godot port →
gates + smoke → vision review vs reference pool → fix loop → commit. Role prompts
from Claude Code Game Studios are applied per iteration (`docs/godot/studio-agents.md`).

## 7. Credentials

`.env.example` declares every variable (GH_TOKEN, GODOT_MCP_PORT, VISION_API_KEY,
CHATTTS_CACHE_DIR, ACE_STEP_CACHE_DIR, A2F_ROOT, …). Real values never leave the
environment; `.env` is git-ignored.

---

*Graph-facts: every node name in the graph maps to a real file or system above;
edges map to real wiring (signals, groups, script loads, gate deps).*
