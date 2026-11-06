import * as THREE from 'three';
import { clamp, easeInOutCubic, lerp, TAU } from '../core/MathUtils';
import { addOutline, glowMat, toonMat } from './Visuals';

export type RigWeapon =
  | 'katana' | 'odachi' | 'greatsword' | 'spear' | 'dual' | 'bow' | 'staff' | 'claws' | 'bell' | 'chains' | 'none';

export interface RigPalette {
  primary: string;
  secondary: string;
  skin: string;
  hair: string;
  accent: string;
  blade: string;
}

export interface RigOptions {
  palette: RigPalette;
  weapon: RigWeapon;
  scale?: number;
  build?: 'human' | 'fox' | 'child' | 'monk' | 'samurai' | 'noble' | 'villager';
  boss?: boolean;
  motif?: string;
  glow?: string;
}

export interface RigState {
  speed: number;
  sprint?: boolean;
  crouch?: boolean;
  guard?: boolean;
  dead?: boolean;
  deadTime?: number;
  hurt?: number;
  attackType?: 'slash' | 'thrust' | 'overhead' | 'spin' | 'kick' | 'slam' | 'cast' | 'stab';
  attackT?: number;
  cast?: boolean;
  airborne?: boolean;
  sit?: boolean;
}

/**
 * A procedural, hand-rigged-looking humanoid / fox. No external models, no
 * skeletal animation data: pose is a deterministic function of state and time,
 * which keeps the game tiny and every animation readable at a glance.
 */
export class CharacterRig {
  readonly group = new THREE.Group();
  readonly body = new THREE.Group();
  height: number;
  readonly palette: RigPalette;
  readonly weapon: RigWeapon;
  private torso = new THREE.Group();
  private head = new THREE.Group();
  private legL = new THREE.Group();
  private legR = new THREE.Group();
  private armL = new THREE.Group();
  private armR = new THREE.Group();
  private foreL = new THREE.Group();
  private foreR = new THREE.Group();
  private handL = new THREE.Group();
  private handR = new THREE.Group();
  private weaponGroup = new THREE.Group();
  private secondaryWeapon = new THREE.Group();
  private skirt: THREE.Mesh | null = null;
  private hair: THREE.Object3D | null = null;
  private aura: THREE.Mesh | null = null;
  private eyes: THREE.Mesh[] = [];
  private isFox = false;
  private foxTail: THREE.Group[] = [];
  private baseScale: number;
  private boss: boolean;
  private deathRoll = 0;

  constructor(opts: RigOptions) {
    this.palette = opts.palette;
    this.weapon = opts.weapon;
    this.boss = !!opts.boss;
    this.baseScale = opts.scale ?? 1;
    this.group.scale.setScalar(this.baseScale);
    this.group.add(this.body);
    this.group.userData.rig = this;

    if (opts.build === 'fox') {
      this.isFox = true;
      this.height = 0.9;
      this.buildFox();
      return;
    }

    this.height = 1.86;
    this.buildHumanoid(opts);
    this.buildWeapon(opts.weapon);
    if (opts.boss) this.buildBossAura(opts);
  }

  private mat(color: string, emissive?: string, intensity = 0.6): THREE.MeshToonMaterial {
    return toonMat(color, emissive ? { emissive, emissiveIntensity: intensity } : {});
  }

  private limb(len: number, radius: number, color: string, taper = 0.75): THREE.Group {
    const pivot = new THREE.Group();
    const geo = new THREE.CylinderGeometry(radius * taper, radius, len, 6);
    geo.translate(0, -len / 2, 0);
    const mesh = new THREE.Mesh(geo, this.mat(color));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    pivot.add(mesh);
    addOutline(mesh, 1.06);
    return pivot;
  }

  private buildHumanoid(opts: RigOptions): void {
    const p = this.palette;
    const build = opts.build ?? 'human';
    const isChild = build === 'child';

    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.25, 0.2, 8), this.mat(p.secondary));
    hips.position.y = 0.9;
    hips.castShadow = true;
    this.body.add(hips);

    this.legL = this.limb(0.46, 0.095, p.secondary);
    this.legR = this.limb(0.46, 0.095, p.secondary);
    this.legL.position.set(-0.13, 0.92, 0);
    this.legR.position.set(0.13, 0.92, 0);
    const shinL = this.limb(0.45, 0.075, p.primary, 0.8);
    const shinR = this.limb(0.45, 0.075, p.primary, 0.8);
    shinL.position.y = -0.46;
    shinR.position.y = -0.46;
    this.legL.add(shinL);
    this.legR.add(shinR);
    const footL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.28), this.mat(p.secondary));
    const footR = footL.clone();
    footL.position.set(0, -0.45, 0.08);
    footR.position.copy(footL.position);
    shinL.add(footL);
    shinR.add(footR);
    this.body.add(this.legL, this.legR);

    this.torso.position.y = 0.94;
    this.body.add(this.torso);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.6, 0.27), this.mat(p.primary));
    chest.position.y = 0.32;
    chest.castShadow = true;
    chest.receiveShadow = true;
    this.torso.add(chest);
    addOutline(chest, 1.05);

    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.03), this.mat(p.secondary));
    chestPlate.position.set(0, 0.38, 0.145);
    this.torso.add(chestPlate);

    const sash = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.29), this.mat(p.accent));
    sash.position.y = 0.04;
    this.torso.add(sash);

    if (build !== 'monk') {
      this.skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.37, 0.52, 8, 1, true), this.mat(p.primary === p.secondary ? p.secondary : p.primary));
      this.skirt.position.y = -0.27;
      this.skirt.castShadow = true;
      this.torso.add(this.skirt);
    }

    // shoulders / pauldrons
    if (build === 'samurai' || this.boss) {
      const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.3), this.mat(p.accent));
      const pauldronR = pauldronL.clone();
      pauldronL.position.set(-0.3, 0.56, 0);
      pauldronR.position.set(0.3, 0.56, 0);
      pauldronL.rotation.z = 0.18;
      pauldronR.rotation.z = -0.18;
      this.torso.add(pauldronL, pauldronR);
    }

    this.buildArms(p);
    this.buildHead(build, p);

    if (build === 'samurai') {
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 5, 0, TAU, 0, Math.PI * 0.55), this.mat(p.secondary));
      helmet.position.y = 0.14;
      this.head.add(helmet);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.035, 10), this.mat(p.accent));
      brim.position.y = 0.08;
      this.head.add(brim);
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.26, 0.14), this.mat('#c9a34a'));
      crest.position.set(0, 0.26, 0.02);
      this.head.add(crest);
      this.hair = helmet;
    } else if (build === 'monk') {
      const beads = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 5, 12), this.mat('#7a5a3a'));
      beads.position.set(0, 0.62, 0.1);
      beads.rotation.x = Math.PI / 2;
      this.torso.add(beads);
    } else if (build === 'noble') {
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 10), this.mat(p.secondary));
      hat.position.y = 0.28;
      this.head.add(hat);
      this.hair = hat;
    }

    if (isChild) {
      this.body.scale.setScalar(0.72);
      this.head.scale.setScalar(1.16);
      this.height *= 0.72;
    }

    if (build === 'villager' || build === 'noble') {
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.16), this.mat(p.secondary));
      pack.position.set(0, 0.34, -0.2);
      this.torso.add(pack);
    }
  }

  private buildArms(p: RigPalette): void {
    this.armL.position.set(-0.3, 0.54, 0);
    this.armR.position.set(0.3, 0.54, 0);
    const upperL = this.limb(0.34, 0.075, p.primary);
    const upperR = this.limb(0.34, 0.075, p.primary);
    this.armL.add(upperL);
    this.armR.add(upperR);

    this.foreL.position.y = -0.34;
    this.foreR.position.y = -0.34;
    const foreL = this.limb(0.32, 0.06, p.skin);
    const foreR = this.limb(0.32, 0.06, p.skin);
    this.foreL.add(foreL);
    this.foreR.add(foreR);
    upperL.add(this.foreL);
    upperR.add(this.foreR);

    this.handL.position.y = -0.32;
    this.handR.position.y = -0.32;
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 5), this.mat(p.skin));
    const handR = handL.clone();
    this.handL.add(handL);
    this.handR.add(handR);
    this.foreL.add(this.handL);
    this.foreR.add(this.handR);

    this.handR.add(this.weaponGroup, this.secondaryWeapon);
    this.torso.add(this.armL, this.armR);
  }

  private buildHead(build: string, p: RigPalette): void {
    this.head.position.y = 0.78;
    this.torso.add(this.head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), this.mat(p.skin));
    skull.scale.z = 0.92;
    skull.castShadow = true;
    this.head.add(skull);
    addOutline(skull, 1.07);

    if (build !== 'monk') {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.175, 8, 5, 0, TAU, 0, Math.PI * 0.6), this.mat(p.hair));
      hair.position.y = 0.02;
      this.head.add(hair);
      this.hair = hair;
    }

    const eyeMat = glowMat(build === 'monk' ? '#f4efe0' : '#1a1612');
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.018, 0.01), eyeMat);
      eye.position.set(side * 0.065, 0.035, 0.155);
      this.head.add(eye);
      this.eyes.push(eye);
    }
  }

  private buildWeapon(kind: RigWeapon): void {
    const p = this.palette;
    const bladeMat = toonMat(p.blade, { emissive: p.blade, emissiveIntensity: 0.06 });
    const hiltMat = toonMat('#241d18');
    const wrapMat = toonMat(p.accent);

    const makeBlade = (length: number, width = 0.055, thick = 0.012): THREE.Group => {
      const g = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(width, length, thick), bladeMat);
      blade.position.y = length / 2 + 0.2;
      blade.castShadow = true;
      g.add(blade);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(width * 0.72, width * 2.6, 4), bladeMat);
      tip.position.y = length + 0.2 + width * 1.3;
      tip.rotation.y = Math.PI / 4;
      g.add(tip);
      const guard = new THREE.Mesh(new THREE.CylinderGeometry(width * 2.2, width * 2.2, 0.025, 8), wrapMat);
      guard.position.y = 0.2;
      g.add(guard);
      const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.24, 6), hiltMat);
      hilt.position.y = 0.08;
      g.add(hilt);
      return g;
    };

    switch (kind) {
      case 'katana':
        this.weaponGroup.add(makeBlade(1.02));
        break;
      case 'odachi':
        this.weaponGroup.add(makeBlade(1.55, 0.075, 0.016));
        break;
      case 'greatsword':
        this.weaponGroup.add(makeBlade(1.72, 0.16, 0.03));
        break;
      case 'spear': {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 2.35, 5), toonMat('#4a3a2a'));
        shaft.position.y = 1.0;
        this.weaponGroup.add(shaft);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5, 4), bladeMat);
        tip.position.y = 2.35;
        this.weaponGroup.add(tip);
        const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 5), wrapMat);
        tassel.position.y = 1.98;
        this.weaponGroup.add(tassel);
        break;
      }
      case 'dual':
        this.weaponGroup.add(makeBlade(0.64, 0.045));
        this.secondaryWeapon.position.set(-0.62, 0, 0);
        this.secondaryWeapon.add(makeBlade(0.64, 0.045));
        break;
      case 'staff': {
        const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 2.2, 6), toonMat('#4c3a2c'));
        staff.position.y = 1.0;
        this.weaponGroup.add(staff);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 5, 10), toonMat(p.accent, { emissive: p.accent, emissiveIntensity: 0.4 }));
        ring.position.y = 2.1;
        this.weaponGroup.add(ring);
        break;
      }
      case 'claws': {
        for (let i = 0; i < 3; i++) {
          const claw = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.3, 4), bladeMat);
          claw.position.set((i - 1) * 0.06, 0.12, 0.02);
          claw.rotation.x = 0.25;
          this.weaponGroup.add(claw);
        }
        break;
      }
      case 'bell': {
        const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.32, 8, 1, true), toonMat('#a8884a', { emissive: '#6a4a20', emissiveIntensity: 0.3 }));
        bell.position.y = 0.18;
        this.weaponGroup.add(bell);
        break;
      }
      case 'chains': {
        for (let i = 0; i < 7; i++) {
          const link = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 4, 6), toonMat('#5a5a5a'));
          link.position.set(0, 0.1 + i * 0.09, 0);
          link.rotation.y = i % 2 ? Math.PI / 2 : 0;
          this.weaponGroup.add(link);
        }
        break;
      }
      case 'bow': {
        const bow = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.022, 5, 14, Math.PI * 1.2), toonMat('#5b3d25'));
        bow.position.set(0, -0.1, 0);
        bow.rotation.set(0, 0, -Math.PI * 0.6);
        this.weaponGroup.add(bow);
        const stringMat = new THREE.LineBasicMaterial({ color: '#e8e0cc', transparent: true, opacity: 0.55 });
        const pts = [new THREE.Vector3(0, -0.52, 0), new THREE.Vector3(0.16, 0.03, 0), new THREE.Vector3(0, 0.52, 0)];
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), stringMat);
        this.weaponGroup.add(line);
        this.weaponGroup.position.set(-0.06, 0, 0);
        break;
      }
      default:
        break;
    }

    // Left-hand mirror for dual wield: move one blade to the left hand.
    if (kind === 'dual') {
      const mirror = this.weaponGroup.children[0]?.clone();
      if (mirror) {
        this.secondaryWeapon.clear();
        this.secondaryWeapon.position.set(0, 0, 0);
        this.secondaryWeapon.add(mirror);
        this.handL.add(this.secondaryWeapon);
      }
    }
  }

  private buildBossAura(opts: RigOptions): void {
    const color = opts.glow ?? this.palette.accent;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.25, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    this.aura = ring;
    this.group.add(ring);

    const eyeMat = glowMat(color, 2);
    this.eyes.forEach((e) => e.material && ((e.material as THREE.Material).dispose(), (e.material = eyeMat)));

    if (opts.motif === 'crown') {
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.18, 8, 1, true), toonMat('#d9b36a', { emissive: '#ffcf8a', emissiveIntensity: 0.9 }));
      crown.position.y = 0.22;
      this.head.add(crown);
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 4), toonMat('#d9b36a', { emissive: '#ffcf8a', emissiveIntensity: 0.8 }));
        spike.position.set(Math.sin((i / 5) * TAU) * 0.2, 0.34, Math.cos((i / 5) * TAU) * 0.2);
        this.head.add(spike);
      }
    } else if (this.boss) {
      for (const side of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.32, 5), toonMat('#2a2018'));
        horn.position.set(side * 0.12, 0.17, 0);
        horn.rotation.z = side * 0.3;
        this.head.add(horn);
      }
    }
  }

  private buildFox(): void {
    const p = this.palette;
    const fur = this.mat(p.primary);
    const accent = this.mat(p.accent, '#3a2a10', 0.2);
    const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.52, 4, 8), fur);
    bodyMesh.rotation.z = Math.PI / 2;
    bodyMesh.position.set(0, 0.58, 0);
    bodyMesh.castShadow = true;
    this.body.add(bodyMesh);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), this.mat(p.secondary));
    chest.position.set(0, 0.6, 0.3);
    this.body.add(chest);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), fur);
    head.position.set(0, 0.72, 0.48);
    this.body.add(head);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.25, 6), this.mat(p.secondary));
    snout.position.set(0, 0.67, 0.65);
    snout.rotation.x = Math.PI / 2;
    this.body.add(snout);
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), fur);
      ear.position.set(side * 0.1, 0.9, 0.44);
      ear.rotation.z = side * 0.18;
      this.body.add(ear);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.4, 5), fur);
      leg.position.set(side * 0.13, 0.26, 0.24);
      this.body.add(leg);
      const leg2 = leg.clone();
      leg2.position.z = -0.2;
      this.body.add(leg2);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), glowMat(p.accent));
      eye.position.set(side * 0.07, 0.74, 0.63);
      this.body.add(eye);
    }
    for (let i = 0; i < 5; i++) {
      const tail = new THREE.Group();
      tail.position.set(0, 0.6, -0.32);
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.75, 5), i === 4 ? accent : fur);
      t.position.set(0, 0.1, -0.35);
      t.rotation.x = -0.9;
      tail.add(t);
      tail.rotation.y = (i - 2) * 0.18;
      this.body.add(tail);
      this.foxTail.push(tail);
    }
    this.group.userData.fox = true;
  }

  update(dt: number, time: number, state: RigState): void {
    if (this.isFox) {
      this.updateFox(dt, time, state);
      return;
    }
    const speed = Math.abs(state.speed);
    const walk = clamp(speed / 6.2, 0, 1);
    const strideSpeed = state.sprint ? 13 : 8;
    const stride = Math.sin(time * strideSpeed * (0.55 + walk * 0.7)) * walk * (state.sprint ? 0.9 : 0.6);

    // Reset to a known pose each frame.
    this.body.position.set(0, 0, 0);
    this.body.rotation.set(0, 0, 0);
    this.torso.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.armL.rotation.set(0.08, 0, 0.10);
    this.armR.rotation.set(0.08, 0, -0.10);
    this.foreL.rotation.set(-0.18, 0, 0);
    this.foreR.rotation.set(-0.24, 0, 0);
    this.legL.rotation.set(0, 0, 0);
    this.legR.rotation.set(0, 0, 0);

    this.legL.rotation.x = stride;
    this.legR.rotation.x = -stride;
    this.armL.rotation.x += -stride * 0.65;
    this.armR.rotation.x += stride * 0.55;
    this.body.position.y = Math.abs(Math.sin(time * strideSpeed * 0.5)) * 0.03 * walk;
    this.torso.rotation.x = state.sprint ? 0.18 : walk * 0.06;

    if (state.sprint) this.torso.rotation.x = 0.22;

    if (state.crouch) {
      this.body.position.y = -0.26;
      this.torso.rotation.x = 0.22;
      this.legL.rotation.x = 0.55 + stride * 0.5;
      this.legR.rotation.x = 0.55 - stride * 0.5;
      this.armL.rotation.x = -0.4;
      this.armR.rotation.x = -0.2;
    }

    if (state.guard) {
      this.armR.rotation.set(-1.0, 0.35, -0.55);
      this.foreR.rotation.set(-1.1, 0, 0);
      this.armL.rotation.set(-0.7, -0.25, 0.25);
      this.foreL.rotation.set(-1.0, 0, 0);
      this.torso.rotation.y = 0.16;
      this.torso.rotation.x = 0.05;
    }

    if (state.sit) {
      this.body.position.y = -0.42;
      this.legL.rotation.x = -1.2;
      this.legR.rotation.x = -1.2;
      this.armL.rotation.x = -0.2;
      this.armR.rotation.x = -0.2;
    }

    if (state.cast) {
      this.armR.rotation.set(-1.2, 0, -0.4);
      this.foreR.rotation.set(-0.3, 0, 0);
      this.armL.rotation.set(-1.4, 0, 0.5);
      this.foreL.rotation.set(-0.2, 0, 0);
      this.torso.rotation.x = -0.08;
    }

    if (state.attackType && state.attackT !== undefined) {
      const t = clamp(state.attackT, 0, 1);
      const strike = t < 0.36 ? easeInOutCubic(t / 0.36) : t < 0.78 ? 1 : 1 - easeInOutCubic((t - 0.78) / 0.22);
      const wind = t < 0.36 ? easeInOutCubic(t / 0.36) : t < 0.78 ? 1 : 1 - (t - 0.78) / 0.22;
      const rec = clamp((t - 0.78) / 0.22, 0, 1);
      switch (state.attackType) {
        case 'slash':
          if (rec > 0) {
            // Dedicated follow-through: blade returning at a clear angle,
            // torso counter-rotated and weight shifted opposite the swing.
            const r = rec * rec * (3 - 2 * rec);
            this.armR.rotation.set(-1.95 + 0.4 * r, 0.15, -0.55 + 0.8 * r);
            this.foreR.rotation.x = -0.55 + 0.25 * r;
            this.torso.rotation.y = -1.05 + 1.35 * r;
            this.torso.rotation.x = 0.17 - 0.11 * r;
            this.body.position.y = -0.14 + 0.12 * r;
            this.legL.rotation.x = 0.6 - 0.95 * r;
            this.legR.rotation.x = -0.5 + 1.05 * r;
          } else {
            this.armR.rotation.set(lerp(-0.1, -2.5, wind), 0, lerp(-0.1, -0.6, wind) + strike * 0.85);
            this.foreR.rotation.x = lerp(-0.3, -0.05, t);
            this.torso.rotation.y = lerp(0.5, -1.45, t);
            this.torso.rotation.x = 0.12 + strike * 0.07;
            this.body.position.y = -Math.abs(strike) * 0.1;
            this.legL.rotation.x = lerp(0, 0.8, strike);
            this.legR.rotation.x = lerp(0, -0.6, strike);
          }
          break;
        case 'overhead':
          this.armR.rotation.set(lerp(-0.1, -2.9, wind), 0, -0.2);
          this.foreR.rotation.x = lerp(-0.2, -0.8, t);
          this.torso.rotation.x = lerp(0, 0.28, strike);
          break;
        case 'thrust':
          this.armR.rotation.set(lerp(0.1, -1.35, wind), 0, -0.25);
          this.foreR.rotation.x = lerp(-1.1, 0.35, strike);
          this.torso.rotation.y = lerp(0.4, -0.3, t);
          this.torso.rotation.x = lerp(0, 0.2, strike);
          break;
        case 'spin':
          this.body.rotation.y = t * TAU * 1.1;
          this.armR.rotation.set(-1.35, 0, -0.9);
          this.foreR.rotation.x = -0.2;
          this.torso.rotation.x = 0.12;
          break;
        case 'kick':
          this.legR.rotation.x = lerp(0.2, -1.8, strike);
          this.torso.rotation.x = -0.12;
          break;
        case 'slam':
          this.armR.rotation.set(lerp(-0.2, -2.8, wind), 0, -0.1);
          this.foreR.rotation.x = lerp(-0.2, 0.1, t);
          this.torso.rotation.x = lerp(0, 0.45, strike);
          this.body.position.y = -0.08 * strike;
          break;
        case 'cast':
          this.armR.rotation.set(-1.7, 0, -0.6);
          this.armL.rotation.set(-1.4, 0, 0.7);
          this.torso.rotation.x = -0.1;
          break;
        case 'stab':
          this.armR.rotation.set(lerp(0.2, -1.5, wind), 0, -0.3);
          this.foreR.rotation.x = lerp(-0.8, 0.6, strike);
          this.body.position.z = strike * 0.18;
          break;
      }
      if (state.attackType === 'spin') this.torso.rotation.y = 0;
    }

    if (state.hurt && state.hurt > 0) {
      this.torso.rotation.x -= state.hurt * 0.35;
      this.head.rotation.x = -state.hurt * 0.2;
      this.body.position.z = -state.hurt * 0.06;
    }

    if (state.dead) {
      this.deathRoll = Math.min(1, (state.deadTime ?? 0) * 2.6);
      this.body.rotation.x = -Math.PI / 2 * easeInOutCubic(this.deathRoll);
      this.body.position.y = 0.18 * this.deathRoll;
      this.body.position.z = -0.25 * this.deathRoll;
      this.armL.rotation.set(-0.4, 0, 0.5);
      this.armR.rotation.set(-0.4, 0, -0.5);
      this.legL.rotation.x = 0.2;
      this.legR.rotation.x = -0.2;
    }

    if (this.aura) {
      this.aura.rotation.z = time * 0.4;
      const mat = this.aura.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.22 + Math.sin(time * 2.1) * 0.08;
    }
    if (this.weaponGroup) this.weaponGroup.visible = state.dead ? true : true;
    if (state.dead) this.weaponGroup.visible = false;
    if (state.dead) this.secondaryWeapon.visible = false;
  }

  private updateFox(dt: number, time: number, state: RigState): void {
    this.body.position.y = Math.sin(time * 2.2) * 0.025;
    this.body.rotation.z = Math.sin(time * 1.1) * 0.025;
    this.foxTail.forEach((tail, i) => {
      tail.rotation.y = (i - 2) * 0.18 + Math.sin(time * 1.7 + i) * 0.14;
      tail.rotation.x = Math.sin(time * 1.1 + i * 0.7) * 0.06;
    });
    if (state.dead) {
      this.body.rotation.z = Math.PI / 2;
      this.body.position.y = 0.2;
    }
  }

  /** Expose the weapon tip for trails / effects. */
  getWeaponTip(): THREE.Vector3 {
    const v = new THREE.Vector3(0, 1.6, 0);
    this.weaponGroup.localToWorld(v);
    return v;
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  dispose(): void {
    this.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
  }
}
