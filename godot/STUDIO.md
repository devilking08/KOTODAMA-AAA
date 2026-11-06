# Installed game-dev reference stack

Working references cloned locally for the KOTODAMA Godot port:

| Path | What it is | Used for |
| --- | --- | --- |
| `D:\godogen` | AI game-dev pipeline (engine guides, capture methodology, builder patterns) | Methodology: builder-generated scenes, headless gates, movie-writer capture |
| `D:\gamedev-skills` | awesome-gamedev-agent-skills (~6.7k★): 77 SKILL.md skills incl. Godot 4.7 patterns | `godot-gdscript`, `godot-physics`, `game-feel`, `performance-optimization`, `input-systems` |
| `D:\claude-code-game-studios` | Claude Code Game Studios: 48 studio agents (qa-tester, qa-lead, gameplay-programmer, performance-analyst, godot-gdscript-specialist, art-director, …) | Role-based task prompts for the dev loop (QA pass, polish pass, perf pass) |
| `D:\cc-haha` | Local-first Claude Code desktop workbench incl. Computer Use + computer-use-mcp | Computer-use QA of the running game window (screen, input, checks) |
| `D:\godot-mcp` | mkdevkit/godot-mcp: 173 tools (scene tree, live edits, input simulation, editor/game screenshots, runtime feedback) | Editor + runtime QA loop for the Godot port (plugin copied into `addons/godot_mcp`, `.mcp.json` wired) |
| `D:\awesome-3d-prompts` | TripoGrowthLab awesome-3d-prompts: 496 3D prompt examples (games, scenes, assets) | Asset/scene generation prompts for the art pass |
| `D:\chatterbox` | Resemble AI Chatterbox: open-source on-device voice model (TTS + STT for agents, Apache-2.0) | Local voice for NPC dialogue / game voice assistant |
| `D:\ChatTTS` | 2noise/ChatTTS: conversational TTS (EN/ZH), control tokens (laugh/pause), AGPL-3.0 code, CC-BY-NC weights | Expressive dialogue voice synthesis (academic use) |
| `D:\ACE-Step` | ace-step/ACE-Step 1.5: music/speech foundation model (voice cloning, lyric2vocal, remix), Apache-2.0 | Procedural score/ambience and sung-vocal generation |
| `D:\Audio2Face-3D` | NVIDIA Audio2Face-3D-Samples: audio → ARKit blendshapes (lip-sync + emotion) microservice | Character lip-sync pipeline (weights via NVIDIA/ONNX, GPU or cloud) |

## Suggested studio loop for the port

1. `qa-tester` — run gates, smoke scene, report the first visible issues.
2. `gameplay-programmer` / `godot-gdscript-specialist` — fix mechanics, typing, feel.
3. `performance-analyst` — profile on the no-GPU machine; keep 60 FPS budget.
4. `art-director` / `qa-lead` — frame-by-frame visual review vs the reference pool (Sekiro / Ghost of Tsushima / Nioh 2 in `D:\kotodama\tools\reference\`).
5. `release-manager` — keep `run-gates.ps1` green and the repo shippable.
