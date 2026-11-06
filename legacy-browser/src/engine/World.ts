import * as THREE from 'three';
import type { EventBus } from '../core/EventBus';
import { SeededRandom, clamp, lerp } from '../core/MathUtils';
import type {
  CollectibleDef,
  LandmarkDef,
  LandmarkKind,
  NPCDef,
  RegionDef,
  SecretDef,
  ShrineDef,
  Vec3Data,
} from '../types';
import { CharacterRig } from './CharacterRig';
import type { Terrain } from './Terrain';
import { addOutline, box, buildBamboo, buildGrassField, buildRock, buildTree, canvasTexture, cone, cylinder, glowMat, sphere, toonMat } from './Visuals';

/**
 * The living world: landmarks, people, shrines, collectibles and secrets.
 *
 * Everything here is deterministic — same region, same seed, same world.
 * The World is also the source of truth for interaction: one query feeds the
 * UI prompt, the dialogue system and the shrine panel, so the game never
 * "teleports" an interaction the world does not agree exists.
 */

export interface WorldInteraction {
  kind: 'npc' | 'shrine' | 'collectible' | 'secret' | 'grapple';
  id: string;
  label: string;
  position: THREE.Vector3;
  /** Effective reach in metres. */
  radius: number;
  data?: unknown;
}

export interface WorldNpc {
  id: string;
  def: NPCDef;
  rig: CharacterRig;
  group: THREE.Group;
  position: THREE.Vector3;
}

export interface WorldShrine extends ShrineDef {
  position: THREE.Vector3;
}

export interface WorldCollectible {
  def: CollectibleDef;
  position: THREE.Vector3;
  mesh: THREE.Group;
  taken: boolean;
}

export interface WorldSecret {
  def: SecretDef;
  position: THREE.Vector3;
  found: boolean;
}

export interface GrapplePoint {
  id: string;
  position: THREE.Vector3;
}

export interface Obstacle {
  x: number;
  z: number;
  hw: number;
  hd: number;
}

export interface ArenaTrigger {
  id: string;
  x: number;
  z: number;
  radius: number;
  boss: string;
  chapter: number;
  fogColor?: string;
  entryFlag?: string;
  triggered: boolean;
}

export interface WorldOptions {
  scene: THREE.Scene;
  region: RegionDef;
  terrain: Terrain;
  events: EventBus;
  chapter: number;
  /** Live flags accessor (used for secrets and arena gating). */
  flags: () => Record<string, boolean | number | string>;
  /** Toggle outlines (Kurosawa / accessibility). */
  outlines?: boolean;
}

const GRAPPLE_KINDS = new Set<LandmarkKind>(['torii', 'gate', 'watchtower', 'citadel', 'bell']);

const WATER_VERT = /* glsl */ `
  varying vec3 vWorld;
  varying float vH;
  uniform float uTime;
  uniform float uAmp;
  void main() {
    vec3 p = position;
    float n = sin(p.x * 0.35 + uTime * 1.4) * cos(p.z * 0.28 + uTime * 1.1);
    n += sin(p.x * 0.17 + p.z * 0.23 + uTime * 0.7) * 1.4;
    p.y += n * uAmp;
    vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
    vH = n;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const WATER_FRAG = /* glsl */ `
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform float uTime;
  varying vec3 vWorld;
  varying float vH;
  void main() {
    vec3 dir = normalize(vWorld);
    float fresnel = pow(1.0 - max(dir.y, 0.0), 2.0);
    float scroll = sin(vWorld.x * 0.5 + uTime * 0.8) * 0.5 + 0.5;
    vec3 col = mix(uDeep, uShallow, clamp(scroll + vH * 0.25 + fresnel * 0.4, 0.0, 1.0));
    gl_FragColor = vec4(col, 0.82);
  }
`;

export class World {
  readonly group = new THREE.Group();
  readonly terrain: Terrain;
  readonly interactions: WorldInteraction[] = [];
  npcs: WorldNpc[] = [];
  shrines: WorldShrine[] = [];
  collectibles: WorldCollectible[] = [];
  secrets: WorldSecret[] = [];
  grapples: GrapplePoint[] = [];
  obstacles: Obstacle[] = [];
  arenas: ArenaTrigger[] = [];
  private landmarks = new Map<string, { group: THREE.Group; def: LandmarkDef }>();
  private animated: Array<{ object: THREE.Object3D; speed: number; phase: number; amp: number }> = [];
  private water: THREE.Mesh | null = null;
  private lava: THREE.Mesh | null = null;
  private waterMat: THREE.ShaderMaterial | null = null;
  private time = 0;
  private readonly events: EventBus;
  private readonly chapter: number;
  private readonly flags: () => Record<string, boolean | number | string>;
  private readonly theme: RegionDef['theme'];

  constructor(private readonly opts: WorldOptions) {
    this.terrain = opts.terrain;
    this.events = opts.events;
    this.chapter = opts.chapter;
    this.flags = opts.flags;
    this.theme = opts.region.theme;
    this.group.name = `world:${opts.region.id}`;
    opts.scene.add(this.group);

    this.buildLiquid();
    this.buildFlora();
    for (const lm of opts.region.landmarks) this.buildLandmark(lm);
    this.buildShrines();
    this.buildNpcs();
    this.buildCollectibles();
    this.buildSecrets();
    this.buildGrapples();
    this.buildArenas();
    this.buildObstacles();
    this.attachLandmarkBounds();
  }

  get region(): RegionDef {
    return this.opts.region;
  }

  /* ── Water & lava ────────────────────────────────────────────────────── */

  private buildLiquid(): void {
    const t = this.terrain;
    const size = this.region.terrain.size;
    const mat = (level: number, shallow: string, deep: string): THREE.ShaderMaterial => {
      const m = new THREE.ShaderMaterial({
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: 0.18 },
          uShallow: { value: new THREE.Color(shallow) },
          uDeep: { value: new THREE.Color(deep) },
        },
      });
      return m;
    };

    if (t.waterLevel !== null) {
      this.waterMat = mat(t.waterLevel, this.theme.water, this.theme.waterDeep);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 48, 48), this.waterMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = t.waterLevel;
      plane.renderOrder = 3;
      this.group.add(plane);
      this.water = plane;
    }

    if (t.lavaLevel !== null) {
      const lavaMat = mat(t.lavaLevel, '#ff9a4a', '#b2341a');
      lavaMat.uniforms.uAmp.value = 0.3;
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 48, 48), lavaMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = t.lavaLevel;
      plane.renderOrder = 3;
      this.group.add(plane);
      this.lava = plane;
    }
  }

  /* ── Flora (instanced, deterministic) ────────────────────────────────── */

  private buildFlora(): void {
    const t = this.terrain;
    const rng = new SeededRandom(this.region.terrain.seed * 13 + 7);
    const theme = this.theme;
    const inWater = (x: number, z: number): boolean => {
      if (t.waterLevel === null || t.lavaLevel === null) return t.waterLevel !== null && t.heightAt(x, z) < t.waterLevel - 0.4;
      return t.heightAt(x, z) < Math.max(t.waterLevel ?? -1e9, t.lavaLevel ?? 1e9) - 0.4;
    };

    // Grass — a soft ground cover everywhere dry and not too steep.
    const grass = buildGrassField(1600, this.region.terrain.size * 0.94, theme.grass, new SeededRandom(this.region.terrain.seed + 5), (x, z) =>
      inWater(x, z) ? -50 : t.heightAt(x, z),
    );
    grass.name = 'grass';
    this.group.add(grass);

    // Rocks scattered on slopes and near landmarks.
    const rockCount = 170;
    for (let i = 0; i < rockCount; i++) {
      const x = rng.range(-t.half + 12, t.half - 12);
      const z = rng.range(-t.half + 12, t.half - 12);
      if (inWater(x, z)) continue;
      if (t.slopeAt(x, z) < 0.22) continue;
      const rock = buildRock(rng, theme.rock);
      rock.position.set(x, t.heightAt(x, z), z);
      this.group.add(rock);
    }

    // Low shrubs and undergrowth add ground-level clutter.
    const shrubCount = 170;
    const shrubMat = toonMat(theme.foliage);
    for (let i = 0; i < shrubCount; i++) {
      const x = rng.range(-t.half + 10, t.half - 10);
      const z = rng.range(-t.half + 10, t.half - 10);
      if (inWater(x, z)) continue;
      const s = rng.range(0.5, 1.4);
      const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.6, 7, 5), shrubMat);
      shrub.scale.set(s, s * rng.range(0.5, 0.85), s);
      shrub.position.set(x, t.heightAt(x, z) + s * 0.3, z);
      shrub.castShadow = true;
      this.group.add(shrub);
    }

    // Trees cluster around landmarks; sparse woods elsewhere.
    const clusters: Array<{ x: number; z: number; strength: number }> = [];
    for (const lm of this.region.landmarks) {
      const strength = lm.kind === 'village' || lm.kind === 'camp' || lm.kind === 'oasis' || lm.kind === 'garden' ? 1 : 0.55;
      clusters.push({ x: lm.x, z: lm.z, strength });
    }
    const treeCount = 340;
    for (let i = 0; i < treeCount; i++) {
      const x = rng.range(-t.half + 16, t.half - 16);
      const z = rng.range(-t.half + 16, t.half - 16);
      if (inWater(x, z)) continue;
      let near = 0;
      for (const c of clusters) {
        const d = Math.hypot(x - c.x, z - c.z);
        if (d < 70) near += c.strength * (1 - d / 70);
      }
      if (rng.next() > 0.14 + near * 0.55) continue;
      const tree = buildTree(rng, { trunk: '#4a3a2c', leaf: theme.foliage }, this.region.terrain.shape === 'alpine');
      const s = rng.range(0.75, 1.6);
      tree.scale.setScalar(s);
      tree.position.set(x, t.heightAt(x, z), z);
      this.group.add(tree);
    }

    // Path stones: small dry slabs threading through torii/lantern lines.
    const pathMat = toonMat('#7d7464');
    for (const lm of this.region.landmarks) {
      if (lm.kind !== 'torii' && lm.kind !== 'lantern' && lm.kind !== 'gate') continue;
      const n = lm.kind === 'gate' ? 10 : 6;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n;
        const px = lm.x + Math.sin(lm.rotation ?? 0) * (u - 0.5) * 26;
        const pz = lm.z + Math.cos(lm.rotation ?? 0) * (u - 0.5) * 26;
        if (inWater(px, pz)) continue;
        const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.12, 7), pathMat);
        stone.position.set(px, t.heightAt(px, pz) + 0.06, pz);
        stone.rotation.y = rng.range(0, Math.PI);
        stone.receiveShadow = true;
        this.group.add(stone);
      }
    }

    this.buildHaze();

    // Bamboo grove clusters.
    const groves = this.region.landmarks.filter((l) => l.kind === 'bamboo_grove');
    for (const grove of groves) {
      const count = 90;
      const groveRng = new SeededRandom(`${this.region.terrain.seed}_bamboo_${grove.x}_${grove.z}`);
      for (let i = 0; i < count; i++) {
        const a = groveRng.range(0, Math.PI * 2);
        const r = Math.sqrt(groveRng.next()) * (grove.scale ?? 1) * 14;
        const x = grove.x + Math.sin(a) * r;
        const z = grove.z + Math.cos(a) * r;
        if (inWater(x, z)) continue;
        const stem = buildBamboo(groveRng, { leaf: '#5f9a4a', trunk: '#6f9a54' });
        stem.position.set(x, t.heightAt(x, z), z);
        stem.rotation.y = groveRng.range(0, Math.PI * 2);
        this.group.add(stem);
      }
    }
  }

  /* ── Landmarks ───────────────────────────────────────────────────────── */

  private buildLandmark(lm: LandmarkDef): void {
    const t = this.terrain;
    const g = new THREE.Group();
    const y = t.heightAt(lm.x, lm.z);
    g.position.set(lm.x, y, lm.z);
    g.rotation.y = lm.rotation ?? 0;
    const scale = lm.scale ?? 1;
    g.scale.setScalar(scale);

    const add = (child: THREE.Object3D): void => {
      g.add(child);
    };

    switch (lm.kind) {
      case 'shrine': {
        const stone = cylinder(0.15, 0.85, 0.7, toonMat('#8a8a84'), 8, 0.35);
        add(stone);
        const roof = cone(0.9, 0.8, toonMat('#4a3a2c'), 6);
        roof.position.y = 1.55;
        add(roof);
        const body = box(0.8, 0.7, 0.8, toonMat('#6a5a44'), 0, 1.0, 0);
        add(body);
        const door = box(0.4, 0.45, 0.04, toonMat('#2a2018'), 0, 0.85, 0.41);
        add(door);
        const lantern = box(0.2, 0.32, 0.2, glowMat('#ffb070', 1.6, true), 0.7, 1.15, 0.3);
        add(lantern);
        this.animated.push({ object: lantern, speed: 2.2, phase: lm.x + lm.z, amp: 0.5 });
        const rope = box(0.05, 0.9, 0.05, toonMat('#c9b36a'), 0.42, 1.5, 0);
        add(rope);
        break;
      }
      case 'torii': {
        const colMat = toonMat('#a83a2c');
        // pillars
        const pl = cylinder(0.28, 0.34, 6.4, colMat, 8, 3.2);
        pl.position.x = -1.9;
        add(pl);
        const pr = pl.clone();
        pr.position.x = 1.9;
        add(pr);
        // top beam
        const beam = box(6.4, 0.42, 0.42, toonMat('#2a1612'), 0, 6.5, 0);
        add(beam);
        const beam2 = box(5.4, 0.3, 0.3, toonMat('#b8442e'), 0, 6.1, 0);
        add(beam2);
        // center plaque
        const plaque = box(2.4, 0.9, 0.24, toonMat('#1c1410'), 0, 5.6, 0.1);
        add(plaque);
        const gld = box(1.9, 0.5, 0.05, glowMat('#e0c060', 1.2, true), 0, 5.6, 0.24);
        add(gld);
        // base stones
        const baseL = sphere(0.7, toonMat('#7a7a74'), 8);
        baseL.position.set(-1.9, 0.35, 0.2);
        add(baseL);
        const baseR = baseL.clone();
        baseR.position.x = 1.9;
        add(baseR);
        break;
      }
      case 'house': {
        this.buildHouse(add, lm.variant === 'snow');
        break;
      }
      case 'village': {
        const rng = new SeededRandom(`${this.region.terrain.seed}_village_${lm.x}_${lm.z}`);
        const n = rng.int(4, 6);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rng.range(-0.5, 0.5);
          const r = rng.range(7, 15);
          const hx = Math.sin(a) * r;
          const hz = Math.cos(a) * r;
          const house = new THREE.Group();
          house.position.set(hx, t.heightAt(lm.x + hx, lm.z + hz) - y, hz);
          house.rotation.y = rng.range(0, Math.PI * 2);
          this.buildHouse((c) => house.add(c), this.region.terrain.shape === 'alpine');
          g.add(house);
        }
        // well in the middle
        const wellMat = toonMat('#6a5a44');
        const well = cylinder(0.75, 0.9, 1.0, wellMat, 8, 0.5);
        g.add(well);
        const wellTop = cylinder(1.0, 1.0, 0.18, toonMat('#4a3a2c'), 8, 1.05);
        g.add(wellTop);
        const wellPole = box(0.1, 1.6, 0.1, wellMat, 1.0, 1.6, 0);
        g.add(wellPole);
        break;
      }
      case 'ruin': {
        const stoneMat = toonMat('#5a564e');
        const mossMat = toonMat('#4a5a3a');
        const rng = new SeededRandom(`${this.region.terrain.seed}_ruin_${lm.x}_${lm.z}`);
        const n = rng.int(5, 8);
        for (let i = 0; i < n; i++) {
          const a = rng.range(0, Math.PI * 2);
          const r = rng.range(1.5, 4.5);
          const w = rng.range(0.8, 2.6);
          const h = rng.range(0.8, 3.2);
          const d = rng.range(0.8, 2.0);
          const wall = box(w, h, d, rng.chance(0.5) ? stoneMat : mossMat, Math.sin(a) * r, h / 2, Math.cos(a) * r);
          wall.rotation.y = rng.range(0, Math.PI);
          add(wall);
          if (rng.chance(0.35)) {
            const rubble = buildRock(rng, stoneMat.color.getStyle());
            rubble.position.set(Math.sin(a) * r * 1.15, 0.3, Math.cos(a) * r * 1.15);
            rubble.scale.setScalar(0.7);
            add(rubble);
          }
        }
        break;
      }
      case 'bell': {
        // pavilion
        const pillarMat = toonMat('#4a2a22');
        for (const sx of [-2.6, 2.6]) {
          const pillar = box(0.4, 4.6, 0.4, pillarMat, sx, 2.3, 0);
          add(pillar);
        }
        const beam = box(6.0, 0.5, 0.5, toonMat('#3a221a'), 0, 4.9, 0);
        add(beam);
        const roof = cone(4.4, 1.6, toonMat('#3a2820'), 8);
        roof.position.y = 6.3;
        add(roof);
        // the bell
        const bell = new THREE.Mesh(new THREE.SphereGeometry(1.05, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), toonMat('#8a8c86'));
        bell.position.y = 3.7;
        bell.scale.y = 1.35;
        add(bell);
        const clapper = cylinder(0.1, 0.3, 0.5, toonMat('#5a564e'), 6, 3.0);
        add(clapper);
        // rope
        const rope = box(0.07, 2.6, 0.07, toonMat('#c9b36a'), 0, 1.7, 0);
        add(rope);
        this.animated.push({ object: bell, speed: 0.9, phase: lm.x, amp: 0.02 });
        break;
      }
      case 'bridge': {
        const woodMat = toonMat('#6a4f36');
        const darkWood = toonMat('#45301f');
        const length = 18;
        const deck = box(length, 0.35, 3.6, woodMat, 0, 0.6, 0);
        add(deck);
        for (const sy of [-1.35, 1.35]) {
          const rail = box(length, 0.2, 0.18, darkWood, 0, 1.5, sy);
          add(rail);
          const posts = 9;
          for (let i = 0; i < posts; i++) {
            const px = -length / 2 + 2 + i * ((length - 4) / (posts - 1));
            const post = box(0.18, 1.25, 0.18, darkWood, px, 1.0, sy);
            add(post);
          }
        }
        for (let i = 0; i < 7; i++) {
          const plank = box(length * 0.95, 0.1, 0.5, woodMat, 0, 0.82, -1.4 + i * 0.46);
          add(plank);
        }
        break;
      }
      case 'arena': {
        const stoneMat = toonMat('#5a5652');
        const ring = 30;
        for (let i = 0; i < ring; i++) {
          const a = (i / ring) * Math.PI * 2;
          const r = (lm.scale ?? 1) * 16;
          const rock = buildRock(new SeededRandom(`${this.region.terrain.seed}_arena_${i}`), '#5a5652');
          rock.scale.setScalar(1.1);
          rock.position.set(Math.sin(a) * r, 0.4, Math.cos(a) * r);
          g.add(rock);
        }
        // torches
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = (lm.scale ?? 1) * 15;
          const post = cylinder(0.12, 0.2, 2.4, stoneMat, 6, 1.2);
          post.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
          g.add(post);
          const flame = box(0.24, 0.3, 0.24, glowMat('#ff9a4a', 2, true), Math.sin(a) * r, 2.7, Math.cos(a) * r);
          g.add(flame);
          this.animated.push({ object: flame, speed: 3.4, phase: i, amp: 0.4 });
        }
        break;
      }
      case 'gate': {
        const stoneMat = toonMat('#3a3a42');
        const darkMat = toonMat('#1c1c24');
        for (const sx of [-7, 7]) {
          const tower = box(5.4, 11, 6.4, stoneMat, sx, 5.5, 0);
          add(tower);
          const towerRoof = cone(3.8, 2.4, toonMat('#2a2028'), 6);
          towerRoof.position.set(sx, 11.6, 0);
          add(towerRoof);
        }
        const lintel = box(19, 2.6, 3.4, darkMat, 0, 13.2, 0);
        add(lintel);
        const redBand = box(19, 1.0, 3.5, glowMat('#a83a2c', 0.8, true), 0, 11.9, 0);
        add(redBand);
        // doors
        const doorMat = toonMat('#2a2018');
        for (const sx of [-2.2, 2.2]) {
          const door = box(2.2, 4.6, 0.3, doorMat, sx, 2.3, 1.6);
          add(door);
        }
        break;
      }
      case 'camp': {
        const tentMat = toonMat('#5a4a3a');
        const rng = new SeededRandom(`${this.region.terrain.seed}_camp_${lm.x}_${lm.z}`);
        for (let i = 0; i < 3; i++) {
          const a = rng.range(0, Math.PI * 2);
          const r = rng.range(3, 7);
          const h = rng.range(1.8, 2.6);
          const tent = cone(rng.range(1.4, 2.2), h, tentMat, 6);
          tent.position.set(Math.sin(a) * r, h / 2 - 0.2, Math.cos(a) * r);
          g.add(tent);
        }
        // fire
        const fireBase = cylinder(0.9, 1.0, 0.5, toonMat('#5a5652'), 8, 0.25);
        g.add(fireBase);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const log = box(0.9, 0.16, 0.2, toonMat('#3a2a18'), Math.sin(a) * 0.4, 0.6, Math.cos(a) * 0.4);
          log.rotation.y = a;
          g.add(log);
        }
        const ember = sphere(0.25, glowMat('#ffb050', 2.4, true), 8);
        ember.position.y = 0.85;
        g.add(ember);
        this.animated.push({ object: ember, speed: 4.2, phase: lm.x, amp: 0.6 });
        break;
      }
      case 'oasis': {
        const rim = cylinder(1, 1, 0.2, toonMat('#7a6a4a'), 12, 0.06);
        add(rim);
        const pool = cylinder(0.92, 0.92, 0.5, toonMat('#3f8f9a', { transparent: 0.9 }), 12, 0.15);
        add(pool);
        if (lm.variant === 'ice') {
          (pool.material as THREE.MeshToonMaterial).color.set('#9fd8e4');
        }
        const rng = new SeededRandom(`${this.region.terrain.seed}_oasis_${lm.x}_${lm.z}`);
        for (let i = 0; i < 5; i++) {
          const a = rng.range(0, Math.PI * 2);
          const r = rng.range(2.2, 4.5);
          const palm = this.buildPalm(rng);
          palm.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
          g.add(palm);
        }
        break;
      }
      case 'garden': {
        const bushMat = toonMat('#3e5a38');
        const rng = new SeededRandom(`${this.region.terrain.seed}_garden_${lm.x}_${lm.z}`);
        for (let i = 0; i < 12; i++) {
          const a = rng.range(0, Math.PI * 2);
          const r = rng.range(1.2, 5.5);
          const br = rng.range(0.6, 1.2);
          const bush = sphere(br, bushMat, 8);
          bush.position.set(Math.sin(a) * r, br * 0.6, Math.cos(a) * r);
          g.add(bush);
        }
        // stepping stones
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const r = 1.2 + i * 0.7;
          const stone = cylinder(0.3, 0.4, 0.12, toonMat('#8a8a84'), 7, 0.06);
          stone.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
          g.add(stone);
        }
        const archL = cylinder(0.2, 0.26, 2.6, toonMat('#6a4a3a'), 6, 1.3);
        archL.position.x = -2.2;
        add(archL);
        const archR = archL.clone();
        archR.position.x = 2.2;
        add(archR);
        const archTop = box(4.6, 0.3, 0.3, toonMat('#6a4a3a'), 0, 2.7, 0);
        add(archTop);
        break;
      }
      case 'citadel': {
        const stoneMat = toonMat('#4a4a52');
        const roofMat = toonMat('#2a2028');
        const redMat = toonMat('#7a2c24');
        // base
        const base = box(26, 3.4, 20, stoneMat, 0, 1.7, 0);
        add(base);
        // main hall
        const hall = box(16, 6, 12, toonMat('#3a3640'), 0, 6.4, 0);
        add(hall);
        const hallRoof = cone(11, 3.6, roofMat, 6);
        hallRoof.position.y = 11.2;
        add(hallRoof);
        const ridge = box(14, 0.7, 0.7, redMat, 0, 12.6, 0);
        add(ridge);
        // side wings
        for (const sx of [-12, 12]) {
          const wing = box(8, 4.4, 9, stoneMat, sx, 2.2 + 3.8, 0);
          add(wing);
          const wingRoof = cone(6, 2.2, roofMat, 6);
          wingRoof.position.set(sx, 8.4, 0);
          add(wingRoof);
        }
        // entry
        const doorMat = toonMat('#1c1410');
        for (const sx of [-1.6, 1.6]) {
          const door = box(1.6, 4.4, 0.4, doorMat, sx, 2.2, 6.1);
          add(door);
        }
        const bannerL = box(0.6, 3.4, 0.1, redMat, -4.2, 4.6, 5.9);
        add(bannerL);
        const bannerR = bannerL.clone();
        bannerR.position.x = 4.2;
        add(bannerR);
        break;
      }
      case 'grave': {
        const mound = sphere(1.3, toonMat('#6a6a5e'), 10);
        mound.scale.y = 0.5;
        mound.position.y = 0.3;
        add(mound);
        const stone = box(0.7, 1.0, 0.2, toonMat('#7a7a74'), 0.7, 0.55, 0);
        add(stone);
        const sword = box(0.08, 1.1, 0.08, toonMat('#8a8c86'), -0.4, 0.6, 0.15);
        sword.rotation.z = 0.18;
        add(sword);
        const hilt = box(0.16, 0.22, 0.16, toonMat('#3a2a20'), -0.4, 1.18, 0.15);
        add(hilt);
        break;
      }
      case 'watchtower': {
        const woodMat = toonMat('#4a3a2c');
        const platform = box(3.6, 0.4, 3.6, woodMat, 0, 4.4, 0);
        add(platform);
        for (const sx of [-1.5, 1.5]) {
          for (const sz of [-1.5, 1.5]) {
            const leg = box(0.35, 4.4, 0.35, toonMat('#3a2a20'), sx, 2.2, sz);
            add(leg);
          }
        }
        const ladder = box(1.0, 4.0, 0.12, toonMat('#3a2a20'), 1.9, 2.2, 0);
        ladder.rotation.z = 0.22;
        add(ladder);
        const roof = cone(2.6, 1.4, toonMat('#2a2018'), 6);
        roof.position.y = 6.2;
        add(roof);
        const lantern = box(0.3, 0.42, 0.3, glowMat('#ffb070', 1.8, true), 0, 5.1, 0);
        add(lantern);
        this.animated.push({ object: lantern, speed: 2.6, phase: lm.z, amp: 0.5 });
        break;
      }
      case 'lantern': {
        const n = 5;
        const rowMat = toonMat('#4a3a2c');
        for (let i = 0; i < n; i++) {
          const u = i / (n - 1);
          const lx = (u - 0.5) * 26;
          const lz = Math.sin(u * Math.PI) * 2.2;
          const postY = t.heightAt(lm.x + lx, lm.z + lz) - y;
          const post = box(0.22, 2.3, 0.22, rowMat, lx, postY + 1.15, lz);
          g.add(post);
          const lamp = box(0.34, 0.44, 0.34, glowMat('#ffb070', 1.5, true), lx, postY + 2.5, lz);
          g.add(lamp);
          this.animated.push({ object: lamp, speed: 2.6 + i * 0.3, phase: lm.x + i, amp: 0.45 });
        }
        break;
      }
      case 'cave': {
        const darkMat = toonMat('#151310');
        const cave = sphere((lm.scale ?? 1) * 3.2, darkMat, 12);
        cave.scale.set(1.5, 0.9, 1.1);
        cave.position.y = 1.2;
        add(cave);
        const glow = sphere(0.7, glowMat('#4a6a9a', 0.8, true), 8);
        glow.position.set(0, 1.1, 1.9);
        add(glow);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = (lm.scale ?? 1) * 3.6;
          const rock = buildRock(new SeededRandom(`${this.region.terrain.seed}_cave_${i}`), '#3a3834');
          rock.scale.setScalar(1.3);
          rock.position.set(Math.sin(a) * r, 0.4, Math.cos(a) * r);
          g.add(rock);
        }
        break;
      }
      case 'shipwreck': {
        const hullMat = toonMat('#4a3a2c');
        const hull = box(9, 2.6, 3.4, hullMat, 0, 1.2, 0);
        hull.rotation.x = 0.42;
        hull.rotation.z = -0.1;
        add(hull);
        const mast = cylinder(0.18, 0.24, 8, toonMat('#3a2a20'), 6, 6.4);
        mast.position.x = -1.2;
        mast.rotation.z = 0.18;
        add(mast);
        const sail = box(3.4, 4.2, 0.06, toonMat('#c9b8a0', { transparent: 0.85 }), -1.2, 6.4, 0.6);
        sail.rotation.z = 0.22;
        add(sail);
        const deckBox = box(3, 0.5, 2.6, hullMat, 1.6, 2.6, -0.2);
        deckBox.rotation.x = 0.4;
        add(deckBox);
        const hole = sphere(0.55, toonMat('#1a120e'), 8);
        hole.position.set(3.2, 1.5, 0.6);
        add(hole);
        break;
      }
      case 'bamboo_grove': {
        // The grove itself is generated in buildFlora; here we add a mossy
        // clearing marker and a rope fence on the boundary.
        const fenceMat = toonMat('#4a5a3a');
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          const r = (lm.scale ?? 1) * 14;
          const post = box(0.16, 1.1, 0.16, fenceMat, Math.sin(a) * r, 0.55, Math.cos(a) * r);
          g.add(post);
        }
        break;
      }
      case 'statue': {
        const stoneMat = toonMat('#6a6862');
        const ancientMat = toonMat('#57544e');
        // pedestal
        const pad = box(3.4, 0.9, 3.4, stoneMat, 0, 0.45, 0);
        add(pad);
        const legs = box(2.2, 2.6, 1.8, ancientMat, 0, 2.6, 0);
        add(legs);
        const torso = box(2.6, 3.4, 1.8, ancientMat, 0, 5.6, 0);
        add(torso);
        const head = box(1.0, 1.2, 1.0, ancientMat, 0, 7.9, 0.2);
        add(head);
        // arms
        const armL = box(0.7, 2.6, 0.7, ancientMat, -1.9, 5.1, 0);
        armL.rotation.z = 0.18;
        add(armL);
        const armR = box(0.7, 2.6, 0.7, ancientMat, 1.9, 5.1, 0);
        armR.rotation.z = -0.18;
        add(armR);
        // weathered sword
        const blade = box(0.14, 3.2, 0.14, toonMat('#6a6c68'), 2.0, 5.9, -0.3);
        blade.rotation.x = 0.35;
        add(blade);
        break;
      }
      default:
        break;
    }

    this.group.add(g);
    this.landmarks.set(lm.id, { group: g, def: lm });
  }

  private buildHouse(add: (c: THREE.Object3D) => void, snow = false): void {
    const wallMat = toonMat(snow ? '#d9dede' : '#c9b8a0');
    const woodMat = toonMat('#4a3a2c');
    const roofMat = toonMat('#3a2a20');
    const body = box(3.4, 2.4, 3.0, wallMat, 0, 1.2, 0);
    add(body);
    for (const sx of [-1.9, 1.9]) {
      const post = box(0.16, 2.4, 0.16, woodMat, sx, 1.2, 0);
      add(post);
    }
    const roof = cone(2.9, 1.7, roofMat, 4);
    roof.position.y = 3.4;
    roof.rotation.y = Math.PI / 4;
    add(roof);
    const door = box(0.9, 1.4, 0.12, woodMat, 0, 0.7, 1.56);
    add(door);
    const windowMat = toonMat('#2a3a4a');
    const winL = box(0.6, 0.5, 0.08, windowMat, -1.1, 1.7, 1.5);
    add(winL);
    const winR = box(0.6, 0.5, 0.08, windowMat, 1.1, 1.7, 1.5);
    add(winR);
  }

  private buildPalm(rng: SeededRandom): THREE.Group {
    const palm = new THREE.Group();
    const trunk = cylinder(0.16, 0.3, 4.6, toonMat('#6a4f36'), 6, 2.3);
    trunk.rotation.z = rng.range(-0.18, 0.18);
    palm.add(trunk);
    const leafMat = toonMat('#3e6a3a');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const leaf = cone(0.7, 2.6, leafMat, 4);
      leaf.position.set(Math.sin(a) * 0.9, 5.1, Math.cos(a) * 0.9);
      leaf.rotation.set(0.9, a, 0);
      palm.add(leaf);
    }
    return palm;
  }

  /* ── Atmosphere haze (aerial perspective layering) ────────────────────── */

  private buildHaze(): void {
    const t = this.terrain;
    const theme = this.region.theme;
    const hazeColor = new THREE.Color(theme.skyHorizon);
    const tex = canvasTexture(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    });
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      color: hazeColor,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const rng = new SeededRandom(this.region.terrain.seed + 99);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rng.range(-0.4, 0.4);
      const r = t.half * rng.range(0.62, 0.8);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(340, 60), mat);
      plane.position.set(Math.sin(a) * r, rng.range(12, 22), Math.cos(a) * r);
      plane.rotation.x = -Math.PI / 2;
      plane.rotation.z = -a;
      plane.renderOrder = 2;
      plane.frustumCulled = false;
      this.group.add(plane);
    }
  }

  /* ── NPCs ────────────────────────────────────────────────────────────── */

  private buildNpcs(): void {
    const t = this.terrain;
    for (const npc of this.region.npcs) {
      if (npc.chapter > this.chapter) continue;
      if (npc.untilChapter !== undefined && this.chapter >= npc.untilChapter) continue;
      const rig = new CharacterRig({
        palette: {
          primary: npc.colors.robe,
          secondary: npc.colors.sash,
          skin: npc.colors.skin,
          hair: npc.colors.hair,
          accent: npc.colors.accent,
          blade: npc.colors.accent,
        },
        weapon: npc.silhouette === 'samurai' ? 'katana' : npc.silhouette === 'monk' ? 'staff' : 'none',
        build: npc.silhouette === 'fox' ? 'fox' : npc.silhouette === 'child' ? 'child' : npc.silhouette === 'monk' ? 'monk' : npc.silhouette === 'samurai' ? 'samurai' : npc.silhouette === 'noble' ? 'noble' : 'villager',
        scale: npc.silhouette === 'child' ? 0.72 : 1,
      });
      const group = new THREE.Group();
      group.add(rig.group);
      const y = t.heightAt(npc.x, npc.z);
      group.position.set(npc.x, y, npc.z);
      group.rotation.y = npc.rot ?? 0;
      this.group.add(group);
      this.npcs.push({ id: npc.id, def: npc, rig, group, position: new THREE.Vector3(npc.x, y, npc.z) });
    }
  }

  /* ── Shrines ─────────────────────────────────────────────────────────── */

  private buildShrines(): void {
    const t = this.terrain;
    for (const shrine of this.region.shrines) {
      if (shrine.chapter > this.chapter) continue;
      const y = t.heightAt(shrine.x, shrine.z);
      this.shrines.push({ ...shrine, position: new THREE.Vector3(shrine.x, y, shrine.z) });
    }
  }

  /* ── Collectibles ────────────────────────────────────────────────────── */

  private buildCollectibles(): void {
    const t = this.terrain;
    let i = 0;
    for (const def of this.region.collectibles) {
      if (def.chapter !== undefined && def.chapter > this.chapter) continue;
      const y = t.heightAt(def.x, def.z);
      const mesh = new THREE.Group();
      const color = def.kind === 'memory' ? '#9ad8ff' : def.kind === 'item' ? '#ffd27a' : def.kind === 'lore' ? '#d9b36a' : '#9fe8a0';
      const core = sphere(0.22, glowMat(color, 2, true), 8);
      mesh.add(core);
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(0.42, 0.03, 6, 20),
        glowMat(color, 1.4, true),
      );
      halo.rotation.x = Math.PI / 2;
      mesh.add(halo);
      const yBase = t.heightAt(def.x, def.z) + 0.7;
      mesh.position.set(def.x, yBase, def.z);
      this.group.add(mesh);
      this.collectibles.push({ def, position: new THREE.Vector3(def.x, y, def.z), mesh, taken: false });
      this.animated.push({ object: mesh, speed: 1.4 + (i % 3) * 0.3, phase: i, amp: 0.26 });
      i++;
    }
  }

  /* ── Secrets ─────────────────────────────────────────────────────────── */

  private buildSecrets(): void {
    const t = this.terrain;
    for (const def of this.region.secrets) {
      if (def.chapter !== undefined && def.chapter > this.chapter) continue;
      const y = t.heightAt(def.x, def.z);
      const found = Boolean(this.flags()[def.flag]);
      this.secrets.push({ def, position: new THREE.Vector3(def.x, y, def.z), found });
    }
  }

  /* ── Grapple points ──────────────────────────────────────────────────── */

  private buildGrapples(): void {
    const t = this.terrain;
    for (const lm of this.region.landmarks) {
      if (!GRAPPLE_KINDS.has(lm.kind)) continue;
      if (lm.chapters && !lm.chapters.includes(this.chapter)) continue;
      const h = lm.kind === 'gate' ? 12 : lm.kind === 'citadel' ? 14 : lm.kind === 'watchtower' ? 5.6 : lm.kind === 'bell' ? 5.6 : 6.6;
      const y = t.heightAt(lm.x, lm.z) + h * (lm.scale ?? 1);
      this.grapples.push({ id: `grapple_${lm.id}`, position: new THREE.Vector3(lm.x, y, lm.z) });
    }
  }

  /* ── Arenas ──────────────────────────────────────────────────────────── */

  private buildArenas(): void {
    for (const arena of this.region.arenas) {
      this.arenas.push({ ...arena, triggered: false });
    }
  }

  /* ── Obstacles ───────────────────────────────────────────────────────── */

  private buildObstacles(): void {
    for (const lm of this.region.landmarks) {
      const scale = lm.scale ?? 1;
      let hw = 0;
      let hd = 0;
      switch (lm.kind) {
        case 'house': hw = 2.0 * scale; hd = 1.8 * scale; break;
        case 'citadel': hw = 14 * scale; hd = 11 * scale; break;
        case 'gate': hw = 3.5 * scale; hd = 12 * scale; break;
        case 'bell': hw = 3.2 * scale; hd = 3.2 * scale; break;
        case 'statue': hw = 2.2 * scale; hd = 2.2 * scale; break;
        case 'shipwreck': hw = 4.6 * scale; hd = 2.4 * scale; break;
        case 'ruin': hw = 5 * scale; hd = 5 * scale; break;
        case 'watchtower': hw = 2.2 * scale; hd = 2.2 * scale; break;
        default: continue;
      }
      this.obstacles.push({ x: lm.x, z: lm.z, hw, hd });
    }
  }

  private attachLandmarkBounds(): void {
    for (const [, entry] of this.landmarks) {
      entry.group.traverse((o) => {
        o.userData.landmark = entry.def.id;
      });
    }
  }

  /* ── Interaction queries ─────────────────────────────────────────────── */

  private pushInteraction(kind: WorldInteraction['kind'], id: string, label: string, position: THREE.Vector3, radius: number, data?: unknown): void {
    this.interactions.push({ kind, id, label, position, radius, data });
  }

  /** Rebuild the interaction list for the current frame's query. */
  refreshInteractions(): void {
    this.interactions.length = 0;
    for (const npc of this.npcs) {
      this.pushInteraction('npc', npc.id, npc.def.name, npc.position, 3.2, npc);
    }
    for (const shrine of this.shrines) {
      this.pushInteraction('shrine', shrine.id, shrine.name, shrine.position, 3.4, shrine);
    }
    for (const c of this.collectibles) {
      if (c.taken) continue;
      this.pushInteraction('collectible', c.def.id, c.def.name ?? 'Unknown light', c.position, 2.4, c);
    }
    for (const s of this.secrets) {
      if (s.found) continue;
      this.pushInteraction('secret', s.def.id, s.def.name, s.position, s.def.radius, s);
    }
    for (const g of this.grapples) {
      this.pushInteraction('grapple', g.id, 'Grapple', g.position, 4.2, g);
    }
  }

  /** Nearest interaction within its reach of a point. */
  nearestInteraction(x: number, z: number): WorldInteraction | null {
    this.refreshInteractions();
    let best: WorldInteraction | null = null;
    let bestDist = Infinity;
    for (const it of this.interactions) {
      const dx = it.position.x - x;
      const dz = it.position.z - z;
      const d = Math.hypot(dx, dz);
      if (d <= it.radius && d < bestDist) {
        bestDist = d;
        best = it;
      }
    }
    return best;
  }

  /** Does a named landmark / shrine / secret sit within `radius` of (x,z)? */
  nearNamed(id: string, x: number, z: number, radius = 3.4): boolean {
    const positions = new Map<string, THREE.Vector3>();
    for (const npc of this.npcs) positions.set(npc.id, npc.position);
    for (const s of this.shrines) positions.set(s.id, s.position);
    for (const c of this.collectibles) positions.set(c.def.id, c.position);
    for (const s of this.secrets) positions.set(s.def.id, s.position);
    for (const [lmId, entry] of this.landmarks) positions.set(lmId, entry.group.position);
    const p = positions.get(id);
    if (!p) return false;
    return Math.hypot(p.x - x, p.z - z) <= radius;
  }

  /** Collect a collectible; returns what the game should grant. */
  takeCollectible(id: string): { kind: string; item?: string; amount?: number; codex?: string; name: string } | null {
    const c = this.collectibles.find((x) => x.def.id === id);
    if (!c || c.taken) return null;
    c.taken = true;
    c.mesh.visible = false;
    this.events.emit('world:pickup', {
      name: c.def.name ?? 'Unknown light',
      item: c.def.item,
      count: c.def.amount ?? 1,
    });
    return { kind: c.def.kind, item: c.def.item, amount: c.def.amount, codex: c.def.codex, name: c.def.name ?? 'Unknown light' };
  }

  /** Reveal a secret and return its reward. */
  takeSecret(id: string): { def: SecretDef; reward?: { item?: string; count?: number; essence?: number; xp?: number } } | null {
    const s = this.secrets.find((x) => x.def.id === id);
    if (!s || s.found) return null;
    s.found = true;
    this.events.emit('world:secret', { name: s.def.name, id: s.def.id });
    return { def: s.def, reward: s.def.reward };
  }

  /** Check arena triggers. Returns the arena whose floor the player has entered. */
  checkArenaTriggers(x: number, z: number): ArenaTrigger | null {
    for (const arena of this.arenas) {
      if (arena.triggered) continue;
      const d = Math.hypot(x - arena.x, z - arena.z);
      if (d <= arena.radius) {
        arena.triggered = true;
        return arena;
      }
    }
    return null;
  }

  /** Push a position out of solid landmark bounds. Returns true if moved. */
  resolveObstacle(pos: THREE.Vector3, radius = 0.6): boolean {
    let moved = false;
    for (const o of this.obstacles) {
      const dx = pos.x - o.x;
      const dz = pos.z - o.z;
      const hw = o.hw + radius;
      const hd = o.hd + radius;
      if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
        const px = hw - Math.abs(dx);
        const pz = hd - Math.abs(dz);
        if (px < pz) {
          pos.x += Math.sign(dx) * px;
        } else {
          pos.z += Math.sign(dz) * pz;
        }
        moved = true;
      }
    }
    return moved;
  }

  /* ── Update ──────────────────────────────────────────────────────────── */

  update(dt: number, time: number, playerPos: THREE.Vector3, walkable: (x: number, z: number) => boolean): void {
    this.time += dt;
    if (this.waterMat) this.waterMat.uniforms.uTime.value = time;
    for (const a of this.animated) {
      const k = 0.5 + 0.5 * Math.sin(time * a.speed + a.phase);
      a.object.position.y = (a.object.position.y - a.amp) + k * a.amp * 2;
      const mat = (a.object as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
      if (mat && 'opacity' in mat && mat.blending === THREE.AdditiveBlending) {
        mat.opacity = 0.35 + k * 0.35;
      }
    }
    for (const npc of this.npcs) {
      npc.rig.update(dt, time, { speed: 0 });
    }
    // Keep the contact list honest for the UI.
    this.refreshInteractions();
    void walkable;
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.group);
    for (const npc of this.npcs) npc.rig.dispose();
    this.group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry && !mesh.geometry.userData.shared) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat && !mat.userData?.shared) mat.dispose();
    });
  }
}
