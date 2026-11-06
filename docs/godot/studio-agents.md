# Studio agents (Claude Code Game Studios) — selected for KOTODAMA Godot

Sourced from `D:\claude-code-game-studios\.claude\agents\` (MIT). Each will be
used as a role prompt for the next iteration. Full sets live upstream; these
are the ones in active rotation for the port.

## qa-tester
Objective: run the gates, play the built scene, and report the first visible
issues in priority order. Evidence required per issue: reproduction steps,
expected vs actual, screenshot/frame if possible.

## qa-lead
Objective: triage the QA backlog, gate the release on the top-blockers, and
keep a regression checklist (movement, attack, enemy behavior, HUD, pause).

## gameplay-programmer
Objective: improve feel — input buffering, hitstop, telegraph clarity, camera
framing — without breaking the typed-script build gates.

## godot-gdscript-specialist
Objective: enforce GDScript 4.7 type/lifecycle discipline, fix any
`SCRIPT ERROR` from the gates, keep `@export`/`@onready` clean.

## performance-analyst
Objective: 60 FPS budget on the no-GPU machine (GL Compatibility, 0.75 scale,
shadows off). Profile `_physics_process` cost, mesh/tri count, allocation
spikes. Do not add GPU-bound work.

## art-director
Objective: frame-by-frame visual review vs the reference pool
(`D:\kotodama\tools\reference\`) and the 3D prompt catalog
(`D:\awesome-3d-prompts`); define per-scene asset briefs.

## producer
Objective: own the plan triage (original brief vs honest scope), keep the
README/STUDIO tables truthful, and make sure each loop ends with a committed,
gate-green state.
