import * as THREE from 'three';
import {
  clamp,
  fbm2D,
  lerp,
  ridged2D,
  smoothstep,
} from '../core/MathUtils';
import type { LandmarkDef, RegionDef, TerrainConfig } from '../types';
import { getGradientMap } from './Visuals';

/**
 * Deterministic heightfield terrain.
 *
 * The mesh and the collision sampler are the *same* data, so the player never
 * floats or sinks. Landmark pads are flattened after the raw field is
 * generated; flattening is applied largest-first so nested landmarks (a house
 * inside a village) sit on the updated plateau rather than the original slope.
 */
export class Terrain {
  readonly config: TerrainConfig;
  readonly size: number;
  readonly half: number;
  readonly segments: number;
  readonly step: number;
  readonly heights: Float32Array;
  readonly mesh: THREE.Mesh;
  private readonly n: number;
  private readonly theme: RegionDef['theme'];

  constructor(region: RegionDef) {
    this.config = region.terrain;
    this.theme = region.theme;
    this.size = this.config.size;
    this.half = this.size / 2;
    this.segments = this.config.segments;
    this.n = this.segments + 1;
    this.step = this.size / this.segments;
    this.heights = new Float32Array(this.n * this.n);

    for (let j = 0; j < this.n; j++) {
      for (let i = 0; i < this.n; i++) {
        const x = -this.half + i * this.step;
        const z = -this.half + j * this.step;
        this.heights[j * this.n + i] = this.rawHeight(x, z);
      }
    }

    const pads = region.landmarks
      .filter((l) => l.flatten && l.flatten > 0)
      .sort((a, b) => (b.flatten ?? 0) - (a.flatten ?? 0));
    for (const pad of pads) this.flatten(pad);

    this.mesh = this.buildMesh();
  }

  /** Raw procedural height before landmark pads. */
  private rawHeight(x: number, z: number): number {
    const c = this.config;
    const s = 1 / 210;
    const wx = x * s + fbm2D(x * s * 0.55, z * s * 0.55, { seed: c.seed + 7 }) * (c.warp / 210);
    const wz = z * s + fbm2D(x * s * 0.55 + 4.7, z * s * 0.55 + 2.3, { seed: c.seed + 11 }) * (c.warp / 210);
    const base = (fbm2D(wx, wz, { octaves: 5, seed: c.seed }) - 0.5) * c.amplitude * 2;
    const ridge = ridged2D(x * s * 1.5, z * s * 1.5, { octaves: 4, seed: c.seed + 31 }) * c.ridges;
    let h = base + ridge * 0.55 + 6;
    const r = Math.hypot(x, z) / this.half;
    const zn = (z + this.half) / this.size;
    const xn = (x + this.half) / this.size;

    switch (c.shape) {
      case 'coast': {
        if (c.falloff === 'radial') {
          h -= smoothstep(0.38, 0.95, r) * 58;
          h += (1 - smoothstep(0, 0.45, r)) * 8;
        } else if (c.falloff === 'south') {
          h -= smoothstep(0.55, 1.0, zn) * 62;
          h += 4 * (1 - zn);
        } else if (c.falloff === 'north') {
          h -= smoothstep(0.55, 1.0, 1 - zn) * 62;
        } else if (c.falloff === 'east') {
          h -= smoothstep(0.55, 1.0, xn) * 62;
        } else if (c.falloff === 'west') {
          h -= smoothstep(0.55, 1.0, 1 - xn) * 62;
        }
        h += Math.sin(x * 0.018 + z * 0.012) * 1.8;
        break;
      }
      case 'alpine': {
        const ridgeLine = smoothstep(0.2, 0.9, 1 - zn);
        h += ridgeLine * c.ridges * 0.7;
        h -= smoothstep(0.72, 1, zn) * 30;
        h += ridged2D(x * 0.012, z * 0.012, { octaves: 3, seed: c.seed + 91 }) * 16;
        break;
      }
      case 'dunes': {
        const dune = Math.sin(x * 0.028 + Math.sin(z * 0.011) * 2.4) * 0.5 + 0.5;
        const dune2 = Math.sin(z * 0.021 + x * 0.006) * 0.5 + 0.5;
        h = 6 + dune * c.amplitude * 0.75 + dune2 * c.amplitude * 0.45 + base * 0.4;
        h += ridged2D(x * 0.009, z * 0.009, { octaves: 2, seed: c.seed + 5 }) * 10;
        break;
      }
      case 'vale': {
        h = 10 + base * 0.55 + ridge * 0.7;
        const valley = Math.exp(-Math.pow(x / 120, 2)) * 9;
        h -= valley;
        h += smoothstep(0.42, 0.95, r) * 42;
        break;
      }
      case 'volcano': {
        h = 7 + (1 - smoothstep(0, 0.85, r)) * 58;
        h += ridged2D(x * 0.012, z * 0.012, { octaves: 4, seed: c.seed + 67 }) * 18;
        h -= base * 0.25;
        break;
      }
      default:
        break;
    }

    // A soft rim keeps the playable field from ending in a visible mesh edge.
    h += smoothstep(0.82, 1.0, r) * 22;
    return h;
  }

  private flatten(l: LandmarkDef): void {
    const radius = l.flatten ?? 0;
    if (radius <= 0) return;
    const padHeight = l.padHeight ?? this.heightAt(l.x, l.z);
    const inner = radius * 0.35;
    const i0 = Math.max(0, Math.floor((l.x - radius + this.half) / this.step));
    const i1 = Math.min(this.n - 1, Math.ceil((l.x + radius + this.half) / this.step));
    const j0 = Math.max(0, Math.floor((l.z - radius + this.half) / this.step));
    const j1 = Math.min(this.n - 1, Math.ceil((l.z + radius + this.half) / this.step));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const x = -this.half + i * this.step;
        const z = -this.half + j * this.step;
        const dist = Math.hypot(x - l.x, z - l.z);
        if (dist > radius) continue;
        const w = 1 - smoothstep(inner, radius, dist);
        const idx = j * this.n + i;
        this.heights[idx] = lerp(this.heights[idx], padHeight, w);
      }
    }
  }

  heightAt(x: number, z: number): number {
    const gx = clamp((x + this.half) / this.step, 0, this.segments - 0.0001);
    const gz = clamp((z + this.half) / this.step, 0, this.segments - 0.0001);
    const i = Math.floor(gx);
    const j = Math.floor(gz);
    const tx = gx - i;
    const tz = gz - j;
    const a = this.heights[j * this.n + i];
    const b = this.heights[j * this.n + i + 1];
    const c = this.heights[(j + 1) * this.n + i];
    const d = this.heights[(j + 1) * this.n + i + 1];
    return lerp(lerp(a, b, tx), lerp(c, d, tx), tz);
  }

  normalAt(x: number, z: number): THREE.Vector3 {
    const e = 1.1;
    const hl = this.heightAt(x - e, z);
    const hr = this.heightAt(x + e, z);
    const hd = this.heightAt(x, z - e);
    const hu = this.heightAt(x, z + e);
    return new THREE.Vector3(hl - hr, e * 2, hd - hu).normalize();
  }

  slopeAt(x: number, z: number): number {
    const n = this.normalAt(x, z);
    return 1 - n.y;
  }

  inBounds(x: number, z: number, margin = 6): boolean {
    return Math.abs(x) < this.half - margin && Math.abs(z) < this.half - margin;
  }

  get waterLevel(): number | null {
    return this.config.waterLevel;
  }

  get lavaLevel(): number | null {
    return this.config.lavaLevel;
  }

  isUnderWater(x: number, z: number): boolean {
    return this.config.waterLevel !== null && this.heightAt(x, z) < this.config.waterLevel - 0.2;
  }

  private buildMesh(): THREE.Mesh {
    const n = this.n;
    const positions = new Float32Array(n * n * 3);
    const colors = new Float32Array(n * n * 3);
    const indices = new Uint32Array(this.segments * this.segments * 6);
    const low = new THREE.Color(this.theme.groundLow);
    const mid = new THREE.Color(this.theme.groundMid);
    const high = new THREE.Color(this.theme.groundHigh);
    const rock = new THREE.Color(this.theme.rock);
    const snow = new THREE.Color(this.theme.groundHigh);
    const tmp = new THREE.Color();

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const idx = j * n + i;
        const x = -this.half + i * this.step;
        const z = -this.half + j * this.step;
        const h = this.heights[idx];
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = h;
        positions[idx * 3 + 2] = z;

        const rel = clamp((h + 8) / 48, 0, 1);
        const grain = fbm2D(x * 0.04, z * 0.04, { octaves: 2, seed: this.config.seed + 3 });
        tmp.copy(low).lerp(mid, clamp(rel * 1.4, 0, 1));
        tmp.lerp(high, clamp((rel - 0.35) * 1.8, 0, 1));
        tmp.lerp(rock, clamp(this.slopeAt(x, z) * 2.2, 0, 0.85));
        if (this.config.snowLine !== undefined) {
          tmp.lerp(snow, smoothstep(this.config.snowLine, this.config.snowLine + 18, h) * 0.85);
        }
        tmp.multiplyScalar(0.9 + grain * 0.2);
        colors[idx * 3] = tmp.r;
        colors[idx * 3 + 1] = tmp.g;
        colors[idx * 3 + 2] = tmp.b;
      }
    }

    let o = 0;
    for (let j = 0; j < this.segments; j++) {
      for (let i = 0; i < this.segments; i++) {
        const a = j * n + i;
        const b = a + 1;
        const c = a + n;
        const d = c + 1;
        indices[o++] = a; indices[o++] = c; indices[o++] = b;
        indices[o++] = b; indices[o++] = c; indices[o++] = d;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();

    const mat = new THREE.MeshToonMaterial({
      vertexColors: true,
      gradientMap: getGradientMap(),
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.name = 'terrain';
    return mesh;
  }
}
