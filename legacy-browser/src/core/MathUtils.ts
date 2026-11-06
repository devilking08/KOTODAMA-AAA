/** Deterministic math helpers used by terrain, combat, AI and tests. */

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);
export const saturate = (v: number) => clamp(v, 0, 1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => (a === b ? 0 : (v - a) / (b - a));
export const remap = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  lerp(outMin, outMax, saturate(invLerp(inMin, inMax, v)));

export const smoothstep = (a: number, b: number, v: number) => {
  const t = saturate(invLerp(a, b, v));
  return t * t * (3 - 2 * t);
};
export const smootherstep = (a: number, b: number, v: number) => {
  const t = saturate(invLerp(a, b, v));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** Frame-rate independent exponential smoothing. */
export const damp = (a: number, b: number, lambda: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-lambda * dt));

export const moveTowards = (current: number, target: number, maxDelta: number) => {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
};

/** Signed shortest distance from angle a to angle b, in (-PI, PI]. */
export const angleDelta = (a: number, b: number) => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};

export const angleLerp = (a: number, b: number, t: number) => a + angleDelta(a, b) * saturate(t);

export const dampAngle = (a: number, b: number, lambda: number, dt: number) =>
  angleLerp(a, b, 1 - Math.exp(-lambda * dt));

export const wrapAngle = (a: number) => {
  let x = a % TAU;
  if (x > Math.PI) x -= TAU;
  if (x < -Math.PI) x += TAU;
  return x;
};

export const easeInQuad = (t: number) => t * t;
export const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
export const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeOutElastic = (t: number) => {
  if (t === 0 || t === 1) return t;
  const c4 = TAU / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/** Mulberry32 — small, fast, deterministic. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hash2i(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in [0, 1]. */
export function valueNoise2D(x: number, y: number, seed = 1337): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2i(xi, yi, seed);
  const b = hash2i(xi + 1, yi, seed);
  const c = hash2i(xi, yi + 1, seed);
  const d = hash2i(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

export interface FbmOptions {
  octaves?: number;
  lacunarity?: number;
  gain?: number;
  seed?: number;
}

export function fbm2D(x: number, y: number, options: FbmOptions = {}): number {
  const { octaves = 4, lacunarity = 2.0, gain = 0.5, seed = 1337 } = options;
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * freq, y * freq, seed + i * 101) * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/** Ridged multifractal in [0,1], good for mountain silhouettes. */
export function ridged2D(x: number, y: number, options: FbmOptions = {}): number {
  const { octaves = 4, lacunarity = 2.0, gain = 0.5, seed = 1337 } = options;
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = valueNoise2D(x * freq, y * freq, seed + i * 167);
    const ridge = 1 - Math.abs(n * 2 - 1);
    sum += ridge * ridge * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

export function gaussianNoise(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

export function distance2D(ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  return Math.sqrt(dx * dx + dz * dz);
}

export function distanceSq2D(ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  return dx * dx + dz * dz;
}

export function pointInArc(
  originX: number,
  originZ: number,
  facing: number,
  targetX: number,
  targetZ: number,
  range: number,
  arc: number,
): boolean {
  const dx = targetX - originX;
  const dz = targetZ - originZ;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > range) return false;
  if (dist < 0.001) return true;
  const angle = Math.atan2(dx, dz);
  return Math.abs(angleDelta(facing, angle)) <= arc * 0.5;
}

export function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export function lerpHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const to = (v: number) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0');
  return `#${to(lerp(ca.r, cb.r, t))}${to(lerp(ca.g, cb.g, t))}${to(lerp(ca.b, cb.b, t))}`;
}

export function formatPlaytime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m`;
}

export function formatNumber(n: number): string {
  return Math.floor(n).toLocaleString('en-US');
}

/** Deterministic 32-bit hash for shaders / geometry variation. */
export function hash1(n: number): number {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = x ^ (x >>> 16);
  return (x >>> 0) / 4294967296;
}

export class SeededRandom {
  private fn: () => number;

  constructor(seed: number | string) {
    this.fn = mulberry32(typeof seed === 'string' ? hashString(seed) : seed);
  }

  next(): number {
    return this.fn();
  }

  range(min: number, max: number): number {
    return min + this.fn() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.fn() * arr.length)] ?? arr[0];
  }

  chance(probability: number): boolean {
    return this.fn() < probability;
  }

  gaussian(): number {
    return gaussianNoise(this.fn);
  }

  shuffle<T>(arr: T[]): T[] {
    return seededShuffle(arr, this.fn);
  }

  sign(): number {
    return this.fn() < 0.5 ? -1 : 1;
  }
}
