# KOTODAMA — Code map (graph backbone)

Machine-checkable inventory of every script, scene, test, and gate in the
repository. Node names below map 1:1 to graph nodes.

## Godot scripts (`godot/scripts/`)

| Node | File | Extends | class_name | Role |
| --- | --- | --- | --- | --- |
| GameSystem | Game.gd | Node | — | orchestrator: wiring, pause, interact, save/respawn, boss-death flow |
| PlayerController | Player.gd | CharacterBody3D | KotodamaPlayer | move/sprint/dodge(i-frames)/parry(perfect window)/posture/attack(hitstop) |
| EnemyGrunt | Enemy.gd | CharacterBody3D | — | detect → chase → telegraph flash → lunge; take_damage |
| BossGeneral | Boss.gd | CharacterBody3D | KotodamaBoss | 2 phases, gold/red telegraphs, posture pacing, died signal |
| HUDSystem | HUD.gd | CanvasLayer | — | vitality/posture bars+labels, objective label |
| DialogueSystem | DialogueUI.gd | CanvasLayer | KotodamaDialogueUI | speaker+text cinematic box |
| SaveSystem | SaveGame.gd | Object | KotodamaSave | JSON save/load (user://save.json) |
| WorldDressing | WorldDressing.gd | Node | — | torii, lanterns (emissive), water plane |
| TerrainSystem | Terrain.gd | Node | — | height-sampled ground |

**Wiring (real):**
- `Player` nodes: SlashArea (Area3D, radius 1.35) → `take_damage` on `enemy` group.
- Groups: `player` (Player), `enemy` (Enemy0/1, Boss). Verified by smoke v2: players=1, enemies=3.
- Signals: `health_changed`/`posture_changed` → HUD; `dodged`/`parried` (Player);
  `died` (Boss) → GameSystem → dialogue + flag + save.
- GameSystem reads Player/Boss/HUD/DialogueUI by node name; flags persist via SaveSystem.

## Scene

- `scenes/build_main.gd` → generates `scenes/main.tscn` (Main root: Game, Terrain,
  WorldEnvironment, Sun, Fill, Player, Enemy0/1, HUD, Boss, WorldDressing, DialogueUI).

## Tests / gates (`godot/test/`, `godot/run-gates.ps1`)

| Node | File | What it proves |
| --- | --- | --- |
| ScriptLoadGate | check_scripts.gd | every scripts/*.gd loads (compiles) |
| SceneBuildGate | build_main.gd | scene regenerates, node count matches |
| SceneIntegrityGate | verify_scene.gd | every authored node has its expected script |
| SmokeV2 | smoke_scene.gd | groups, dodge absorption, parry absorption, boss phase/death, save round-trip |
| CaptureTool | capture_screenshot.gd | windowed render → screenshots/kotodama_firstlight.png |

## Legacy browser (`legacy-browser/src/`)

- Engine modules: renderer (rule-of-thirds camera/hero fill-rim lights), combat
  (melee/posture/parry), world (open-zone layout, fog, grade), UI/HUD, save/quest
  flags, cinematic layering. Full inventory in `legacy-browser/docs/ARCHITECTURE.md`.

## Docs ↔ code links

- `docs/ARCHITECTURE.md` ↔ every script node above.
- `assets/prompts/asset-briefs.md` ↔ WorldDressing props (torii/lantern/water).
- `docs/godot/QA_RUN.md` ↔ CaptureTool + MCP plugin (`addons/godot_mcp`).
