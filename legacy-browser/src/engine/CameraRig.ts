import * as THREE from 'three';
import { clamp, damp, lerp } from '../core/MathUtils';
import type { Vec3Data } from '../types';

interface CinematicShot {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  blend: number;
}

/**
 * Third-person orbit camera with lock-on, terrain clearance, sprint FOV and a
 * cinematic override used by the chapter films and deathblows.
 */
export class CameraRig {
  public yaw = Math.PI;
  public pitch = 0.16;
  public distance = 5.4;
  public targetDistance = 5.4;
  public minPitch = -0.72;
  public maxPitch = 0.95;
  public sensitivity = 1;
  public shakeAmount = 0;
  public shakeTime = 0;
  public baseFov = 58;
  public camera: THREE.PerspectiveCamera;
  private shakeSeed = 0;
  private lookAt = new THREE.Vector3();
  private desired = new THREE.Vector3();
  private cinematic: CinematicShot | null = null;
  private cinematicTarget: CinematicShot | null = null;
  private lockTarget: THREE.Vector3 | null = null;
  private lockWeight = 0;
  private reducedMotion = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.baseFov = camera.fov;
    this.pitch = 0.27;
    this.camera.position.set(0, 8, 12);
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  setDistance(value: number): void {
    this.targetDistance = value;
  }

  applyLook(dx: number, dy: number, sensitivity: number): void {
    if (this.cinematic) return;
    const scale = 0.0022 * sensitivity;
    this.yaw -= dx * scale;
    this.pitch = clamp(this.pitch + dy * scale, this.minPitch, this.maxPitch);
  }

  setLockTarget(position: THREE.Vector3 | null): void {
    this.lockTarget = position;
  }

  get locked(): boolean {
    return !!this.lockTarget;
  }

  /** Camera-relative movement basis. */
  getBasis(): { forward: THREE.Vector3; right: THREE.Vector3 } {
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    return { forward, right };
  }

  playCinematic(pos: Vec3Data, look: Vec3Data, blend = 2.2): void {
    this.cinematicTarget = {
      pos: new THREE.Vector3(pos.x, pos.y, pos.z),
      look: new THREE.Vector3(look.x, look.y, look.z),
      blend,
    };
    if (!this.cinematic) {
      this.cinematic = {
        pos: this.cinematicTarget.pos.clone(),
        look: this.cinematicTarget.look.clone(),
        blend,
      };
    }
  }

  clearCinematic(): void {
    this.cinematicTarget = null;
    this.cinematic = null;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  get inCinematic(): boolean {
    return !!this.cinematicTarget;
  }

  shake(strength: number, duration = 0.25): void {
    if (this.reducedMotion) return;
    this.shakeAmount = Math.max(this.shakeAmount, strength);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(
    dt: number,
    target: THREE.Vector3,
    groundAt: (x: number, z: number) => number,
    sprinting: boolean,
    focusPoint?: THREE.Vector3 | null,
  ): void {
    if (this.cinematicTarget) {
      const c = this.cinematic!;
      const k = 1 - Math.exp(-this.cinematicTarget.blend * dt);
      c.pos.lerp(this.cinematicTarget.pos, k);
      c.look.lerp(this.cinematicTarget.look, k);
      this.camera.position.copy(c.pos);
      this.camera.lookAt(c.look);
      return;
    }

    if (focusPoint) {
      this.lockWeight = damp(this.lockWeight, 1, 8, dt);
      const desiredYaw = Math.atan2(focusPoint.x - target.x, focusPoint.z - target.z);
      let dy = desiredYaw - this.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this.yaw += dy * Math.min(1, dt * 7 * this.lockWeight);
      const dxz = Math.hypot(focusPoint.x - target.x, focusPoint.z - target.z);
      const idealPitch = clamp(0.14 - (focusPoint.y - target.y) * 0.01, -0.2, 0.55);
      this.pitch = damp(this.pitch, idealPitch, 4, dt);
      this.targetDistance = clamp(4.6 + dxz * 0.08, 4.6, 7.2);
    } else {
      this.lockWeight = damp(this.lockWeight, 0, 6, dt);
      this.targetDistance = 5.4;
    }

    this.distance = damp(this.distance, this.targetDistance, 5, dt);
    const cosPitch = Math.cos(this.pitch);
    this.desired.set(
      target.x - Math.sin(this.yaw) * cosPitch * this.distance,
      target.y + 2.05 + Math.sin(this.pitch) * this.distance,
      target.z - Math.cos(this.yaw) * cosPitch * this.distance,
    );

    const ground = groundAt(this.desired.x, this.desired.z);
    this.desired.y = Math.max(this.desired.y, ground + 1.1);

    this.camera.position.x = damp(this.camera.position.x, this.desired.x, 11, dt);
    this.camera.position.y = damp(this.camera.position.y, this.desired.y, 11, dt);
    this.camera.position.z = damp(this.camera.position.z, this.desired.z, 11, dt);

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const s = this.shakeAmount * Math.min(1, this.shakeTime * 4);
      this.shakeSeed += dt * 47;
      const nx = Math.sin(this.shakeSeed * 13.7) * s;
      const ny = Math.cos(this.shakeSeed * 17.3) * s * 0.7;
      this.camera.position.x += nx;
      this.camera.position.y += ny;
      this.shakeAmount = Math.max(0, this.shakeAmount - dt * 2.5);
    }

    // Rule-of-thirds composition: keep the focus slightly off-center so the
    // scene reads as framed rather than a centered snapshot.
    const thirdX = Math.cos(this.yaw) * 1.3;
    const thirdZ = -Math.sin(this.yaw) * 1.3;
    this.lookAt.set(
      target.x + Math.sin(this.yaw) * 1.4 + Math.cos(this.yaw) * 0.5 + thirdX,
      target.y + 1.5 + Math.sin(this.pitch) * -0.5,
      target.z + Math.cos(this.yaw) * 1.4 - Math.sin(this.yaw) * 0.5 + thirdZ,
    );
    this.camera.lookAt(this.lookAt);

    const targetFov = sprinting ? 63 : 58;
    this.camera.fov = lerp(this.camera.fov, targetFov, 1 - Math.exp(-4 * dt));
    this.camera.updateProjectionMatrix();
  }

  /** Small screen-space projection helper for damage numbers / prompts. */
  project(position: THREE.Vector3): { x: number; y: number; visible: boolean } {
    const v = position.clone().project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
      visible: v.z < 1,
    };
  }
}
