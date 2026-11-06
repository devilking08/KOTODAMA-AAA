# OpenCode environment setup (this machine)

How the agent harness is wired to the game-dev toolstack, so every session can
use the installed tools without re-discovery.

## 1. MCP servers (global `~/.config/opencode/opencode.json`)

| Server | Type | Command | Requires |
| --- | --- | --- | --- |
| `rea` | local (stdio) | `node …/rea-agents/scripts/rea.mjs mcp` | (pre-existing) |
| `godot-mcp` | local (stdio) | `node D:/godot-mcp/server/build/index.js`, env `GODOT_MCP_PORT=6505` | Godot **editor** open with the `addons/godot_mcp` plugin enabled (Project Settings → Plugins) |
| `graphify` | local (stdio) | `C:\Users\devra\.local\bin\graphify-mcp.exe` | a `graphify-out/` in the working project (graph queries) |
| `roblox` | local (stdio) | `cmd.exe /c %LOCALAPPDATA%\Roblox\mcp.bat` | Roblox Studio open with **Assistant → Manage MCP Servers → Enable Studio as MCP server** (official built-in server: `execute_luau`, `script_read/multi_edit`, `search_game_tree`, `get_studio_state`, `start_stop_play`, `screen_capture`, `user_keyboard_input`/`user_mouse_input`, `generate_procedural_model`, `subagent` explore/playtest) |

Validation: `(Get-Content …\opencode.json -Raw | ConvertFrom-Json).mcp.PSObject.Properties.Name`
→ `rea,godot-mcp,graphify,roblox`. The `godot-mcp` server registers 173 tools once
OpenCode picks the config up (new sessions; config changes need a restart).

## 2. Skills

Global skill dir: `C:\Users\devra\.config\opencode\skills\` (28 skills total).

- Pre-existing: `accessibility`, `graphify`, etc.
- Added (junctions into `D:\gamedev-skills\skills\`, prefix `gd-`):
  - `godot/` full set: 3d-essentials, animation, audio, gdscript,
    gdscript-headless-testing, nodes-scenes, physics, resources, shaders,
    signals-groups, ui-control, tilemap, export, csharp, multiplayer.
  - `genres/`: fps-shooter (shooting-and-feel), platformer (feel-tuning),
    rpg (stats-combat-quests).
  - `disciplines/`: camera-systems (follow-and-framing), game-ui-ux
    (layout-and-flow), level-design (pacing-and-flow).

Recreate: `New-Item -ItemType Junction -Path <skillsDir>/gd-<skill> -Target <path>`.

## 3. Plugins (pre-existing, left untouched)

- `auto-skill-downloader`
- `ponytail` (`D:\research_repos\ponytail2\…`; mode `lite`)
- `D:/opencode-ratelimit` (10 req/min)

## 4. Model

`nvidia/nvidia/nemotron-3-ultra-550b-a55b` (configured in opencode.json).

## 5. Notes

- `godot-mcp` talks to the running editor/game: for live scene tree, property
  edits, input simulation and screenshots, open the project in Studio first.
- `graphify-mcp` serves the committed knowledge graph in `graphify-out/`
  (graph.json + report + html) — query it instead of reading project files.
- Credentials stay env-only; `.env.example` declares every variable used by
  these integrations (GH_TOKEN, GODOT_MCP_PORT, VISION_API_KEY, ROBLOX_API_KEY…).
