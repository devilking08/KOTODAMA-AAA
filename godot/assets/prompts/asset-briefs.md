# Asset briefs — from the 3D prompt catalog

Style anchors adapted from `D:\awesome-3d-prompts` (games/scenes/assets
categories). These are *prompt briefs* for a later asset-generation pass
(local gen via godogen asset-gen or Tripo-style text-to-3D). Keep the
cel-shaded ink-wash identity: strong silhouettes, two-three-tone materials,
warm sunlit mats, cool shadow fill.

## 1. Katana (player weapon)
Subject: a nameless katana, worn but loved.
- Geometry: 90 cm blade, slight curve, visible hamon line; tsuka wrapped in
  dark cord with a plain fuchi/kashira; bare, unadorned saya.
- Material: steel with a single bright specular streak; black leather wrap;
  amber accent on the tsuka knot.
- Style: cel shaded, thick dark outline, no decals.
- Prompt seed: "stylized low-poly katana asset, dark fantasy, cel-shaded,
  two-tone lighting, warm edge highlight, plain black scabbard, game-ready,
  front/back orthographic".

## 2. Shrine lantern (prop family)
Subject: stone lantern family (toro) — 3 sizes.
- Geometry: stacked stone sections, rounded cap, hexagonal base; one broken
  variant with moss.
- Material: pale granite with warm emissive window; subtle moss green patch.
- Style: reads at 10 m; silhouette-first; no micro-detail.
- Prompt seed: "stylized stone lantern toro prop, japanese shrine, cel-shaded,
  warm glow window, moss accents, game asset, silhouette readable".

## 3. Torii gate (landmark)
Subject: shrine gate, storm-worn vermilion.
- Geometry: two pillars, two lintels, center plaque; chamfered edges; slight
  lean on one pillar.
- Material: vermilion lacquer with dark ink under-shadow; pale stone bases.
- Style: hero-scale landmark; clean planes; strong contrast against sky.
- Prompt seed: "stylized torii gate landmark, cel-shaded, vermilion lacquer,
  stone base, dramatic sky contrast, game-ready environment prop".

## 4. Ronin grunt (character)
Subject: ashigaru/ronin with straw hat and chipped blade.
- Geometry: boxy layered silhouette; wide-brim straw hat; rope armor; katana
  on hip; cloth wrapping on forearms.
- Style: 2–3 tone materials, thick outline, readable at distance.
- Prompt seed: "stylized ronin character asset, broad straw hat, rope armor,
  cel-shaded, dark fantasy, game-ready, silhouette readable".

## 5. Shore (environment vista)
Subject: the Shore of Broken Words at dusk.
- Composition: torii half-drowned in glassy water; distant haze hills; a
  single lit shrine; leading path stones.
- Atmosphere: warm amber sky, cool blue shadow side, long shadows, mist band.
- Prompt seed: "cel-shaded japanese shore vista at dusk, drowned torii, amber
  sky, layered haze, long shadows, game key art".

## Generation policy
- All outputs go to `assets/` (ignored from build until integrated).
- One style pass per family; normals up; check inside the game before commit
  (Godot MCP screenshot compare).
