import * as THREE from 'three';
import { SeededRandom } from '../core/MathUtils';

/* -------------------------------------------------------------------------- */
/*  Shared stylised materials & geometry                                      */
/* -------------------------------------------------------------------------- */

let gradientMap: THREE.DataTexture | null = null;

/** Four-band ramp shared by every toon material, for a hand-inked look. */
export function getGradientMap(): THREE.DataTexture {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([54, 54, 54, 255, 128, 128, 128, 255, 196, 196, 196, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  gradientMap = tex;
  return tex;
}

const matCache = new Map<string, THREE.MeshToonMaterial>();

export function toonMat(
  color: string,
  opts: { emissive?: string; emissiveIntensity?: number; transparent?: number; side?: THREE.Side; flat?: boolean } = {},
): THREE.MeshToonMaterial {
  const key = `${color}|${opts.emissive ?? ''}|${opts.emissiveIntensity ?? ''}|${opts.transparent ?? ''}|${opts.side ?? ''}|${opts.flat ?? ''}`;
  const cached = matCache.get(key);
  if (cached) return cached;
  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap: getGradientMap(),
    transparent: opts.transparent !== undefined,
    opacity: opts.transparent ?? 1,
    side: opts.side ?? THREE.FrontSide,
  });
  if (opts.flat) (mat as unknown as { flatShading: boolean }).flatShading = true;
  if (opts.emissive) {
    mat.emissive = new THREE.Color(opts.emissive);
    mat.emissiveIntensity = opts.emissiveIntensity ?? 1;
  }
  matCache.set(key, mat);
  return mat;
}

export function glowMat(color: string, intensity = 1.4, transparent = false): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent,
    opacity: transparent ? 0.55 : 1,
    blending: THREE.AdditiveBlending,
    depthWrite: !transparent,
    toneMapped: false,
  });
}

export function addOutline(mesh: THREE.Mesh, scale = 1.045, color = '#0a0908'): THREE.Mesh {
  const outline = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }));
  outline.scale.setScalar(scale);
  outline.userData.outline = true;
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.renderOrder = -1;
  mesh.add(outline);
  return outline;
}

export function setOutlinesVisible(root: THREE.Object3D, visible: boolean): void {
  root.traverse((o) => {
    if (o.userData.outline) o.visible = visible;
  });
}

export function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cylinder(rt: number, rb: number, h: number, mat: THREE.Material, seg = 8, y = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function sphere(r: number, mat: THREE.Material, seg = 10): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, Math.floor(seg * 0.7))), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cone(r: number, h: number, mat: THREE.Material, seg = 8): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const GEO = {
  rock: new THREE.DodecahedronGeometry(1, 0),
  grassBlade: (() => {
    const g = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -0.06, 0, 0, 0.06, 0, 0, 0.0, 1, 0.02,
      -0.06, 0, 0, 0.0, 1, 0.02, 0.0, 0.55, -0.02,
    ]);
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    g.computeVertexNormals();
    return g;
  })(),
  bamboo: new THREE.CylinderGeometry(0.09, 0.12, 1, 5, 1),
  leaf: new THREE.ConeGeometry(0.18, 1.2, 3, 1),
};

/* -------------------------------------------------------------------------- */
/*  Nature                                                                    */
/* -------------------------------------------------------------------------- */

export function buildTree(rng: SeededRandom, colors: { trunk: string; leaf: string; accent?: string }, snow = false): THREE.Group {
  const group = new THREE.Group();
  const height = rng.range(3.2, 6.8);
  const trunk = cylinder(0.12, 0.3 * (height / 5), height, toonMat(colors.trunk), 6, height / 2);
  trunk.rotation.z = rng.range(-0.08, 0.08);
  group.add(trunk);
  const layers = rng.int(3, 5);
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const radius = rng.range(1.1, 1.9) * (1 - t * 0.45);
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(radius, rng.range(1.8, 2.8), rng.int(5, 7), 1),
      toonMat(snow && i > layers - 3 ? '#e8f0ee' : colors.leaf, { flat: true }),
    );
    crown.position.y = height * (0.55 + t * 0.38);
    crown.rotation.y = rng.range(0, Math.PI * 2);
    crown.castShadow = true;
    group.add(crown);
  }
  return group;
}

export function buildBamboo(rng: SeededRandom, colors: { leaf: string; trunk: string }): THREE.Group {
  const group = new THREE.Group();
  const height = rng.range(4.5, 9.5);
  const stalk = new THREE.Mesh(GEO.bamboo, toonMat(colors.trunk));
  stalk.scale.y = height;
  stalk.position.y = height / 2;
  stalk.castShadow = true;
  group.add(stalk);
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(GEO.leaf, toonMat(colors.leaf, { flat: true }));
    leaf.scale.setScalar(rng.range(0.6, 1.3));
    leaf.position.set(rng.range(-0.5, 0.5), height * rng.range(0.55, 1.0), rng.range(-0.5, 0.5));
    leaf.rotation.set(rng.range(-0.7, 0.7), rng.range(0, Math.PI * 2), rng.range(-0.8, 0.8));
    group.add(leaf);
  }
  return group;
}

export function buildRock(rng: SeededRandom, color: string): THREE.Mesh {
  const rock = new THREE.Mesh(GEO.rock, toonMat(color, { flat: true }));
  const s = rng.range(0.5, 2.6);
  rock.scale.set(s * rng.range(0.7, 1.4), s * rng.range(0.4, 1.0), s * rng.range(0.7, 1.4));
  rock.rotation.set(rng.range(0, 1), rng.range(0, Math.PI * 2), rng.range(0, 1));
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

export function buildGrassField(
  count: number,
  size: number,
  color: string,
  rng: SeededRandom,
  heightAt?: (x: number, z: number) => number,
): THREE.InstancedMesh {
  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap: getGradientMap(),
    side: THREE.DoubleSide,
    alphaTest: 0.1,
  });
  const mesh = new THREE.InstancedMesh(GEO.grassBlade, mat, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const x = rng.range(-size / 2, size / 2);
    const z = rng.range(-size / 2, size / 2);
    p.set(x, heightAt ? heightAt(x, z) : 0, z);
    q.setFromAxisAngle(up, rng.range(0, Math.PI * 2));
    const scale = rng.range(0.6, 1.8);
    s.set(scale, scale * rng.range(0.7, 1.4), scale);
    m.compose(p, q, s);
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

/* -------------------------------------------------------------------------- */
/*  Canvas texture helpers                                                    */
/* -------------------------------------------------------------------------- */

export function canvasTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function textBanner(text: string, color = '#f2e4c4', bg = 'rgba(12,10,8,0.72)', width = 512): THREE.Mesh {
  const tex = canvasTexture(width, 128, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, 128);
    ctx.strokeStyle = '#8a2f24';
    ctx.lineWidth = 4;
    ctx.strokeRect(5, 5, width - 10, 118);
    ctx.fillStyle = color;
    ctx.font = '600 54px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, 68);
  });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), mat);
  mesh.userData.banner = true;
  return mesh;
}

export function particleTexture(shape: 'dot' | 'petal' | 'spark' = 'dot'): THREE.CanvasTexture {
  return canvasTexture(64, 64, (ctx) => {
    ctx.clearRect(0, 0, 64, 64);
    if (shape === 'petal') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(32, 32, 9, 22, Math.PI / 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === 'spark') {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(255,220,150,0.8)');
      g.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    } else {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    }
  });
}

export const SHADOW_BIAS = -0.0005;

export function disposeObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && !mesh.geometry.userData.shared) mesh.geometry.dispose();
    const mat = (mesh as THREE.Mesh).material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat && !(mat as THREE.Material).userData?.shared) (mat as THREE.Material).dispose();
  });
}
