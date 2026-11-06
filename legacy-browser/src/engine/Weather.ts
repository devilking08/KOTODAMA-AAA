import * as THREE from 'three';
import type { ParticleKind, WeatherKind } from '../types';
import { SeededRandom } from '../core/MathUtils';

const PARTICLE_VERT = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uWind;
  uniform float uMode;
  uniform float uSize;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec3 p = position;
    float s = aSeed;
    if (uMode < 0.5) {
      // snow
      p.y = mod(p.y - uTime * uSpeed * (0.55 + s * 0.7), 58.0) - 8.0;
      p.x += sin(uTime * 0.6 + s * 21.0) * 2.6 + uTime * uWind * 1.2;
      p.z += cos(uTime * 0.44 + s * 13.0) * 1.8;
      vAlpha = 0.55 + s * 0.45;
    } else if (uMode < 1.5) {
      // sand
      p.y = mod(p.y - uTime * uSpeed * (0.4 + s * 0.4), 44.0) - 5.0;
      p.x = mod(p.x + uTime * uSpeed * (2.2 + s * 2.6) + uWind * uTime * 4.0, 110.0) - 55.0;
      p.z += sin(uTime * 0.8 + s * 9.0) * 2.0;
      vAlpha = 0.22 + s * 0.38;
    } else if (uMode < 2.5) {
      // rain
      p.y = mod(p.y - uTime * uSpeed * (1.4 + s), 55.0) - 6.0;
      p.x += uWind * uTime * 2.0;
      vAlpha = 0.25 + s * 0.3;
    } else if (uMode < 3.5) {
      // petals
      p.y = mod(p.y - uTime * uSpeed * (0.18 + s * 0.25), 30.0) + 1.0;
      p.x += sin(uTime * 0.8 + s * 17.0) * 4.5;
      p.z += cos(uTime * 0.65 + s * 12.0) * 4.0;
      vAlpha = 0.6 + s * 0.4;
    } else if (uMode < 4.5) {
      // ash / embers
      p.y = mod(p.y + uTime * uSpeed * (0.2 + s * 0.45), 34.0) - 2.0;
      p.x += sin(uTime * 0.4 + s * 12.0) * 3.2;
      vAlpha = 0.35 + s * 0.5;
    } else if (uMode < 5.5) {
      // fireflies
      p.y = abs(sin(uTime * 0.5 + s * 20.0)) * 3.0 + 0.8;
      p.x += sin(uTime * 0.33 + s * 9.0) * 3.0;
      p.z += cos(uTime * 0.41 + s * 14.0) * 3.0;
      vAlpha = 0.35 + 0.65 * max(0.0, sin(uTime * 1.6 + s * 30.0));
    } else {
      // spray
      p.y = mod(p.y + uTime * uSpeed * 0.8, 14.0);
      p.x += sin(uTime + s * 12.0) * 2.0;
      vAlpha = 0.18 + s * 0.25;
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float sizeScale = (uMode > 1.5 && uMode < 2.5) ? 0.45 : 1.0;
    gl_PointSize = uSize * sizeScale * (120.0 / max(1.0, -mv.z)) * (0.6 + s * 0.8);
    vSeed = s;
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.08, d) * vAlpha * uOpacity;
    gl_FragColor = vec4(uColor * (0.8 + vSeed * 0.4), a);
  }
`;

const MODES: Record<Exclude<ParticleKind, 'none'>, number> = {
  snow: 0,
  sand: 1,
  rain: 2,
  petal: 3,
  ash: 4,
  firefly: 5,
  spray: 6,
  ember: 4,
};

const COLORS: Record<ParticleKind, string> = {
  snow: '#f4f8ff',
  sand: '#e8c88a',
  rain: '#bcd6e8',
  petal: '#ffc6d6',
  ash: '#d8c8b8',
  firefly: '#ffe9a0',
  spray: '#cfe6ea',
  ember: '#ff9a50',
  none: '#ffffff',
};

/**
 * Screen-space weather that travels with the player. One Points draw call per
 * region, no per-frame allocation, deterministic placement.
 */
export class Weather {
  readonly points: THREE.Points;
  private readonly mat: THREE.ShaderMaterial;
  private readonly light: THREE.PointLight;
  private flashTimer = 4;
  private kind: ParticleKind;
  private readonly rng: SeededRandom;

  constructor(
    private readonly scene: THREE.Scene,
    kind: ParticleKind,
    weather: WeatherKind,
    wind: number,
    count = 1150,
  ) {
    this.kind = kind;
    this.rng = new SeededRandom(4711);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = this.rng.range(-55, 55);
      positions[i * 3 + 1] = this.rng.range(-8, 50);
      positions[i * 3 + 2] = this.rng.range(-55, 55);
      seeds[i] = this.rng.next();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    this.mat = new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: kind === 'firefly' || kind === 'ember' ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: kind === 'rain' ? 22 : kind === 'sand' ? 5 : kind === 'snow' ? 1.8 : 0.5 },
        uWind: { value: wind },
        uMode: { value: MODES[kind as Exclude<ParticleKind, 'none'>] ?? 0 },
        uSize: { value: kind === 'rain' ? 2.2 : kind === 'snow' ? 4 : kind === 'petal' ? 4.4 : kind === 'sand' ? 2.9 : 3.2 },
        uColor: { value: new THREE.Color(COLORS[kind] ?? '#ffffff') },
        uOpacity: { value: kind === 'rain' ? 0.55 : kind === 'sand' ? 0.5 : kind === 'snow' ? 0.72 : kind === 'petal' ? 0.6 : kind === 'ash' ? 0.7 : 0.75 },
      },
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.scene.add(this.points);

    this.light = new THREE.PointLight('#dce6ff', 0, 90, 2);
    this.light.position.set(0, 44, 0);
    this.scene.add(this.light);
    if (weather !== 'storm') this.flashTimer = 9999;
  }

  update(dt: number, time: number, player: THREE.Vector3): void {
    this.mat.uniforms.uTime.value = time;
    this.points.position.set(player.x, player.y, player.z);
    if (this.kind === 'firefly') this.points.position.y = Math.max(player.y - 1, 0);

    if (this.flashTimer < 9000) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.flashTimer = 3.5 + this.rng.range(0, 5);
        this.light.intensity = 8;
        this.light.position.set(player.x + this.rng.range(-30, 30), 50, player.z + this.rng.range(-30, 30));
      }
      this.light.intensity = Math.max(0, this.light.intensity - dt * 40);
    }
  }

  setWind(wind: number): void {
    this.mat.uniforms.uWind.value = wind;
  }

  dispose(): void {
    this.scene.remove(this.points);
    this.scene.remove(this.light);
    this.points.geometry.dispose();
    this.mat.dispose();
  }
}
