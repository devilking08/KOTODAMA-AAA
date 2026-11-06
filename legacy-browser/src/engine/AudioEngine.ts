import type { MusicMood, MusicTheme, SettingsData } from '../types';

/**
 * Fully synthesised audio. No sample files, no network requests: music is a
 * generative pentatonic score, ambience is filtered noise, and every impact is
 * built from oscillators + shaped noise. The mixer respects the settings panel.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private musicTimer: number | null = null;
  private ambienceNodes: AudioNode[] = [];
  private settings: SettingsData | null = null;
  private mood: MusicMood = 'title';
  private theme: MusicTheme = { mood: 'title', root: 146.83, scale: [0, 2, 4, 7, 9], bpm: 58 };
  private nextNote = 0;
  private step = 0;
  private bossIntensity = 0;
  private ducked = false;
  private started = false;
  private readonly motifSeed: number[] = [];

  constructor() {
    for (let i = 0; i < 16; i++) this.motifSeed.push((i * 7 + 3) % 11);
  }

  async ensure(): Promise<void> {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.master);
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.connect(this.master);
      this.noiseBuffer = this.createNoise();
      if (this.settings) this.applySettings(this.settings);
      this.startAmbience();
      if (!this.started) this.startScheduler();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => undefined);
  }

  get ready(): boolean {
    return !!this.ctx;
  }

  applySettings(settings: SettingsData): void {
    this.settings = settings;
    if (!this.ctx || !this.master || !this.musicGain || !this.sfxGain || !this.ambienceGain) return;
    const now = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(settings.masterVolume, now, 0.02);
    this.musicGain.gain.setTargetAtTime(settings.musicVolume * (settings.reduceMotion ? 0.9 : 1), now, 0.05);
    this.sfxGain.gain.setTargetAtTime(settings.sfxVolume, now, 0.03);
    this.ambienceGain.gain.setTargetAtTime(settings.ambienceVolume * 0.5, now, 0.1);
  }

  private createNoise(): AudioBuffer {
    const ctx = this.ctx!;
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private noiseSource(): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    return src;
  }

  private startAmbience(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const wind = this.noiseSource();
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 380;
    windFilter.Q.value = 0.6;
    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.18;
    wind.connect(windFilter).connect(windGain).connect(this.ambienceGain);
    wind.start();
    this.ambienceNodes.push(wind, windFilter, windGain);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain).connect(windGain.gain);
    lfo.start();
    this.ambienceNodes.push(lfo, lfoGain);
  }

  setAmbience(level: number): void {
    if (!this.ctx || !this.ambienceGain || !this.settings) return;
    this.ambienceGain.gain.setTargetAtTime(this.settings.ambienceVolume * 0.5 * level, this.ctx.currentTime, 0.4);
  }

  setMood(mood: MusicMood, theme?: MusicTheme): void {
    if (theme) this.theme = theme;
    else {
      const roots: Record<MusicMood, number> = {
        shore: 130.81, snow: 98, desert: 146.83, bamboo: 174.61, crown: 87.31,
        boss: 110, title: 146.83, ending: 110,
      };
      this.theme = { mood, root: roots[mood] ?? 130.81, scale: [0, 2, 3, 7, 10], bpm: mood === 'boss' ? 96 : 58 };
    }
    this.mood = mood;
    this.step = 0;
    this.bossIntensity = mood === 'boss' ? 0.7 : 0;
    if (this.started) this.stopScheduler();
    this.startScheduler();
  }

  setBossIntensity(value: number): void {
    this.bossIntensity = Math.max(0, Math.min(1, value));
  }

  duck(value: boolean): void {
    this.ducked = value;
    if (!this.ctx || !this.musicGain || !this.settings) return;
    const target = this.settings.musicVolume * (value ? 0.32 : 1);
    this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
  }

  private startScheduler(): void {
    if (!this.ctx || this.started) return;
    this.started = true;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.schedule(), 180);
  }

  private stopScheduler(): void {
    this.started = false;
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private schedule(): void {
    if (!this.ctx || !this.musicGain) return;
    const beat = 60 / Math.max(30, this.theme.bpm);
    while (this.nextNote < this.ctx.currentTime + 1.2) {
      this.playStep(this.step, this.nextNote, beat);
      this.step++;
      this.nextNote += beat;
    }
  }

  private playStep(step: number, when: number, beat: number): void {
    if (!this.ctx || !this.musicGain) return;
    const t = this.theme;
    const scale = t.scale;
    const progression = [0, 0, 5, 3, 0, 7, 5, 3];
    const chordOffset = progression[Math.floor(step / 4) % progression.length];
    const isBoss = this.mood === 'boss';

    if (step % 4 === 0) {
      this.drone(t.root * Math.pow(2, chordOffset / 12) / 2, when, beat * 3.6, isBoss ? 0.075 : 0.055);
      this.drone(t.root * Math.pow(2, chordOffset / 12) / 2 * 1.5, when, beat * 3.6, isBoss ? 0.028 : 0.022);
    }

    if (step % 2 === 0 && (this.mood !== 'title' || step % 4 === 0)) {
      const noteIndex = this.motifSeed[step % this.motifSeed.length] % scale.length;
      const octave = step % 9 === 0 ? 2 : 1;
      const freq = t.root * Math.pow(2, scale[noteIndex] / 12) * octave;
      this.pluck(freq, when, beat * (isBoss ? 0.5 : 1.3), isBoss ? 0.1 : 0.075);
    }

    if (isBoss && this.bossIntensity > 0.2 && step % (this.bossIntensity > 0.7 ? 1 : 2) === 0) {
      this.taiko(when, 0.1 + this.bossIntensity * 0.12);
    }

    if (step % 8 === 6 && (this.mood === 'shore' || this.mood === 'bamboo' || this.mood === 'snow')) {
      this.pluck(t.root * 2, when + beat * 0.5, beat * 2.2, 0.04);
    }
  }

  private drone(freq: number, when: number, duration: number, volume: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(volume, when + 0.6);
    gain.gain.setValueAtTime(volume, when + duration - 0.8);
    gain.gain.linearRampToValueAtTime(0, when + duration);
    osc.connect(filter).connect(gain).connect(this.musicGain);
    osc.start(when);
    osc.stop(when + duration + 0.1);
  }

  private pluck(freq: number, when: number, duration: number, volume: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, when);
    filter.frequency.exponentialRampToValueAtTime(420, when + duration);
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(volume, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(filter).connect(gain).connect(this.musicGain);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  }

  private taiko(when: number, volume: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, when);
    osc.frequency.exponentialRampToValueAtTime(48, when + 0.22);
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.34);
    osc.connect(gain).connect(this.musicGain);
    osc.start(when);
    osc.stop(when + 0.36);
  }

  // ── SFX ─────────────────────────────────────────────────────────────────
  sfx(name: string, intensity = 1): void {
    if (!this.ctx || !this.sfxGain) return;
    const when = this.ctx.currentTime;
    const vol = this.sfxGain;
    switch (name) {
      case 'sword_light':
        this.noiseSweep(when, 1800, 4800, 0.12, 0.16 * intensity);
        this.tone(when, 720, 240, 0.12, 'triangle', 0.05 * intensity);
        break;
      case 'sword_heavy':
        this.noiseSweep(when, 900, 2600, 0.2, 0.24 * intensity);
        this.tone(when, 180, 70, 0.22, 'sine', 0.12 * intensity);
        break;
      case 'art_release':
        this.noiseSweep(when, 400, 5200, 0.45, 0.3);
        this.tone(when, 90, 45, 0.6, 'sine', 0.22);
        this.tone(when + 0.05, 320, 140, 0.5, 'triangle', 0.12);
        break;
      case 'hit_flesh':
        this.noiseSweep(when, 120, 900, 0.14, 0.3 * intensity);
        this.tone(when, 130, 60, 0.16, 'sine', 0.2);
        break;
      case 'hit_metal':
        this.tone(when, 1680, 1420, 0.2, 'square', 0.09);
        this.tone(when + 0.005, 2420, 2100, 0.16, 'sine', 0.07);
        this.noiseSweep(when, 2400, 6000, 0.1, 0.16);
        break;
      case 'parry':
        this.tone(when, 2200, 1900, 0.32, 'sine', 0.14);
        this.tone(when, 3300, 2800, 0.28, 'triangle', 0.08);
        this.noiseSweep(when, 3000, 8000, 0.08, 0.2);
        break;
      case 'deathblow':
        this.tone(when, 70, 32, 0.7, 'sine', 0.35);
        this.noiseSweep(when, 300, 5000, 0.35, 0.3);
        this.tone(when + 0.1, 660, 220, 0.6, 'triangle', 0.12);
        break;
      case 'gong':
      case 'shrine':
        this.tone(when, 196, 190, 2.2, 'sine', 0.18);
        this.tone(when, 294, 292, 1.8, 'sine', 0.09);
        this.tone(when, 392, 390, 1.3, 'sine', 0.05);
        break;
      case 'footstep':
        this.noiseSweep(when, 80, 240, 0.06, 0.05);
        break;
      case 'heal':
        [523, 659, 784].forEach((f, i) => this.tone(when + i * 0.09, f, f, 0.5, 'sine', 0.07));
        break;
      case 'pickup':
        this.tone(when, 880, 880, 0.12, 'sine', 0.07);
        this.tone(when + 0.08, 1320, 1320, 0.2, 'sine', 0.06);
        break;
      case 'level':
        [392, 523, 659, 784].forEach((f, i) => this.tone(when + i * 0.1, f, f, 0.6, 'triangle', 0.08));
        break;
      case 'death':
        this.tone(when, 160, 55, 1.8, 'sawtooth', 0.08);
        this.noiseSweep(when, 600, 80, 1.4, 0.15);
        break;
      case 'boss_roar':
        this.tone(when, 90, 42, 1.1, 'sawtooth', 0.18);
        this.tone(when + 0.05, 120, 50, 1.0, 'square', 0.08);
        this.noiseSweep(when, 200, 1600, 0.7, 0.18);
        break;
      case 'bow':
        this.noiseSweep(when, 900, 2200, 0.08, 0.12);
        this.tone(when, 440, 220, 0.08, 'triangle', 0.04);
        break;
      case 'projectile':
        this.tone(when, 360, 180, 0.3, 'sine', 0.07);
        break;
      case 'explosion':
        this.noiseSweep(when, 600, 60, 0.7, 0.35);
        this.tone(when, 70, 30, 0.7, 'sine', 0.2);
        break;
      case 'ui':
        this.tone(when, 1200, 900, 0.05, 'sine', 0.035);
        break;
      case 'ui_confirm':
        this.tone(when, 660, 660, 0.12, 'sine', 0.05);
        this.tone(when + 0.07, 990, 990, 0.16, 'sine', 0.04);
        break;
      case 'dodge':
        this.noiseSweep(when, 300, 1200, 0.16, 0.08);
        break;
      case 'hitstop':
        this.tone(when, 60, 40, 0.08, 'sine', 0.2);
        break;
      case 'roar':
        this.tone(when, 140, 60, 0.6, 'sawtooth', 0.08);
        break;
      case 'bell':
        this.tone(when, 523, 520, 1.6, 'sine', 0.12);
        this.tone(when, 1046, 1040, 0.8, 'sine', 0.05);
        break;
      case 'rain':
        this.noiseSweep(when, 1400, 2000, 0.5, 0.04);
        break;
      default:
        break;
    }
  }

  private tone(when: number, from: number, to: number, duration: number, type: OscillatorType, volume: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, when);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), when + duration);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(volume, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  private noiseSweep(when: number, from: number, to: number, duration: number, volume: number): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(from, when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), when + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(volume, when + Math.min(0.02, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    src.connect(filter).connect(gain).connect(this.sfxGain);
    src.start(when);
    src.stop(when + duration + 0.02);
  }

  suspend(): void {
    this.ctx?.suspend().catch(() => undefined);
  }

  resume(): void {
    this.ctx?.resume().catch(() => undefined);
  }

  dispose(): void {
    this.stopScheduler();
    this.ambienceNodes.forEach((n) => {
      const src = n as AudioBufferSourceNode;
      if ('stop' in src) src.stop?.();
      n.disconnect();
    });
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }
}
