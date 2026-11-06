import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { Quality, RegionTheme } from '../types';

const SKY_VERT = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `  precision highp float;
  varying vec3 vWorldPosition;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunColor;
  uniform vec3 uCloud;
  uniform vec3 uSunDir;
  uniform float uTime;
  uniform float uNight;
  uniform float uCloudiness;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(11.7, 5.1);
      a *= 0.5;
    }
    return v;
  }
  void main() {
    vec3 dir = normalize(vWorldPosition);
    float h = clamp(dir.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uTop, pow(h, 0.58));

    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    float disc = smoothstep(0.9985, 0.9997, sunDot);
    float glow = pow(sunDot, 18.0) * 0.5 + pow(sunDot, 160.0) * 0.9;
    col += uSunColor * (disc * 2.2 + glow * (1.0 - uNight * 0.6));

    vec2 cloudUV = dir.xz / max(dir.y + 0.16, 0.08);
    cloudUV = cloudUV * 0.42 + vec2(uTime * 0.0035, uTime * 0.0012);
    float clouds = fbm(cloudUV * 2.2);
    clouds = smoothstep(0.52, 0.78, clouds) * smoothstep(0.0, 0.16, dir.y) * uCloudiness;
    vec3 cloudCol = mix(uCloud * 0.75, uCloud * 1.25, sunDot);
    col = mix(col, cloudCol, clouds * 0.8);

    if (uNight > 0.01) {
      vec2 starUV = dir.xz / max(0.08, abs(dir.y)) * 34.0;
      float star = step(0.9965, hash(floor(starUV)));
      float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + hash(floor(starUV)) * 40.0);
      col += vec3(0.85, 0.9, 1.0) * star * twinkle * uNight * smoothstep(0.05, 0.4, dir.y) * 0.9;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

const GRADE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GRADE_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uWarm;
  uniform float uVignette;
  uniform float uGrain;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec4 c = texture2D(tDiffuse, vUv);

    // S-curve contrast with a soft roll-off on both ends.
    c.rgb = mix(c.rgb, clamp((c.rgb - 0.5) * (1.0 + uContrast) + 0.5, 0.0, 1.0), 0.85);

    // Saturation toward a luminance-preserving average.
    float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    c.rgb = mix(vec3(l), c.rgb, uSaturation);

    // Warm mid-tones (cinematic sun feel) without touching shadows/highlights.
    float mid = smoothstep(0.05, 0.5, l) * (1.0 - smoothstep(0.5, 0.95, l));
    c.rgb += vec3(0.05, 0.02, -0.015) * uWarm * mid;

    // Gentle highlight roll-off / soft shoulder.
    c.rgb = 1.0 - pow(1.0 - clamp(c.rgb, 0.0, 1.0), vec3(1.02));

    // Vignette.
    vec2 q = vUv - 0.5;
    float d = dot(q, q);
    c.rgb *= 1.0 - uVignette * d * 1.7;

    // Fine film grain (animated, cheap).
    float grain = (hash(vUv * vec2(1171.0, 673.0) + uTime * 61.0) - 0.5) * uGrain;
    c.rgb += grain;

    gl_FragColor = c;
  }
`;

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly hemi: THREE.HemisphereLight;
  readonly sun: THREE.DirectionalLight;
  readonly rim: THREE.DirectionalLight;
  readonly fill: THREE.DirectionalLight;
  readonly camera: THREE.PerspectiveCamera;
  readonly composer: EffectComposer;
  private readonly renderPass: RenderPass;
  private readonly bloomPass: UnrealBloomPass;
  private readonly gradePass: ShaderPass;
  private readonly outputPass: OutputPass;
  private readonly sky: THREE.Mesh;
  private readonly skyMat: THREE.ShaderMaterial;
  private readonly theme: RegionTheme;
  private readonly canvas: HTMLCanvasElement;
  private bloomEnabled = true;
  private time = 0;
  private quality: Quality;

  constructor(canvas: HTMLCanvasElement, theme: RegionTheme, quality: Quality) {
    this.canvas = canvas;
    this.theme = theme;
    this.quality = quality;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality !== 'low',
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(theme.fog, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.background = new THREE.Color(theme.fog);
    this.scene.fog = new THREE.FogExp2(theme.fog, theme.fogDensity * 1.12);

    this.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1400);
    this.camera.position.set(0, 10, 16);

    this.hemi = new THREE.HemisphereLight(theme.skyHorizon, theme.groundLow, 0.95);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(theme.sun, 2.2);
    this.sun.position.set(60, 110, 40);
    this.sun.castShadow = quality !== 'low';
    this.sun.shadow.mapSize.set(quality === 'ultra' ? 3072 : quality === 'high' ? 2048 : 1024, quality === 'ultra' ? 3072 : quality === 'high' ? 2048 : 1024);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 300;
    this.sun.shadow.camera.left = -80;
    this.sun.shadow.camera.right = 80;
    this.sun.shadow.camera.top = 80;
    this.sun.shadow.camera.bottom = -80;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.rim = new THREE.DirectionalLight(theme.accent, 0.7);
    this.rim.position.set(-50, 40, -60);
    this.scene.add(this.rim);

    this.fill = new THREE.DirectionalLight('#8fb4c8', 0.4);
    this.fill.position.set(-80, 30, 70);
    this.scene.add(this.fill);

    this.skyMat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color(theme.skyTop) },
        uHorizon: { value: new THREE.Color(theme.skyHorizon) },
        uSunColor: { value: new THREE.Color(theme.sun) },
        uCloud: { value: new THREE.Color(theme.cloud) },
        uSunDir: { value: new THREE.Vector3(0.3, 0.7, 0.2) },
        uTime: { value: 0 },
        uNight: { value: 0 },
        uCloudiness: { value: 0.55 },
      },
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1050, 32, 18), this.skyMat);
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);

    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.75, 0.85);
    this.composer.addPass(this.bloomPass);
    this.gradePass = new ShaderPass({
      vertexShader: GRADE_VERT,
      fragmentShader: GRADE_FRAG,
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uContrast: { value: 0.27 },
        uSaturation: { value: 0.94 },
        uWarm: { value: 0.85 },
        uVignette: { value: 0.32 },
        uGrain: { value: 0.035 },
      },
    });
    this.composer.addPass(this.gradePass);
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    this.applyQuality(quality);
    this.setTheme(theme);
    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  /** Re-target the shadow frustum around the player to keep crisp shadows. */
  followSun(position: THREE.Vector3): void {
    this.sun.position.set(position.x + 55, position.y + 105, position.z + 35);
    this.sun.target.position.set(position.x, position.y, position.z);
    this.sun.target.updateMatrixWorld();
    this.sky.position.set(position.x, 0, position.z);
    this.skyMat.uniforms.uSunDir.value.set(0.42, 0.78, 0.28).normalize();
  }

  setTheme(theme: RegionTheme): void {
    this.scene.background = new THREE.Color(theme.fog);
    (this.scene.fog as THREE.FogExp2).color.set(theme.fog);
    (this.scene.fog as THREE.FogExp2).density = theme.fogDensity;
    this.hemi.color.set(theme.skyHorizon);
    this.hemi.groundColor.set(theme.groundLow);
    this.sun.color.set(theme.sun);
    this.rim.color.set(theme.accent);
    this.fill.color.set('#8fb4c8');
    this.skyMat.uniforms.uTop.value.set(theme.skyTop);
    this.skyMat.uniforms.uHorizon.value.set(theme.skyHorizon);
    this.skyMat.uniforms.uSunColor.value.set(theme.sun);
    this.skyMat.uniforms.uCloud.value.set(theme.cloud);
    const night = theme.hour < 6 || theme.hour > 18.5 ? Math.min(1, Math.abs(theme.hour - 12) / 8) : 0;
    this.skyMat.uniforms.uNight.value = night;
    this.skyMat.uniforms.uCloudiness.value = theme.weather === 'clear' ? 0.4 : theme.weather === 'storm' ? 1.0 : 0.7;
    this.renderer.setClearColor(theme.fog, 1);
    const sunAlt = Math.sin(((theme.hour + 24 - 6) / 24) * Math.PI * 2);
    const intensity = Math.max(0.25, sunAlt * 2.2) * (theme.weather === 'storm' ? 0.5 : 1);
    this.sun.intensity = intensity;
    this.hemi.intensity = 0.5 + Math.max(0, sunAlt) * 0.55;
    this.rim.intensity = 0.45 + (1 - Math.max(0, sunAlt)) * 0.5;
    this.fill.intensity = 0.42 + (1 - Math.max(0, sunAlt)) * 0.12;
  }

  setBloom(enabled: boolean): void {
    this.bloomEnabled = enabled;
    this.bloomPass.enabled = enabled && this.quality !== 'low';
  }

  applyQuality(quality: Quality): void {
    this.quality = quality;
    const cap = quality === 'low' ? 1 : quality === 'medium' ? 1.25 : quality === 'high' ? 1.75 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    this.renderer.shadowMap.enabled = quality !== 'low';
    this.sun.castShadow = quality !== 'low';
    const size = quality === 'ultra' ? 3072 : quality === 'high' ? 2048 : 1024;
    this.sun.shadow.mapSize.set(size, size);
    this.bloomPass.enabled = this.bloomEnabled && quality !== 'low';
    if (this.sun.shadow.map) {
      this.sun.shadow.map.dispose();
      this.sun.shadow.map = null;
    }
    this.onResize();
  }

  update(dt: number, time: number): void {
    this.time = time;
    this.skyMat.uniforms.uTime.value = time;
    if (this.gradePass.uniforms.uTime) this.gradePass.uniforms.uTime.value = time;
  }

  render(): void {
    if (this.bloomEnabled && this.quality !== 'low') this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  };

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.composer.dispose();
    this.renderer.dispose();
  }
}
