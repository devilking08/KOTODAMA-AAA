import * as THREE from 'three';
import { clamp } from '../core/MathUtils';
import type { AoeSpec, ProjectileSpec, Vec3Data } from '../types';

/**
 * Combat and world effects.
 *
 * Everything here is procedural, pooled by hand and capped so a long boss
 * fight never leaks. Effects are intentionally *readable*: a gold ring means a
 * sweep, a red fan means perilous, a white flash means a parry. The same
 * language is used by the player's blade and every enemy telegraph.
 */

export interface Projectile {
  id: number;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  life: number;
  maxLife: number;
  damage: number;
  owner: 'enemy' | 'player';
  sourceId: string;
  damageType: string;
  hit: boolean;
}

export interface Hazard {
  id: number;
  position: THREE.Vector3;
  radius: number;
  remaining: number;
  tick: number;
  dps: number;
  damageType: string;
  sourceId: string;
  mesh: THREE.Mesh;
}

interface Timed {
  object: THREE.Object3D;
  life: number;
  maxLife: number;
  kind: 'fade' | 'expand' | 'rise' | 'tumble';
  fromScale: number;
  toScale: number;
  velocity?: THREE.Vector3;
  spin?: number;
  onDone?: () => void;
}

interface PendingAoe {
  position: THREE.Vector3;
  radius: number;
  remaining: number;
  delay: number;
  color: string;
  ring: THREE.Mesh;
  fill: THREE.Mesh;
  onImpact: () => void;
}

interface Burst {
  points: THREE.Points;
  velocities: Float32Array;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
}

const MAX_TIMED = 120;
const MAX_PROJECTILES = 48;
const MAX_HAZARDS = 18;
const MAX_BURSTS = 36;

let effectId = 1;

export class Effects {
  readonly root = new THREE.Group();
  readonly projectiles: Projectile[] = [];
  readonly hazards: Hazard[] = [];
  private timed: Timed[] = [];
  private pendingAoes: PendingAoe[] = [];
  private bursts: Burst[] = [];
  private time = 0;
  private trail: THREE.Mesh;
  private trailPositions!: Float32Array;
  private trailAlpha!: Float32Array;
  private trailHistory: Array<{ tip: THREE.Vector3; base: THREE.Vector3; age: number }> = [];
  private readonly trailSegments = 32;
  private trailActive = false;
  private scratch = new THREE.Vector3();

  constructor(private readonly scene: THREE.Scene) {
    this.root.name = 'effects';
    scene.add(this.root);
    this.trail = this.buildTrail();
    this.root.add(this.trail);
  }

  /* ── Sword trail ─────────────────────────────────────────────────────── */

  private buildTrail(): THREE.Mesh {
    const segments = this.trailSegments;
    const geo = new THREE.BufferGeometry();
    this.trailPositions = new Float32Array(segments * 2 * 3);
    this.trailAlpha = new Float32Array(segments * 2);
    geo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.trailAlpha, 1));
    const indices: number[] = [];
    for (let i = 0; i < segments - 1; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setIndex(indices);
    geo.setDrawRange(0, 0);

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color('#d9e8ff') }, uOpacity: { value: 0.95 } },
      vertexShader: /* glsl */ `
        attribute float aAlpha;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          if (vAlpha <= 0.001) discard;
          gl_FragColor = vec4(uColor, vAlpha * uOpacity);
        }
      `,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 6;
    return mesh;
  }

  /**
   * Push the current weapon edge into the ribbon. `active` is the player's
   * hit window; outside it the trail fades rather than snapping off.
   */
  updateTrail(tip: THREE.Vector3, base: THREE.Vector3, active: boolean, color?: string): void {
    this.trailActive = active;
    for (const p of this.trailHistory) p.age += 1 / 60;
    if (active) {
      this.trailHistory.unshift({ tip: tip.clone(), base: base.clone(), age: 0 });
      if (color) {
        // Warm the trail away from white ambient particles so it reads as
        // its own element rather than another snowflake.
        const c = new THREE.Color(color).lerp(new THREE.Color('#ffb36a'), 0.5);
        (this.trail.material as THREE.ShaderMaterial).uniforms.uColor.value.set(c);
      }
    }
    while (this.trailHistory.length > this.trailSegments) this.trailHistory.pop();

    const segments = this.trailSegments;
    const pos = this.trailPositions;
    const alpha = this.trailAlpha;
    let count = 0;
    for (let i = 0; i < segments; i++) {
      const p = this.trailHistory[i];
      if (!p) {
        alpha[i * 2] = 0;
        alpha[i * 2 + 1] = 0;
        continue;
      }
      const fade = Math.pow(clamp(1 - p.age / 0.42, 0, 1), 1.5);
      // widen the base as it ages for a tapered brush-stroke silhouette;
      // the ribbon blooms wider while a swing is actively underway
      const spread = (1 + p.age * 3.4) * (active ? 2.4 : 1);
      pos[i * 6] = p.tip.x;
      pos[i * 6 + 1] = p.tip.y;
      pos[i * 6 + 2] = p.tip.z;
      pos[i * 6 + 3] = p.base.x + (p.base.x - p.tip.x) * 0.06 * spread;
      pos[i * 6 + 4] = p.base.y;
      pos[i * 6 + 5] = p.base.z + (p.base.z - p.tip.z) * 0.06 * spread;
      alpha[i * 2] = fade;
      alpha[i * 2 + 1] = fade * 0.16;
      count = i + 1;
    }
    const geo = this.trail.geometry as THREE.BufferGeometry;
    geo.setDrawRange(0, Math.max(0, (count - 1) * 6));
    (geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true;
    if (!this.trailActive && this.trailHistory.length) {
      this.trailHistory.forEach((p) => (p.age += 1 / 60));
    }
  }

  /* ── Sparks / dust / blood ────────────────────────────────────────────── */

  spark(position: Vec3Data | THREE.Vector3, color = '#ffe0a0', count = 14, speed = 5): void {
    this.burst(position, color, count, speed, 0.45, 7, 0.92, 0.055);
  }

  blood(position: Vec3Data | THREE.Vector3, color = '#a8322a', count = 10): void {
    this.burst(position, color, count, 3.4, 0.6, 11, 0.9, 0.05);
  }

  dust(position: Vec3Data | THREE.Vector3, color = '#c9bfa8', count = 8): void {
    this.burst(position, color, count, 1.4, 0.8, -0.5, 0.88, 0.09);
  }

  deathDissolve(position: Vec3Data | THREE.Vector3, color = '#d8c8b8'): void {
    this.burst(position, color, 34, 2.2, 1.4, -1.1, 0.94, 0.1);
    this.ring(position, 1.6, color, 0.7);
  }

  private burst(
    position: Vec3Data | THREE.Vector3,
    color: string,
    count: number,
    speed: number,
    life: number,
    gravity: number,
    drag: number,
    size: number,
  ): void {
    if (this.bursts.length >= MAX_BURSTS) this.removeBurst(0);
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const p = position instanceof THREE.Vector3 ? position : new THREE.Vector3(position.x, position.y, position.z);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const s = speed * (0.35 + Math.random() * 0.85);
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * s;
      velocities[i * 3 + 1] = Math.abs(Math.cos(phi)) * s * 0.9 + 0.6;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * s;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    this.root.add(points);
    this.bursts.push({ points, velocities, life, maxLife: life, gravity, drag });
    this.time = this.time;
    void this.time;
  }

  private removeBurst(index: number): void {
    const b = this.bursts[index];
    this.root.remove(b.points);
    b.points.geometry.dispose();
    (b.points.material as THREE.Material).dispose();
    this.bursts.splice(index, 1);
  }

  /* ── Rings / shockwaves ───────────────────────────────────────────────── */

  ring(position: Vec3Data | THREE.Vector3, radius: number, color = '#ffffff', life = 0.5, thickness = 0.15): void {
    const p = position instanceof THREE.Vector3 ? position : new THREE.Vector3(position.x, position.y, position.z);
    const geo = new THREE.RingGeometry(radius * (1 - thickness), radius, 40);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(p.x, p.y + 0.05, p.z);
    this.root.add(mesh);
    this.timed.push({ object: mesh, life, maxLife: life, kind: 'expand', fromScale: 0.35, toScale: 1.35 });
  }

  /** A flat arc in the XZ plane, used for the player's strike. */
  slashArc(position: Vec3Data | THREE.Vector3, yaw: number, range: number, arc: number, color = '#e8f0ff'): void {
    const p = position instanceof THREE.Vector3 ? position : new THREE.Vector3(position.x, position.y, position.z);
    const segments = 18;
    const build = (ro: number, ri: number, fill: string, opacity: number, order: number): THREE.Mesh => {
      const positions: number[] = [0, 0, 0];
      for (let i = 0; i <= segments; i++) {
        const a = yaw - arc / 2 + (arc * i) / segments;
        positions.push(Math.sin(a) * ro, 0, Math.cos(a) * ro);
        positions.push(Math.sin(a) * ri, 0, Math.cos(a) * ri);
      }
      const indices: number[] = [];
      for (let i = 0; i <= segments; i++) indices.push(0, i * 2 + 1, i * 2 + 2);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      const mat = new THREE.MeshBasicMaterial({
        color: fill,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x, p.y + 1.0, p.z);
      mesh.renderOrder = order;
      return mesh;
    };
    // Dark rim grounds the arc against bright skies; light core carries it.
    const rim = build(range * 1.05, range * 0.72, '#2a1812', 0.4, 6);
    const core = build(range * 0.9, range * 0.2, color, 0.4, 7);
    this.root.add(rim);
    this.root.add(core);
    this.timed.push({ object: rim, life: 0.16, maxLife: 0.16, kind: 'fade', fromScale: 1, toScale: 1.06 });
    this.timed.push({ object: core, life: 0.18, maxLife: 0.18, kind: 'fade', fromScale: 1, toScale: 1.06 });
  }

  /* ── Enemy telegraphs and area attacks ────────────────────────────────── */

  spawnAoe(
    position: Vec3Data | THREE.Vector3,
    spec: AoeSpec,
    onImpact: () => void,
  ): void {
    const p = position instanceof THREE.Vector3 ? position.clone() : new THREE.Vector3(position.x, position.y, position.z);
    const color = spec.color ?? '#ff5a3c';
    const ringGeo = new THREE.RingGeometry(spec.radius * 0.93, spec.radius, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.x, p.y + 0.06, p.z);
    this.root.add(ring);

    const fillGeo = new THREE.CircleGeometry(spec.radius, 48);
    const fillMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const fill = new THREE.Mesh(fillGeo, fillMat);
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(p.x, p.y + 0.05, p.z);
    this.root.add(fill);

    this.pendingAoes.push({
      position: p,
      radius: spec.radius,
      remaining: spec.delay,
      delay: spec.delay,
      color,
      ring,
      fill,
      onImpact,
    });
  }

  /**
   * A ghost afterimage of the blade at an instant of the swing — a tall,
   * warm-tinted sliver oriented along the swing direction, so from behind
   * it reads as an angled blade streak rather than an edge-on ribbon.
   */
  afterImage(position: Vec3Data | THREE.Vector3, yaw: number, bladeLen: number, color: string, opacity: number, liftY = 0): void {
    const p = position instanceof THREE.Vector3 ? position : new THREE.Vector3(position.x, position.y, position.z);
    const geo = new THREE.BoxGeometry(0.09, 1.25, bladeLen);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: clamp(opacity, 0, 0.75),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(p.x, p.y + liftY, p.z);
    mesh.rotation.y = yaw;
    this.root.add(mesh);
    this.timed.push({ object: mesh, life: 0.17, maxLife: 0.17, kind: 'fade', fromScale: 1, toScale: 0.92 });
  }

  /**
   * A billboarded swing fan: an annular sector drawn in the camera's view
   * plane at spawn time, so it reads as a bright golden motion trail from
   * any angle — even against noisy ambient particles.
   */
  swingFan(center: Vec3Data | THREE.Vector3, yaw: number, range: number, arc: number, color: string, camQuat: THREE.Quaternion, opacity = 0.6): void {
    const p = center instanceof THREE.Vector3 ? center.clone() : new THREE.Vector3(center.x, center.y, center.z);
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(camQuat);
    const x = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    x.sub(n.clone().multiplyScalar(x.dot(n)));
    if (x.lengthSq() < 1e-6) x.set(1, 0, 0);
    x.normalize();
    const y = new THREE.Vector3().crossVectors(n, x).normalize();

    const build = (ri: number, ro: number, fill: string, opacityF: number, scale: number): THREE.Mesh => {
      const segments = 16;
      const half = arc * 0.5;
      const positions: number[] = [];
      for (let s = 0; s <= segments; s++) {
        const a = -half + (arc * s) / segments;
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        positions.push(p.x + x.x * ca * ri + y.x * sa * ri, p.y + x.y * ca * ri + y.y * sa * ri, p.z + x.z * ca * ri + y.z * sa * ri);
        positions.push(p.x + x.x * ca * ro + y.x * sa * ro, p.y + x.y * ca * ro + y.y * sa * ro, p.z + x.z * ca * ro + y.z * sa * ro);
      }
      const indices: number[] = [];
      for (let s = 0; s < segments; s++) {
        const a = s * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      geo.setIndex(indices);
      const mat = new THREE.MeshBasicMaterial({
        color: fill,
        transparent: true,
        opacity: opacityF,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 7;
      return mesh;
    };

    // A dark rim behind a light core keeps the fan readable even against a
    // bright amber sky — the ring separates from ambient particles.
    const rim = build(range * 0.8, range * 1.06, '#2a1812', 0.5, 1.06);
    const core = build(range * 0.35, range * 0.95, color, opacity, 1);
    this.root.add(rim);
    this.root.add(core);
    this.timed.push({ object: rim, life: 0.22, maxLife: 0.22, kind: 'expand', fromScale: 0.8, toScale: 1.08 });
    this.timed.push({ object: core, life: 0.22, maxLife: 0.22, kind: 'expand', fromScale: 0.8, toScale: 1.04 });
  }

  addHazard(position: Vec3Data | THREE.Vector3, radius: number, duration: number, dps: number, color: string, sourceId: string, damageType = 'fire'): void {    if (this.hazards.length >= MAX_HAZARDS) this.removeHazard(0);
    const p = position instanceof THREE.Vector3 ? position.clone() : new THREE.Vector3(position.x, position.y, position.z);
    const geo = new THREE.CircleGeometry(radius, 32);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(p.x, p.y + 0.045, p.z);
    this.root.add(mesh);
    this.hazards.push({
      id: effectId++, mesh, position: p, radius, remaining: duration, tick: 0, dps, damageType, sourceId,
    });
  }

  removeHazard(index: number): void {
    const h = this.hazards[index];
    if (!h) return;
    this.root.remove(h.mesh);
    h.mesh.geometry.dispose();
    (h.mesh.material as THREE.Material).dispose();
    this.hazards.splice(index, 1);
  }

  /* ── Projectiles ──────────────────────────────────────────────────────── */

  spawnProjectile(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    spec: ProjectileSpec,
    damage: number,
    owner: 'enemy' | 'player',
    sourceId: string,
  ): void {
    const count = spec.count ?? 1;
    const baseYaw = Math.atan2(direction.x, direction.z);
    for (let i = 0; i < count; i++) {
      if (this.projectiles.length >= MAX_PROJECTILES) this.removeProjectile(0);
      const spread = spec.spread ?? 0;
      const offset = count > 1 ? (i - (count - 1) / 2) * spread : 0;
      const yaw = baseYaw + offset;
      const dir = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(spec.speed);
      const geo = spec.ring
        ? new THREE.TorusGeometry(spec.radius, spec.radius * 0.22, 5, 12)
        : new THREE.SphereGeometry(spec.radius, 7, 5);
      const mat = new THREE.MeshBasicMaterial({
        color: spec.color ?? '#ffb070',
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(origin);
      mesh.position.y += spec.height ?? 1.2;
      if (spec.ring) mesh.rotation.x = Math.PI / 2;
      this.root.add(mesh);
      this.projectiles.push({
        id: effectId++,
        mesh,
        position: mesh.position.clone(),
        velocity: dir,
        radius: spec.radius,
        life: spec.life,
        maxLife: spec.life,
        damage,
        owner,
        sourceId,
        damageType: spec.damageType ?? 'physical',
        hit: false,
      });
    }
    this.ring(origin, 0.6, spec.color ?? '#ffb070', 0.3, 0.4);
  }

  removeProjectile(index: number): void {
    const p = this.projectiles[index];
    if (!p) return;
    this.spark(p.position, p.damageType === 'frost' ? '#bfe8ff' : '#ffcf9a', 6, 2);
    this.root.remove(p.mesh);
    p.mesh.geometry.dispose();
    (p.mesh.material as THREE.Material).dispose();
    this.projectiles.splice(index, 1);
  }

  /* ── Frame update ─────────────────────────────────────────────────────── */

  update(dt: number): void {
    this.time += dt;

    // Timed one-shots.
    for (let i = this.timed.length - 1; i >= 0; i--) {
      const t = this.timed[i];
      t.life -= dt;
      const k = clamp(1 - t.life / t.maxLife, 0, 1);
      if (t.kind === 'fade') {
        t.object.scale.setScalar(t.fromScale + (t.toScale - t.fromScale) * k);
        const mesh = t.object as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - k) * 0.7;
      } else if (t.kind === 'expand') {
        t.object.scale.setScalar(t.fromScale + (t.toScale - t.fromScale) * k);
        const mesh = t.object as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = (1 - k) * 0.9;
      }
      if (t.life <= 0) {
        this.root.remove(t.object);
        const mesh = t.object as THREE.Mesh;
        mesh.geometry?.dispose();
        (mesh.material as THREE.Material)?.dispose();
        this.timed.splice(i, 1);
        t.onDone?.();
      }
    }

    // Particle bursts.
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.life -= dt;
      const pos = b.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const damp = Math.pow(b.drag, dt * 60);
      for (let j = 0; j < arr.length / 3; j++) {
        b.velocities[j * 3] *= damp;
        b.velocities[j * 3 + 1] = b.velocities[j * 3 + 1] * damp - b.gravity * dt;
        b.velocities[j * 3 + 2] *= damp;
        arr[j * 3] += b.velocities[j * 3] * dt;
        arr[j * 3 + 1] += b.velocities[j * 3 + 1] * dt;
        arr[j * 3 + 2] += b.velocities[j * 3 + 2] * dt;
      }
      pos.needsUpdate = true;
      const mat = b.points.material as THREE.PointsMaterial;
      mat.opacity = clamp(b.life / b.maxLife, 0, 1) * 0.95;
      if (b.life <= 0) this.removeBurst(i);
    }

    // AOE telegraphs.
    for (let i = this.pendingAoes.length - 1; i >= 0; i--) {
      const a = this.pendingAoes[i];
      a.remaining -= dt;
      const k = clamp(1 - a.remaining / Math.max(0.001, a.delay), 0, 1);
      const ringMat = a.ring.material as THREE.MeshBasicMaterial;
      const fillMat = a.fill.material as THREE.MeshBasicMaterial;
      ringMat.opacity = 0.35 + k * 0.55;
      fillMat.opacity = 0.08 + k * 0.2;
      a.fill.scale.setScalar(0.92 + k * 0.08);
      if (a.remaining <= 0) {
        this.ring(a.position, a.radius, a.color, 0.55, 0.18);
        this.spark(new THREE.Vector3(a.position.x, a.position.y + 0.4, a.position.z), a.color, 22, 7);
        this.root.remove(a.ring);
        this.root.remove(a.fill);
        a.ring.geometry.dispose();
        (a.ring.material as THREE.Material).dispose();
        a.fill.geometry.dispose();
        (a.fill.material as THREE.Material).dispose();
        this.pendingAoes.splice(i, 1);
        a.onImpact();
      }
    }

    // Projectiles.
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.position.addScaledVector(p.velocity, dt);
      p.mesh.position.copy(p.position);
      if (p.mesh.geometry.type === 'TorusGeometry') p.mesh.rotation.z += dt * 8;
      if (p.life <= 0) this.removeProjectile(i);
    }

    // Lingering hazards.
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.remaining -= dt;
      h.tick -= dt;
      const mat = h.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.14 + Math.abs(Math.sin(this.time * 4 + h.id)) * 0.14;
      h.mesh.scale.setScalar(0.97 + Math.sin(this.time * 3 + h.id) * 0.03);
      if (h.remaining <= 0) this.removeHazard(i);
    }

    // Fade the blade ribbon even when the player stops swinging.
    if (!this.trailActive && this.trailHistory.length) {
      for (const p of this.trailHistory) p.age += dt * 2.2;
      const faded = this.trailHistory.filter((p) => p.age < 0.42);
      this.trailHistory = faded;
    }
  }

  dispose(): void {
    for (let i = this.timed.length - 1; i >= 0; i--) {
      const m = this.timed[i].object as THREE.Mesh;
      this.root.remove(m);
      m.geometry?.dispose();
      (m.material as THREE.Material)?.dispose();
    }
    this.timed = [];
    for (let i = this.bursts.length - 1; i >= 0; i--) this.removeBurst(i);
    for (let i = this.projectiles.length - 1; i >= 0; i--) this.removeProjectile(i);
    for (let i = this.hazards.length - 1; i >= 0; i--) this.removeHazard(i);
    for (const a of this.pendingAoes) {
      this.root.remove(a.ring);
      this.root.remove(a.fill);
      a.ring.geometry.dispose();
      (a.ring.material as THREE.Material).dispose();
      a.fill.geometry.dispose();
      (a.fill.material as THREE.Material).dispose();
    }
    this.pendingAoes = [];
    this.root.remove(this.trail);
    this.trail.geometry.dispose();
    (this.trail.material as THREE.Material).dispose();
    this.scene.remove(this.root);
  }
}
