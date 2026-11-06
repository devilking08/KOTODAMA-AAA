# Live QA run — computer-use + MCP

Two ways to observe the running game, both installed:

- **Godot MCP** (`D:\godot-mcp`): plugin copied into `addons/godot_mcp`,
  `.mcp.json` wired. Requires the **editor** open with the plugin enabled
  (Project → Project Settings → Plugins). Tools: scene tree inspection, live
  property edits, input simulation, editor/game screenshots, runtime errors.
- **cc-haha Computer Use** (`D:\cc-haha`): starts with `bun`; its computer-use
  bridge drives real windows (screenshot, keyboard/mouse). Needs Bun + the
  cc-haha runtime (`bun install` then `./bin/claude-haha` or the desktop app).

## Checklist (run on the Godot window)

1. Launch: `D:\tools\godot\Godot_v4.7.2-stable_win64.exe --path D:\kotodama_godot`
2. Game boot → terrain visible, player on shore, no Editor errors.
3. Input: WASD moves the player; mouse looks; Shift sprints.
4. Attack (J) connects when an enemy is inside the slash area.
5. Enemy telegraphs (flash) then lunges; taking damage lowers HUD health.
6. Esc pauses; HUD bars reflect state.
7. Capture a screenshot at each step → feed the vision reviewer (Nemotron VL)
   against the reference pool; commit findings to `docs/vision-reports/`.

## Windows notes

- The Swift `cu-helper` is macOS-only; on Windows use cc-haha's JS bridge
  (screenshot/keyboard/mouse) or Godot MCP's input simulation.
- MCP server: `node D:/godot-mcp/server/build/index.js` (built).
