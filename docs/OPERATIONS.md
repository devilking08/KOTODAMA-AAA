# Operations

Local development, verification, CI, publishing, and credentials.

---

## 1. Prerequisites

- Node.js ≥ 20.19 (tested on 24.x)
- npm ≥ 10
- Git ≥ 2.40
- (Optional, for publishing) a GitHub account + a fine-grained **Personal
  Access Token** with `repo` scope.

## 2. Local development

```bash
npm install
npm run dev        # http://localhost:5173
```

Hot reload is enabled by Vite. TypeScript is strict (`tsconfig.json`).

## 3. Verification checklist (run before any commit)

```bash
npm run typecheck   # tsc --noEmit
npm run test        # vitest (41 tests)
npm run build       # typecheck + production build
npm run preview     # manual smoke of the built game
```

The `screenshot` script is a lightweight smoke helper:

```bash
npm run screenshot   # waits for the preview server, asserts the page loads
```

The full CI gate is `npm run check` (typecheck → tests → build).

## 4. Continuous integration

`.github/workflows/ci.yml` runs on every push/PR:

1. checkout + setup-node (20)
2. `npm ci`
3. `npm run check`
4. upload `dist/` as an artifact for the Pages job

`.github/workflows/pages.yml` deploys `dist/` to GitHub Pages on pushes to
`main` (needs the repo's Pages source to be "GitHub Actions").

## 5. Publishing to GitHub Pages

1. Create the repository (or push to an existing one):

   ```bash
   gh repo create kotodama --public --source . --push
   ```

2. Enable Pages → "GitHub Actions" as the source (repo Settings → Pages).
3. Push `main`; the Pages workflow builds and deploys automatically.
4. Play at `https://<user>.github.io/kotodama/`.

## 6. Credentials

The project never embeds credentials. For the optional `tools/research/`
collector and for `gh` operations, **environment variables only**:

| Variable | Use |
| --- | --- |
| `GH_TOKEN` | GitHub API/CLI auth (repo scope) |
| `GITHUB_TOKEN` | Alias used by Actions/`gh` |

Copy `.env.example` (see below) if you need a local reference; **never**
commit real tokens. The `.env.example` file contains only placeholder names:

```dotenv
# GitHub (repo scope) — used by gh cli / API scripts
GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

## 7. Adding content (data-driven shortcut)

- New region → add to `src/content/regions.ts` + a `chapter` entry.
- New boss → `src/content/enemies.ts` + arena in region + quest stage +
  achievement + codex bestiary entry.
- New quest → `src/content/quests.ts`; any `talk` target must match an NPC
  id; any `reach` target must match a landmark/shrine/secret id (the
  integrity test suite will enforce this).
- New dialogue → `src/content/dialogue.ts`; NPCs reference trees by id.

## 8. Testing culture

- Content integrity tests are *non-negotiable*: they are the safety net for
  the data-driven architecture.
- Combat math tests are pure; they run in Node with stubbed audio/scene.
- Before writing an engine change, consider whether it can be expressed as a
  pure function and tested rather than verified by hand.

## 9. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `npm run dev` port in use | Vite picks the next port automatically |
| Black screen after boot | WebGL is not available; try `Settings → Quality → Low` on restart |
| Pointer lock denied | Game still works with drag-look fallback |
| Audio missing | Click once in the page (autoplay policy) |
| `npm run test` slow | Normal on first run (coverage transform warmup) |
| Pages build fails | Ensure branch is `main` and Pages source = "GitHub Actions" |
