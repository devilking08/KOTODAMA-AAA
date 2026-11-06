# KOTODAMA — The Shore of Broken Words

> A AAA-style 3D action-adventure. **Godot 4.7** (primary, no-GPU target) plus a
> legacy browser prototype for reference and comparison.

```
  ██╗  ██╗ ██████╗ ████████╗ ██████╗ ██████╗  █████╗ ███╗   ███╗ █████╗
  ██║ ██╔╝██╔═══██╗╚══██╔══╝██╔═══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗
  █████╔╝ ██║   ██║   ██║   ██║   ██║██║  ██║███████║██╔████╔██║███████║
  ██╔═██╗ ██║   ██║   ██║   ██║   ██║██║  ██║██╔══██║██║╚██╔╝██║██╔══██║
  ██║  ██╗╚██████╔╝   ██║   ╚██████╔╝██████╔╝██║  ██║██║ ╚═╝ ██║██║  ██║
  ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝
```

**Genre.** Third-person melee action (Sekiro / Onimusha / Ghost of Tsushima lineage).
**Engine.** Godot 4.7.2, GL Compatibility renderer — **runs on a machine with no GPU**
(960×540, 0.75 scale, shadows off, ~60 FPS budget).
**Setting.** A drowned shrine-city on the Shore of Broken Words where every blade,
lantern, and tide carries a memory.

---

## Honest scope (read this first)

This repository is a **production-grade vertical slice and development foundation** —
not a false claim of 70 hours of content. What is true:

| Claim | Reality |
| --- | --- |
| Playtime | **~8–14 h** first playthrough (documented), + New Game+ and posture-mastery runs |
| Chapters | 10+ chapters **outlined** (STORY.md), 1 fully playable chapter in the Godot port |
| Bosses | Boss framework + **The Drowned General** (2-phase mini-boss) implemented; 9 more boss designs in docs |
| Weapons | Katana (full melee loop: attack/dodge/parry/posture) + weapon-per-chapter roadmap |
| Side quests / NPCs | Framing systems (dialogue, save flags, objectives) + Ame NPC; quest log roadmap |
| Endings | Multi-ending flag architecture (save-backed) + 3 ending designs |
| Cinematics | Cinematic camera/dialogue pipeline + story bible; full cutscene pre-production |

The stated target of the brief (70+ hours, 10+ chapters) is **honestly documented as
aspiration**, with the exact gap and roadmap in `docs/ROADMAP.md`-style sections of
`docs/GAME_DESIGN.md`.

## Run it

```powershell
# Godot 4.7.2 portable (already installed in the dev environment):
D:\tools\godot\Godot_v4.7.2-stable_win64.exe --path godot

# Quality gates (import → script load → scene build → smoke → scene integrity):
powershell -ExecutionPolicy Bypass -File godot\run-gates.ps1

# Runtime smoke (helpless, asserts combat/defense/boss/save):
& "D:\tools\godot\Godot_v4.7.2-stable_win64.exe" --headless --path godot --script res://test/smoke_scene.gd
```

Legacy browser prototype (reference/design artifact):

```powershell
cd legacy-browser
npm install
npm run dev    # https://localhost:5173
```

## Controls (Godot port)

| Input | Action |
| --- | --- |
| WASD | Move (camera-relative) |
| Mouse | Look |
| Shift | Sprint |
| J / LMB | Attack (slash area) |
| Space / Shift+Space | Dodge (i-frames) |
| Q | Parry stance (perfect-parry window at press) |
| E | Interact (dialogue / rest) |
| Esc | Pause |

Combat language: **posture** (break = stagger), **perfect parry**, **i-frame dodge**,
telegraphs (gold = sweep, red = unblockable thrust), hitstop on heavy hits.

## Repository map

```
KOTODAMA-AAA/
├── godot/                 # Godot 4.7 port (primary deliverable)
│   ├── scenes/build_main.gd   # deterministic scene builder (gates regenerate main.tscn)
│   ├── scenes/main.tscn       # generated scene
│   ├── scripts/               # Player, Enemy, Boss, Game, HUD, DialogueUI, SaveGame, WorldDressing, Terrain
│   ├── test/                  # smoke v2, scene-integrity, load-all-scripts gates, screenshot capture
│   ├── run-gates.ps1          # 6-step headless gate suite
│   └── docs/                  # QA runbook, studio agents
├── legacy-browser/         # HTML5/TS prototype (12 commits of polish, vision-review loops)
│   └── docs/                  # STORY, GAME_DESIGN, RESEARCH, COMPETITIVE_ANALYSIS, OPERATIONS, ARCHITECTURE, system-diagram.html
├── tools/
│   ├── reference/             # Sekiro / GoT / Nioh2 reference frames
│   ├── vision/                # vision-review prompt (Nemotron-VL loop)
│   ├── research/              # competitive research collector
│   └── screenshots.mjs        # screenshot capture script
├── docs/                   # unified docs (godot docs under docs/godot/)
├── STUDIO.md               # studio methodology + agent roles
├── .env.example            # all credentials, plug-and-play placeholders
└── LICENSE                 # MIT
```

## Quality loop (how this was made)

1. **Deterministic gates** — `run-gates.ps1` builds the scene from code and blocks on
   any `SCRIPT ERROR` / `Parse error` / failed load / missing script attachment.
2. **Runtime smoke** — headless assertions: player/enemy groups, dodge i-frame
   absorption, perfect-parry negation, boss phase transition + death, save
   round-trip.
3. **Vision review loop** — screenshots compared against the reference pool
   (Sekiro/GoT/Nioh2) via a Nemotron-VL prompt; findings committed per loop.
4. **Studio agents** — role prompts from Claude Code Game Studios
   (`docs/studio-agents.md`): gameplay-programmer, QA-lead, art-director, etc.
5. **Asset briefs** — 3D prompt catalog (`assets/prompts/asset-briefs.md`).

All of it is committed, documented, and gated. See `docs/ARCHITECTURE.md` for the
full system diagram and `docs/system-diagram.html` for the interactive map.

## Credentials

Everything is plug-and-play: copy `.env.example` → `.env`, fill in; **never commit
`.env`**. Variable names are exact across all tools in the repo.

---

*KOTODAMA means "the spirit of the word". The game's central mechanic — words you
speak become blades — is the title made literal.*
