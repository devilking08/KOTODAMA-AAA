# Graph Report - KOTODAMA-AAA  (2026-11-06)

## Corpus Check
- 70 files · ~94,093 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 44 file(s) not represented in the graph (top: .uid 16, .gd 14, (none) 7)
- WARNING: 44 of 114 files seen (39%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 1069 nodes · 2274 edges · 79 communities (38 shown, 41 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 404 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Math & Utilities
- Audio Engine
- Player & Combat Systems
- Movement & Attack Loop
- Quests & EventBus
- UI & Options
- Design & Scope Docs
- npm Dependencies
- Save System
- Visual Effects
- Game Orchestration
- CI/CD Pages Workflows
- CI/CD Pages Workflows (legacy)
- Studio Agents
- Input Layer
- Cinematic & Dialogue Camera
- Achievements
- CI Check Workflows
- CI Check Workflows (legacy)
- Progression & Endings
- TypeScript Config
- Procedural Random
- Boss Arenas & Camera
- Chapters & Content Data
- Character Rigging
- World Geometry
- World Builder
- Story & Chapters Docs
- Dialogue & Ending Data
- Regions & Weapons Data
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Research Tools
- Dialogue System (Godot)
- Enemy Grunt (Godot)
- HUD (Godot)
- Player Controller (Godot)
- Save System (Godot)
- GitHub Pages Publishing
- Credential Conventions
- Shore of Broken Words (World)
- 3D Asset Style (Cel Ink-Wash)
- Godot Gates
- Installed Reference Stack
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78

## God Nodes (most connected - your core abstractions)
1. `Game` - 96 edges
2. `UI` - 66 edges
3. `Player` - 65 edges
4. `Enemy` - 47 edges
5. `AudioEngine` - 34 edges
6. `Input` - 34 edges
7. `World` - 33 edges
8. `QuestSystem` - 30 edges
9. `Effects` - 26 edges
10. `clamp()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Claude Code Game Studios` --semantically_similar_to--> `Claude Code Game Studios`  [INFERRED] [semantically similar]
  godot/STUDIO.md → STUDIO.md
- `Run-Godot()` --references--> `SceneBuildGate`  [EXTRACTED]
  godot/run-gates.ps1 → docs/context/code-map.md
- `Run-Godot()` --references--> `ScriptLoadGate`  [EXTRACTED]
  godot/run-gates.ps1 → docs/context/code-map.md
- `Run-Godot()` --references--> `SmokeV2`  [EXTRACTED]
  godot/run-gates.ps1 → docs/context/code-map.md
- `Honest Browser Scope` --semantically_similar_to--> `Honest Scope`  [INFERRED] [semantically similar]
  legacy-browser/README.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Godot Runtime Wiring** — docs_architecture_game, docs_architecture_player, docs_architecture_enemy, docs_architecture_boss, docs_architecture_hud, docs_architecture_dialogueui, docs_architecture_savegame, docs_architecture_worlddressing, docs_architecture_terrain [INFERRED 0.95]
- **Studio Agent Rotation** — docs_godot_studio_agents_qa_tester, docs_godot_studio_agents_qa_lead, docs_godot_studio_agents_gameplay_programmer, docs_godot_studio_agents_godot_gdscript_specialist, docs_godot_studio_agents_performance_analyst, docs_godot_studio_agents_art_director, docs_godot_studio_agents_producer [EXTRACTED 1.00]
- **Data-Driven Content Layer** — legacy_browser_src_content_regions, legacy_browser_src_content_chapters, legacy_browser_src_content_enemies, legacy_browser_src_content_quests, legacy_browser_src_content_dialogue, legacy_browser_src_content_weapons, legacy_browser_src_content_cinematics, docs_system_diagram_codex_achievements_endings [EXTRACTED 1.00]

## Communities (79 total, 41 thin omitted)

### Community 0 - "Math & Utilities"
Cohesion: 0.06
Nodes (4): GameOptions, esc(), icon(), UI

### Community 1 - "Audio Engine"
Cohesion: 0.06
Nodes (4): CameraRig, angleDeltaSafe(), Player, PlayerTerrain

### Community 2 - "Player & Combat Systems"
Cohesion: 0.06
Nodes (28): angleDelta(), angleLerp(), clamp(), damp(), DEG, fbm2D(), FbmOptions, gaussianNoise() (+20 more)

### Community 3 - "Movement & Attack Loop"
Cohesion: 0.07
Nodes (17): dampAngle(), easeInOutCubic(), ActiveAttack, AiMode, AURA_COLORS, AURA_TYPES, Enemy, EnemyHooks (+9 more)

### Community 4 - "Quests & EventBus"
Cohesion: 0.09
Nodes (6): AudioEngine, Engine, MusicMood, MusicTheme, Quality, RegionTheme

### Community 5 - "UI & Options"
Cohesion: 0.08
Nodes (33): Position Map, Weighted Scorecard, Claimed White Space, Honest Content Scope, Difficulty & Accessibility, Ending Designs, Flow & Resolve Economy, Health & Posture Bars (+25 more)

### Community 6 - "Design & Scope Docs"
Cohesion: 0.07
Nodes (33): dependencies, three@^0.187.0, description, devDependencies, @types/node@^24.10.0, @types/three@^0.187.0, typescript@~5.9.3, vite@^8.3.6 (+25 more)

### Community 7 - "npm Dependencies"
Cohesion: 0.12
Nodes (11): clamp01(), DEFAULT_SETTINGS, isValidSave(), MemoryStorage, migrateSave(), safeParse(), SAVE_SLOTS, SAVE_VERSION (+3 more)

### Community 8 - "Save System"
Cohesion: 0.12
Nodes (9): Burst, Effects, Hazard, PendingAoe, Projectile, Timed, AoeSpec, ProjectileSpec (+1 more)

### Community 9 - "Visual Effects"
Cohesion: 0.07
Nodes (27): Canonical Architecture, CaptureTool, Live QA Checklist, Vision Reviewer Loop, art-director Agent, gameplay-programmer Agent, godot-gdscript-specialist Agent, performance-analyst Agent (+19 more)

### Community 10 - "Game Orchestration"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 11 - "CI/CD Pages Workflows"
Cohesion: 0.07
Nodes (30): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+22 more)

### Community 12 - "CI/CD Pages Workflows (legacy)"
Cohesion: 0.09
Nodes (30): Boss.gd Drowned General, DialogueUI.gd, Enemy.gd Grunt, Game.gd Orchestrator, HUD.gd, Input Map, Player.gd Controller, SaveGame.gd (+22 more)

### Community 14 - "Input Layer"
Cohesion: 0.13
Nodes (16): ALL_QUESTS, MAIN_QUESTS, SIDE_QUEST_ORDER, SIDE_QUESTS, EventBus, Handler, wrapAngle(), createNewSave() (+8 more)

### Community 15 - "Cinematic & Dialogue Camera"
Cohesion: 0.16
Nodes (3): QuestSystem, QuestDef, QuestState

### Community 18 - "CI Check Workflows (legacy)"
Cohesion: 0.10
Nodes (19): runs-on, steps, jobs, check, name, on, pull_request, push (+11 more)

### Community 19 - "Progression & Endings"
Cohesion: 0.10
Nodes (19): runs-on, steps, jobs, check, name, on, pull_request, push (+11 more)

### Community 20 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, forceConsistentCasingInFileNames, isolatedModules, lib, module, moduleResolution, noEmit (+10 more)

### Community 21 - "Procedural Random"
Cohesion: 0.27
Nodes (8): SeededRandom, box(), buildBamboo(), buildRock(), buildTree(), cone(), cylinder(), toonMat()

### Community 22 - "Boss Arenas & Camera"
Cohesion: 0.15
Nodes (11): ACHIEVEMENTS, ALL_ENEMIES, BOSS_ORDER, BOSSES, ELITE_ORDER, ELITES, ENEMIES, REGION_ARENAS (+3 more)

### Community 23 - "Chapters & Content Data"
Cohesion: 0.15
Nodes (13): ARTS, ITEMS, PLAYER_MOVES, SKILLS, STARTER_INVENTORY, WEAPON_ORDER, WEAPONS, CinematicShot (+5 more)

### Community 24 - "Character Rigging"
Cohesion: 0.13
Nodes (14): BossArenaDef, CinematicStep, DamageType, DialogueLine, Difficulty, EnemyBehavior, EnemySpawn, ID (+6 more)

### Community 26 - "World Builder"
Cohesion: 0.27
Nodes (3): CharacterRig, addOutline(), glowMat()

### Community 27 - "Story & Chapters Docs"
Cohesion: 0.16
Nodes (14): ArenaTrigger, GRAPPLE_KINDS, GrapplePoint, Obstacle, WorldCollectible, WorldInteraction, WorldNpc, WorldSecret (+6 more)

### Community 29 - "Regions & Weapons Data"
Cohesion: 0.17
Nodes (11): ACT_NAMES, CHAPTER_BY_ID, CHAPTERS, CODEX, CODEX_CATEGORIES, INITIAL_CODEX, SKILL_TREES, ChapterDef (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.19
Nodes (11): Six-Step Gate Suite, Scene Builder (build_main.gd), SceneBuildGate, SceneIntegrityGate, ScriptLoadGate, SmokeV2, Build Gates, Godogen Workflow Provenance (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (13): Chapter List, The Drowned Bell, Futari, The Hollow Crown, The Hollow Crown Region, Kage, Kaji, Kane (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (7): Data-Driven Content Authoring, codex/achievements/endings data, Content Data Layer, Key Invariants, CHAPTER_INTRO_IDS, CINEMATICS, CinematicDef

### Community 33 - "Community 33"
Cohesion: 0.24
Nodes (9): DIALOGUE, getDialogue(), ENDING_ORDER, ENDINGS, pickEnding(), trueEndingAvailable(), CinematicStepState, EndingDef (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.21
Nodes (9): buildGrassField(), canvasTexture(), GEO, getGradientMap(), matCache, particleTexture(), SHADOW_BIAS, sphere() (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (6): children, main(), startPreview(), children, main(), startPreview()

### Community 37 - "Community 37"
Cohesion: 0.31
Nodes (5): COLORS, MODES, Weather, ParticleKind, WeatherKind

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (5): canvas, game, ui, uiRoot, viewport

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (5): TAU, RigOptions, RigPalette, RigState, RigWeapon

### Community 40 - "Community 40"
Cohesion: 0.40
Nodes (5): Godot MCP Plugin, Generation Policy, Godot MCP Plugin, Godot MCP, Godot MCP (mkdevkit)

### Community 41 - "Community 41"
Cohesion: 0.50
Nodes (4): Progression Systems, Katana Asset Brief, Five Weapons, Asset Briefs

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): cc-haha Computer Use, cc-haha Computer Use, cc-haha Workbench

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (3): Eight Review Areas, Review Rubric, Review Rubric

## Knowledge Gaps
- **90 isolated node(s):** `Godot 4.7 Port`, `Legacy Browser Prototype`, `Quality Gates (run-gates.ps1)`, `Studio Agents`, `Asset Briefs` (+85 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 345 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Game` connect `Studio Agents` to `Math & Utilities`, `Audio Engine`, `Player & Combat Systems`, `Movement & Attack Loop`, `Quests & EventBus`, `npm Dependencies`, `Save System`, `Cinematic & Dialogue Camera`, `Achievements`, `CI Check Workflows`, `Character Rigging`, `World Geometry`, `Dialogue & Ending Data`, `Regions & Weapons Data`, `Community 32`, `Community 33`, `Community 36`, `Community 37`, `Community 38`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **What connects `Godot 4.7 Port`, `Legacy Browser Prototype`, `Quality Gates (run-gates.ps1)` to the rest of the system?**
  _90 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Math & Utilities` be split into smaller, more focused modules?**
  _Cohesion score 0.05582603050957481 - nodes in this community are weakly interconnected._
- **Why does `Player` connect `Audio Engine` to `Math & Utilities`, `Community 33`, `Movement & Attack Loop`, `Community 36`, `Quests & EventBus`, `npm Dependencies`, `Studio Agents`, `Input Layer`, `CI Check Workflows`, `Chapters & Content Data`, `Character Rigging`, `World Geometry`, `World Builder`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `Audio Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.05673076923076923 - nodes in this community are weakly interconnected._
- **Why does `Input` connect `Achievements` to `Math & Utilities`, `Community 33`, `Audio Engine`, `Studio Agents`, `Chapters & Content Data`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `Player & Combat Systems` be split into smaller, more focused modules?**
  _Cohesion score 0.05734767025089606 - nodes in this community are weakly interconnected._