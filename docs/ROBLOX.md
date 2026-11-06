# KOTODAMA — Roblox Studio track

The same game, rebuilt for **Roblox Studio** (built with **Rojo 7.7.1** from
plain Luau source — no editor-side hand edits required; the `.rbxlx` is a
generated artifact).

## What is here

```
roblox/
├── default.project.json        # Rojo project definition (source of truth)
├── Kototama.rbxlx              # GENERATED place — open this in Studio
└── src/
    ├── ReplicatedStorage/Kotodama/
    │   ├── CombatConfig.luau   # all tuned values (data-driven)
    │   └── Events.luau         # single RemoteEvent registry
    ├── ServerScriptService/
    │   ├── Bootstrap.luau      # entry point
    │   ├── WorldBuilder.luau   # procedural shore (ground/water/foam/torii/lanterns)
    │   ├── EnemyChar.luau      # cheap part-based enemy factory
    │   ├── EnemyDirector.luau  # grunt + Drowned General AI (2 phases)
    │   └── CombatServer.luau   # melee resolution, i-frames, parry, posture
    ├── StarterPlayerScripts/
    │   └── PlayerController.luau  # orbit camera, WASD, dodge, parry, combos
    └── StarterGui/KotodamaHUD/
        └── HUDClient.luau      # health/posture/boss bars, objectives, callouts
```

## Open it

1. Start **Roblox Studio** (installed at
   `…\Roblox\Versions\version-67c8b1dedbb74fed\RobloxStudioBeta.exe`).
2. **File → Open from File…** → open `roblox/Kotodama.rbxlx`.
3. Press **Play**. The world, grunts, boss, HUD and controller all spawn from
   code — there is nothing else to configure.

> To iterate: `rojo build default.project.json -o Kotodama.rbxlx` after edits,
> or `rojo serve` and sync live from Studio with the Rojo plugin.

## Controls

| Input | Action |
| --- | --- |
| WASD | Move (camera-relative) |
| Mouse | Orbit camera |
| Left Shift | Sprint |
| Space | Dodge (i-frames) |
| Q (press) | Parry stance — first 0.18 s is a perfect parry |
| LMB | Attack — 3-hit combo with buffering |

## Combat parity with the Godot port

| System | Godot port | Roblox track |
| --- | --- | --- |
| Combo chain (26/30/42) | ✅ | ✅ (CombatConfig + buffer) |
| Dodge i-frames | ✅ | ✅ (DodgingUntil attribute) |
| Perfect parry → riposte | ✅ | ✅ (ParryStarted/Until + RiposteReady) |
| Posture break → stagger | ✅ | ✅ (stagger state + timer) |
| Boss 2 phases (gold/red telegraphs) | ✅ | ✅ (Phase value + head neon color) |
| Save/checkpoint | JSON save | Session respawn (DataStore = credential-gated) |
| No-GPU friendly | ✅ (GL Compatibility, 960×540) | Roblox cloud renders; budget still low |

## Honest status

- **Built and syntax-verified** (Luau parser clean on every file; Rojo build
  succeeds). **Not yet play-tested** in this environment — Roblox runtime
  playtesting requires Studio playback (or a published place with credentials).
- DataStore persistence is intentionally **not** wired: it needs a live Roblox
  place + API credentials. Add them via `DataStoreService` in `CombatServer` /
  `Bootstrap` when publishing (see `.env.example` → `ROBLOX_API_KEY`).
- Single-player vertical slice mirrors the Godot port's mechanics; the
  chapter/story roadmap is shared (docs/GAME_DESIGN.md).

## Rebuild

```powershell
D:\tools\rojo\rojo.exe build D:\KOTODAMA-AAA\roblox\default.project.json -o D:\KOTODAMA-AAA\roblox\Kotodama.rbxlx
```
