# KOTODAMA — Godot 4 port

Godogen runtime (engine: Godot 4 GDScript, godot-gdscript + godot-physics
skills from awesome-gamedev-agent-skills). Low-spec profile: GL Compatibility
renderer, no shadows, 0.75 render scale, 960×540 window — designed to run
without a discrete GPU.

## Requirements

- Godot 4.7+ (standard build, no .NET needed). Portable install recommended:
  `D:\tools\godot\Godot_v4.7.2-stable_win64.exe`

## Run

```powershell
D:\tools\godot\Godot_v4.7.2-stable_win64.exe --path D:\kotodama_godot
```

Or open the folder in the Godot editor (project.godot is at the root).

## Build gates (run after any script/scene change)

```powershell
$g = "D:\tools\godot\Godot_v4.7.2-stable_win64.exe"
# 1) import assets + register class_name scripts
& $g --headless --path D:\kotodama_godot --import
# 2) generate scenes (builder emits .tscn)
& $g --headless --path D:\kotodama_godot --script res://scenes/build_main.gd
# 3) parse-check each changed script (exit 1 on errors)
& $g --headless --path D:\kotodama_godot --check-only --script res://scripts/Player.gd
& $g --headless --path D:\kotodama_godot --check-only --script res://scripts/Enemy.gd
& $g --headless --path D:\kotodama_godot --check-only --script res://scripts/Terrain.gd
& $g --headless --path D:\kotodama_godot --check-only --script res://scripts/Game.gd
& $g --headless --path D:\kotodama_godot --check-only --script res://scripts/HUD.gd
# 4) smoke-run headless for a few frames, grep for SCRIPT ERROR
& $g --headless --path D:\kotodama_godot --quit-after 30
```

## Controls

- WASD move · mouse look · Shift sprint
- J attack (Area3D hitbox in front) · Q parry (later)
- Esc pause

## Source layout

```
project.godot      low-spec config + input actions
icon.svg
scripts/
  Terrain.gd       deterministic procedural terrain (analytic height sampling)
  Player.gd        CharacterBody3D + camera pivot + slash Area3D
  Enemy.gd         chase/telegraph/lunge AI, flash feedback
  Game.gd          root: wires player/HUD/enemies, pause
  HUD.gd           health/posture bars fed by signals
scenes/
  build_main.gd    generates main.tscn (godogen builder pattern)
```

## Provenance

The godogen workflow (https://github.com/htdt/godogen) and the gamedev
skills (https://github.com/gamedev-skills/awesome-gamedev-agent-skills) are
installed at `D:\godogen` and `D:\gamedev-skills` respectively and used as
the development methodology for this port.
