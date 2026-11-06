# KOTODAMA — Echoes of the Nameless

> The world forgot its name. You remember.

**KOTODAMA** is a cinematic, open-zone **3D action game for the browser** —
a single-authored, procedurally-built dark-fantasy adventure in the tradition
of *Sekiro*, *Ghost of Tsushima* and *Nioh*, compressed into a few hundred
kilobytes of code. No asset stores, no downloads, no server: every tree,
boss, bell, blade and voice is generated at runtime from data and shaders.

<p align="center">
  <a href="#play"><strong>Play it</strong></a> ·
  <a href="#features">Features</a> ·
  <a href="#controls">Controls</a> ·
  <a href="docs/GAME_DESIGN.md">Game design</a> ·
  <a href="docs/STORY.md">Story</a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a> ·
  <a href="docs/COMPETITIVE_ANALYSIS.md">Competitive analysis</a> ·
  <a href="docs/OPERATIONS.md">Operations</a>
</p>

---

## Play

```bash
npm install
npm run dev        # local dev server
npm run preview    # preview a production build
npm run check      # typecheck + tests + build
```

Open the printed `http://localhost:5173` (dev) or `http://localhost:4173` (preview).

Or play the hosted build once published to GitHub Pages (see
[`docs/OPERATIONS.md`](docs/OPERATIONS.md) for publish steps).

> **Browser requirements:** WebGL 2, a modern evergreen browser. Desktop with
> a mouse + keyboard is the reference experience; touch controls are built in
> for mobile/tablet (auto-enabled on hover-less devices).

---

## What this game is

Ten chapters, three acts, one prologue. Six explorable regions — a drowned
coast, a black island, a frozen pass, a desert of dunes, a rain-veiled
bamboo forest, and a volcano palace — connected by story and by shrine
travel. Ten named bosses with multiple phases, plus six elite fights. A
melee system built on **posture, parry, and deathblow** rather than health
sponges. Four endings, one of which is locked behind attention, not stats.

Nineteen NPCs to talk to, twelve side quests that change the world's flags
(and the ending math), 65 codex entries, 35 achievements, a journal, map,
skills trie, photo mode, and a fully synthesised audio score.

### Scope, honestly stated

This is a **hand-built, single-authored browser game** — the campaign is
designed for roughly **8–14 hours** on a first playthrough (three acts,
eleven chapters, side quests, exploration, NG+). It is *not* a 70-hour
live-service title, and we won't pretend otherwise. What it does deliver is a
complete, authored arc with real systems: posture combat, quest state that
persists, multiple endings, and a New Game Plus that keeps your arsenal and
knowledge. Depth comes from mastery and from the world's internal
consistency, not from treadmill content.

---

## Features

**Combat — posture is the lifebar**
- Every enemy (and you) has **Health** and **Posture**. Guarding, attacking
  and parrying all feed posture; break an enemy's posture and a
  **deathblow** opens up. On bosses it costs a huge chunk of HP; on grunts
  it ends the fight.
- **Perfect parry** windows scale with a wind skill; **perilous sweeps**
  cannot be blocked (dodge); **perilous thrusts** are unblockable but can be
  avoided.
- **Flow** builds from aggression and perfect dodges — at full Flow your
  weapon art hits harder. **Resolve** is the resource for five weapon arts,
  one per weapon.
- Statuses: burn, frostbite, poison, stagger, slow.

**Five weapons, one soul**
- Katana (balanced, arts everywhere), Odachi (heavy posture break), Spear
  (range and thrusts), Twin blades (fast chain), Greatsword (committing,
  devastates posture). They unlock through the story, and the character rig,
  combo timing, art and rhythm change with each.

**World & exploration**
- Deterministic procedural terrain (same seed, same world) with hand-placed
  landmarks: shrines, torii, villages, ruins, shipwrecks, temples, arenas.
- **Shrines** are checkpoints: rest to heal/refill, fast-travel across the
  world, save.
- **Memories** (blue glows) feed the codex and side quests; **secrets**
  hide behind the landscape; **grapple points** (G) let you move vertically.
- Weather per region: coastal dusk, storm, snow, sand, rain, ash. Fully
  synthesised ambience and a generative pentatonic score.

**Story & endings**
- A nameless swordsman (Kuro) walks a world being erased by the Hush.
  Names are power; the game is about recovering them — or refusing to.
- Four endings: speak the world's name, let the silence finish, take the
  crown, or (the true ending) remember your own. The true ending requires
  Ame's recovered name plus six completed side quests — evidence of paying
  attention, not of grinding.

**Craft**
- All 3D geometry is procedural; the "art" is shaders, toon ramps, baked
  outlines, instanced flora and a sky/weather system.
- All audio is Web Audio synthesis: no samples.
- A single HTML/CSS/TS frontend, no runtime dependencies beyond Three.js.

---

## Controls

| Action | Key (default) | Note |
| --- | --- | --- |
| Move | WASD | camera-relative |
| Look | Mouse (pointer lock) | drag fallback if lock denied |
| Light attack | J or LMB | buffered; chains |
| Heavy attack | H / Shift+LMB | |
| Guard | Q or RMB | hold to guard; tap near impact = parry |
| Dodge | Space | i-frames; tap = step, hold = sprint? no — see below |
| Sprint | Shift (hold) | |
| Crouch / stealth | C | detection range shrinks |
| Interact | E | talk, shrine, pickup, grapple target |
| Grapple | G | toward grapple points |
| Lock-on | Tab | cycles by proximity/angle |
| Heal (gourd) | R | |
| Item | X | use equipped consumable |
| Weapon art | F | costs Resolve |
| Cycle weapon | T / Y | |
| Journal | N | |
| Map | M | |
| Skills | K | |
| Codex | B | |
| Photo mode | P | screenshot with S |
| Pause / menu | Esc | |
| Confirm | E / Enter / Space | |
| Cancel / back | Esc | |

Touch: virtual stick (left), look drag (right), action buttons; auto-enabled
on touch devices (`Settings → Controls → Touch`).

---

## Repository map

```
src/
  types.ts            shared type surface (the contract)
  core/               pure, DOM-free logic: EventBus, SaveSystem, MathUtils
  content/            all game data: regions, chapters, quests, dialogue,
                      enemies, weapons, codex, achievements, endings, cinematics
  engine/             runtime systems: Engine, Terrain, World, Weather, Player,
                      Enemy, Effects, Input, CameraRig, CharacterRig, AudioEngine,
                      QuestSystem, Game (orchestrator)
  ui/                 DOM UI (HUD, menus, dialogue, photo mode)
  tests/              vitest suites (41 tests)
  main.ts             bootstrap
tools/
  vision/             visual review pipeline (see README therein)
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system
diagram and data-flow documentation.

---

## Scripts

| Script | What |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest suite |
| `npm run build` | typecheck + production build |
| `npm run check` | typecheck + tests + build (CI) |
| `npm run preview` | serve the production build |
| `npm run screenshot` | smoke-test the served build |

---

## Tech

TypeScript · Vite 8 · Three.js r187 · Vitest. Single-page, no backend.
PWA manifest + favicon included.

---

## License

MIT — see [LICENSE](LICENSE). The game, its writing, and its code are
original; no assets or samples are redistributed.
