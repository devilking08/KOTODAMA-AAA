import * as THREE from 'three';
import type { Game } from '../engine/Game';
import type { ChapterDef, DialogueChoice, EndingDef, SaveData, SettingsData, ShrineDef, WeaponDef } from '../types';
import { CHAPTERS } from '../content/chapters';
import { CODEX, CODEX_CATEGORIES } from '../content/codex';
import { ITEMS, SKILL_TREES, SKILLS } from '../content/weapons';
import { ALL_QUESTS } from '../content/quests';
import { ACHIEVEMENTS } from '../content/achievements';
import type { PlayerStatsData } from '../types';

/**
 * All UI is DOM, styled by src/style.css. The game never touches the DOM
 * directly — it calls this surface, so the UI could be swapped wholesale
 * without touching a line of engine code.
 */

export interface BossSnapshot {
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  posture: number;
  maxPosture: number;
  phase: string;
  phaseIndex: number;
  boss: boolean;
}

const icon = (name: string): string => {
  const glyphs: Record<string, string> = {
    lantern: '◷', wave: '≈', bell: '◉', snow: '❄', flame: '♨', sand: '◈', leaf: '❧',
    twin: '⚔', mask: '◫', bride: '⚘', crown: '♛', road: '➤', stairs: '⌁', speak: '☍',
    silence: '❝', throne: '⌘', fox: '✦', memory: '◌', book: '▤', blade: '⚔', fist: '✊',
    claw: '⚷', wyrm: '≈', spider: '☷', ash: '෴', knot: '✽', scroll: '▤', parry: '◎',
    skull: '☠', oni: '👺', cycle: '⟳', torii: '⛩', key: '⚿', gourd: '◐', wave2: '≈',
    hand: '☞', item: '◈', quest: '✒', achievement: '★', lore: '❧', warning: '⚠', boss: '⚜',
    heart: '♥', shield: '⛨', blade2: '⚔', wind: '≋', step: '➤', boot: '◊', eye: '◉',
    hook: '⚓', spirit: '✧', coin: '◉', gourd2: '◐', wave3: '≈', siphon: '✧', crack: '⌁',
    skull2: '☠', stairs2: '⌁', road2: '➤', book2: '▤', key2: '⚿', seed: '◈', egg: '◈',
    bell2: '◉', flame2: '♨', leaf2: '❧', mask2: '◫', bride2: '⚘', crown2: '♛', road3: '➤',
  };
  return glyphs[name] ?? '✦';
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export class UI {
  readonly root: HTMLElement;
  private game!: Game;
  private fpsEl!: HTMLElement;
  private subtitleTimer = 0;

  // cached HUD refs
  private hudHealth!: HTMLElement;
  private hudPosture!: HTMLElement;
  private hudGourds!: HTMLElement;
  private hudResolve!: HTMLElement;
  private hudFlow!: HTMLElement;
  private hudWeapon!: HTMLElement;
  private hudXp!: HTMLElement;
  private hudEssence!: HTMLElement;
  private hudLevel!: HTMLElement;
  private objectiveEl!: HTMLElement;
  private promptEl!: HTMLElement;
  private promptKeyEl!: HTMLElement;
  private subtitleEl!: HTMLElement;
  private toastWrap!: HTMLElement;
  private bossEl!: HTMLElement;
  private bossHp!: HTMLElement;
  private bossPosture!: HTMLElement;
  private bossName!: HTMLElement;
  private bossPhase!: HTMLElement;
  private chapterCardEl!: HTMLElement;
  private letterboxEl!: HTMLElement;
  private cineTitleEl!: HTMLElement;
  private fadeEl!: HTMLElement;
  private dialogueEl!: HTMLElement;
  private dialogueText!: HTMLElement;
  private dialogueSpeaker!: HTMLElement;
  private dialogueChoicesEl!: HTMLElement;
  private deathEl!: HTMLElement;
  private pauseEl!: HTMLElement;
  private journalEl!: HTMLElement;
  private mapEl!: HTMLElement;
  private skillsEl!: HTMLElement;
  private codexEl!: HTMLElement;
  private shrineEl!: HTMLElement;
  private endingEl!: HTMLElement;
  private photoEl!: HTMLElement;
  private creditsEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private pauseTab = 'settings';
  private pendingChoices: DialogueChoice[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
    this.buildStatic();
  }

  attach(game: Game): void {
    this.game = game;
    this.game.events.on('ui:toast', (p) => this.toast(p.title, p.text, p.kind, p.icon, p.duration));
    this.game.events.on('ui:achievement', (p) => {
      this.toast(`Achievement — ${p.achievement.name}`, p.achievement.description, 'achievement', '★', 5200);
    });
    this.game.events.on('player:parry', (p) => {
      this.damagePopup('PERFECT', p.position, 'parry');
    });
    this.game.events.on('player:dodge', (p) => {
      if (p.perfect) this.damagePopup('PERFECT', { x: this.game.player.position.x, y: this.game.player.position.y + 1.4, z: this.game.player.position.z }, 'dodge');
    });
    this.game.events.on('ui:damage', (p) => {
      this.damagePopup(String(Math.round(p.amount)), p.position, p.kind);
    });
    this.game.events.on('ui:objective', (p) => {
      this.setObjective(p.text, p.sub);
    });
    this.game.events.on('game:death', () => {
      this.game.respawn();
    });
  }

  applySettings(settings: SettingsData): void {
    const html = document.documentElement;
    html.dataset.colorblind = settings.colorblind;
    html.dataset.quality = settings.quality;
    html.classList.toggle('kurosawa', settings.kurosawaMode);
    html.classList.toggle('reduce-motion', settings.reduceMotion);
    html.classList.toggle('photosensitive', settings.photosensitivity);
    html.dataset.subtitleSize = settings.subtitleSize;
    html.classList.toggle('subtitle-bg', settings.subtitleBackground);
    // Touch controls: only when explicitly on, or auto on true touch-only
    // devices. A desktop user with a stale "auto" save must not see the grid.
    const touchOnly = window.matchMedia('(hover: none)').matches;
    const touch = settings.touchControls === 'on' || (settings.touchControls === 'auto' && touchOnly);
    html.classList.toggle('touch', touch);
    html.classList.toggle('touch-auto', !touch && settings.touchControls === 'auto');
    this.updateSettingsForm();
  }

  /* ── Static shell ────────────────────────────────────────────────────── */

  private buildStatic(): void {
    this.titleEl = this.section('title-screen', `
      <div class="title-seal">言</div>
      <h1 class="title-name">KOTODAMA</h1>
      <div class="title-sub">Echoes of the Nameless</div>
      <div class="title-tag">A ten-chapter browser action game · 6 regions · 10 bosses · 4 endings</div>
      <div class="title-menu">
        <button data-action="continue">Continue</button>
        <button data-action="new">New Game</button>
        <button data-action="load">Load</button>
        <button data-action="settings">Settings</button>
        <button data-action="credits">Credits</button>
      </div>
      <div class="title-slots hidden"></div>
      <div class="title-hint">K / M / B — journal, map, codex · Esc — pause · 点击 start with Continue.</div>
    `);
    this.titleEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button') as HTMLElement | null;
      if (!btn) return;
      const action = btn.dataset.action;
      const slot = Number(btn.dataset.slot ?? 0);
      if (action === 'continue') this.game.continueGame();
      else if (action === 'new') this.startNewFlow();
      else if (action === 'load') this.renderSlots();
      else if (action === 'settings') this.showSettingsFromTitle();
      else if (action === 'credits') this.showCredits();
      else if (action === 'pick-slot') {
        if (slot > 0) {
          const data = this.game.saves.load(slot);
          if (data) this.game.loadGame(data);
        }
      } else if (action === 'new-slot') {
        this.game.newGame(slot || 1);
      } else if (action === 'delete-slot') {
        this.game.saves.delete(slot);
        this.renderSlots();
      } else if (action === 'back') {
        this.titleEl.querySelector('.title-slots')?.classList.add('hidden');
      }
    });

    this.fpsEl = this.div('fps hidden');

    this.hudHud(); // builds HUD scaffolding
    this.bossEl = this.div('bossbar hidden');
    this.bossEl.innerHTML = `
      <div id="boss-name"></div>
      <div id="boss-phase"></div>
      <div class="boss-track"><div id="boss-hp"></div></div>
      <div class="boss-track posture"><div id="boss-posture"></div></div>
    `;
    this.bossHp = this.bossEl.querySelector('#boss-hp') as HTMLElement;
    this.bossPosture = this.bossEl.querySelector('#boss-posture') as HTMLElement;
    this.bossName = this.bossEl.querySelector('#boss-name') as HTMLElement;
    this.bossPhase = this.bossEl.querySelector('#boss-phase') as HTMLElement;

    this.objectiveEl = this.div('objective hidden');
    this.promptEl = this.div('prompt hidden');
    this.promptKeyEl = this.div('prompt-key');
    this.promptEl.appendChild(this.promptKeyEl);
    this.subtitleEl = this.div('subtitle hidden');
    this.toastWrap = this.div('toasts');
    this.chapterCardEl = this.div('chapter-card hidden');
    this.letterboxEl = this.div('letterbox hidden');
    this.cineTitleEl = this.div('cine-title hidden');
    this.fadeEl = this.div('fade');
    this.fadeEl.style.opacity = '0';
    this.fadeEl.style.pointerEvents = 'none';

    this.deathEl = this.section('death-screen hidden', `
      <div class="death-title">死</div>
      <div class="death-sub">You are dead. The world remembers.</div>
      <div class="death-note">Essence lost: 12%</div>
      <button data-action="respawn">Rise Again</button>
    `);
    this.deathEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-action="respawn"]')) this.game.respawn();
    });

    this.pauseEl = this.section('pause-screen hidden', `
      <div class="panel-head">Paused</div>
      <div class="tabs">
        <button data-tab="settings" class="active">Settings</button>
        <button data-tab="inventory">Inventory</button>
        <button data-tab="achievements">Achievements</button>
        <button data-tab="save">Save</button>
      </div>
      <div class="tab-body" data-body="settings"></div>
      <div class="tab-body hidden" data-body="inventory"></div>
      <div class="tab-body hidden" data-body="achievements"></div>
      <div class="tab-body hidden" data-body="save"></div>
      <div class="pause-actions">
        <button data-action="resume">Resume</button>
        <button data-action="quit">Quit to Title</button>
      </div>
    `);
    this.pauseEl.addEventListener('click', (e) => {
      const tab = (e.target as HTMLElement).closest('[data-tab]') as HTMLElement | null;
      if (tab) {
        this.pauseTab = tab.dataset.tab as string;
        this.pauseEl.querySelectorAll('[data-tab]').forEach((t) => t.classList.toggle('active', t === tab));
        this.pauseEl.querySelectorAll('[data-body]').forEach((b) => b.classList.toggle('hidden', (b as HTMLElement).dataset.body !== this.pauseTab));
        this.refreshPauseTab();
        return;
      }
      const action = ((e.target as HTMLElement).closest('[data-action]') as HTMLElement | null)?.dataset.action;
      if (action === 'resume') this.game.togglePause();
      else if (action === 'quit') {
        this.game.quitToTitle();
        this.hidePause();
      }
    });

    this.journalEl = this.section('journal-screen hidden', `
      <div class="panel-head">Journal <span class="hint">N to close</span></div>
      <div class="journal-body"></div>
      <button data-action="close" class="panel-close">Close</button>
    `);
    this.journalEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-action="close"]')) this.closeMenu();
    });

    this.mapEl = this.section('map-screen hidden', `
      <div class="panel-head">Map <span class="hint">M to close</span></div>
      <div class="map-body"></div>
      <button data-action="close" class="panel-close">Close</button>
    `);
    this.mapEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-action="close"]')) this.closeMenu();
    });

    this.skillsEl = this.section('skills-screen hidden', `
      <div class="panel-head">Skills <span class="hint">K to close</span></div>
      <div class="skills-body"></div>
      <button data-action="close" class="panel-close">Close</button>
    `);
    this.skillsEl.addEventListener('click', (e) => {
      const close = (e.target as HTMLElement).closest('[data-action="close"]');
      if (close) {
        this.closeMenu();
        return;
      }
      const buy = (e.target as HTMLElement).closest('[data-skill]') as HTMLElement | null;
      if (buy) {
        const id = buy.dataset.skill as string;
        if (this.game.purchaseSkill(id)) {
          this.toast('Skill', `${SKILLS[id]?.name ?? ''} learned.`, 'quest', '✧', 2200);
          this.renderSkills();
        } else {
          this.toast('Cannot learn', 'Not enough skill points or requirements unmet.', 'warning');
        }
      }
    });

    this.codexEl = this.section('codex-screen hidden', `
      <div class="panel-head">Codex <span class="hint">B to close</span></div>
      <div class="codex-wrap"><div class="codex-cats"></div><div class="codex-list"></div><div class="codex-detail"></div></div>
      <button data-action="close" class="panel-close">Close</button>
    `);
    this.codexEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-action="close"]')) this.closeMenu();
      const cat = (e.target as HTMLElement).closest('[data-cat]') as HTMLElement | null;
      if (cat) this.renderCodex(cat.dataset.cat as string);
      const entry = (e.target as HTMLElement).closest('[data-entry]') as HTMLElement | null;
      if (entry) this.showCodexEntry(entry.dataset.entry as string);
    });

    this.shrineEl = this.section('shrine-screen hidden', `
      <div class="panel-head">Shrine</div>
      <div class="shrine-greeting"></div>
      <div class="shrine-actions">
        <button data-action="rest">Rest — heal, refill gourds, save</button>
        <button data-action="travel">Travel — visit a discovered shrine</button>
      </div>
      <div class="shrine-travel hidden"></div>
      <button data-action="leave" class="panel-close">Leave</button>
    `);
    this.shrineEl.addEventListener('click', (e) => {
      const action = ((e.target as HTMLElement).closest('[data-action]') as HTMLElement | null)?.dataset.action;
      if (action === 'leave') {
        this.hideShrine();
      } else if (action === 'rest') {
        this.game.doRest();
      } else if (action === 'travel') {
        this.shrineEl.querySelector('.shrine-travel')?.classList.toggle('hidden');
      } else if (action === 'travel-to') {
        const id = (e.target as HTMLElement).closest('[data-travel]')?.getAttribute('data-travel');
        if (id) {
          this.game.travelToShrine(id);
          this.hideShrine();
        }
      }
    });

    this.endingEl = this.section('ending-screen hidden', `
      <div class="ending-inner"></div>
    `);

    this.creditsEl = this.section('credits-screen hidden', `
      <div class="credits-inner">
        <div class="credits-title">KOTODAMA</div>
        <div class="credits-sub">Echoes of the Nameless</div>
        <div class="credits-role">Design & Engineering</div>
        <div class="credits-name">Procedural Studio — a single-authored browser title</div>
        <div class="credits-role">Engine</div>
        <div class="credits-name">Three.js · Vite · TypeScript</div>
        <div class="credits-role">Music & Sound</div>
        <div class="credits-name">Synthesised in Web Audio — no samples</div>
        <div class="credits-role">Art</div>
        <div class="credits-name">Procedural cel-shaded world, entirely code-generated</div>
        <div class="credits-thanks">The words are all yours. Go speak them.</div>
        <button data-action="back">Return to Title</button>
      </div>
    `);
    this.creditsEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-action="back"]')) {
        this.creditsEl.classList.add('hidden');
        this.titleEl.classList.remove('hidden');
      }
    });

    this.photoEl = this.section('photo-screen hidden', `
      <div class="photo-hud">
        <div class="photo-title">PHOTO MODE</div>
        <div class="photo-hint">Mouse — orbit · Wheel — zoom · P — exit · S — save PNG</div>
        <button data-action="save">Save PNG</button>
        <button data-action="exit">Exit</button>
      </div>
    `);
    this.photoEl.addEventListener('click', (e) => {
      const action = ((e.target as HTMLElement).closest('[data-action]') as HTMLElement | null)?.dataset.action;
      if (action === 'exit') this.game.togglePhoto();
      else if (action === 'save') this.saveScreenshot();
    });

    this.dialogueEl = this.div('dialogue hidden');
    this.dialogueSpeaker = this.div('dialogue-speaker');
    this.dialogueText = this.div('dialogue-text');
    this.dialogueChoicesEl = this.div('dialogue-choices');
    this.dialogueEl.append(this.dialogueSpeaker, this.dialogueText, this.dialogueChoicesEl);

    const touchRoot = this.div('touch-root');
    touchRoot.id = 'touch-root';
    touchRoot.innerHTML = `
      <div id="touch-look"></div>
      <div id="touch-stick"><div id="touch-knob"></div></div>
      <div id="touch-actions">
        <div class="touch-btn" data-touch="light">△</div>
        <div class="touch-btn" data-touch="heavy">▼</div>
        <div class="touch-btn" data-touch="guard">◭</div>
        <div class="touch-btn" data-touch="dodge">◉</div>
        <div class="touch-btn" data-touch="sprint">»</div>
        <div class="touch-btn" data-touch="heal">◐</div>
        <div class="touch-btn" data-touch="interact">E</div>
        <div class="touch-btn" data-touch="special">F</div>
        <div class="touch-btn" data-touch="lockOn">◎</div>
        <div class="touch-btn" data-touch="item">X</div>
        <div class="touch-btn" data-touch="grapple">G</div>
        <div class="touch-btn" data-touch="journal">N</div>
      </div>
    `;
    this.root.appendChild(touchRoot);

    this.root.append(
      this.titleEl, this.fpsEl, this.objectiveEl, this.promptEl, this.subtitleEl,
      this.toastWrap, this.bossEl, this.chapterCardEl, this.dialogueEl, this.deathEl,
      this.pauseEl, this.journalEl, this.mapEl, this.skillsEl, this.codexEl,
      this.shrineEl, this.endingEl, this.creditsEl, this.photoEl,
      this.letterboxEl, this.cineTitleEl, this.fadeEl,
    );
  }

  private hudHud(): void {
    const hud = this.div('hud hidden');
    hud.innerHTML = `
      <div class="hud-left">
        <div class="stat-block">
          <div class="stat-label">VITALITY</div>
          <div class="bar hp"><div id="hud-health"></div></div>
          <div class="bar posture"><div id="hud-posture"></div></div>
          <div class="stat-row">
            <span id="hud-gourds">◐ 3</span>
            <span id="hud-resolve">◆ 0</span>
            <span id="hud-flow">≈ 0</span>
          </div>
        </div>
        <div class="stat-block weapon-block">
          <div id="hud-weapon">Katana</div>
          <div id="hud-xp">LV 1 — XP 0/220</div>
          <div id="hud-essence">◉ 0</div>
        </div>
      </div>
      <div class="hud-right">
        <div class="hud-region"></div>
        <div class="hud-lockon hidden">◎</div>
      </div>
    `;
    this.hudHealth = hud.querySelector('#hud-health') as HTMLElement;
    this.hudPosture = hud.querySelector('#hud-posture') as HTMLElement;
    this.hudGourds = hud.querySelector('#hud-gourds') as HTMLElement;
    this.hudResolve = hud.querySelector('#hud-resolve') as HTMLElement;
    this.hudFlow = hud.querySelector('#hud-flow') as HTMLElement;
    this.hudWeapon = hud.querySelector('#hud-weapon') as HTMLElement;
    this.hudXp = hud.querySelector('#hud-xp') as HTMLElement;
    this.hudEssence = hud.querySelector('#hud-essence') as HTMLElement;
    this.root.appendChild(hud);
  }

  /* ── Title ───────────────────────────────────────────────────────────── */

  showTitle(): void {
    this.hideAllScreens();
    this.titleEl.classList.remove('hidden');
    this.renderSlots();
    this.game.mode = 'title';
  }

  private startNewFlow(): void {
    const slotBox = this.titleEl.querySelector('.title-slots') as HTMLElement;
    slotBox.classList.toggle('hidden');
    if (!slotBox.classList.contains('hidden')) {
      slotBox.innerHTML = `
        <div class="title-slots-label">Choose a save slot</div>
        ${[1, 2, 3].map((n) => {
          const data = this.game.saves.load(n);
          return `<button data-action="new-slot" data-slot="${n}" class="slot-card">
            <span class="slot-num">Slot ${n}</span>
            <span class="slot-info">${data ? `${CHAPTERS[data.chapter]?.title ?? 'Chapter ' + data.chapter} · ${Math.floor(data.playtime / 60)} min` : 'Empty'}</span>
          </button>`;
        }).join('')}
        <button data-action="back" class="slot-back">Back</button>
      `;
    }
  }

  private renderSlots(): void {
    const slots = this.game.saves.listSlots();
    const box = this.titleEl.querySelector('.title-slots') as HTMLElement;
    box.classList.remove('hidden');
    box.innerHTML = `
      <div class="title-slots-label">Save Slots</div>
      <div class="slot-grid">
        ${slots.map((s) => {
          const d = s.data;
          return `<div class="slot-card">
            <div class="slot-num">${s.auto ? 'Auto' : 'Slot ' + s.slot}</div>
            ${d ? `<div class="slot-info">
                <div>${esc(CHAPTERS[d.chapter]?.title ?? 'Chapter ' + d.chapter)}</div>
                <div>${esc(d.region)} · ${Math.floor(d.playtime / 60)}m · LV ${d.stats.level}</div>
                <div class="slot-actions">
                  <button data-action="pick-slot" data-slot="${s.slot}">Continue</button>
                  <button data-action="delete-slot" data-slot="${s.slot}" class="danger">Delete</button>
                </div>
              </div>` : `<div class="slot-info empty">No save</div>`}
          </div>`;
        }).join('')}
      </div>
      <button data-action="back" class="slot-back">Back</button>
    `;
  }

  /* ── HUD ─────────────────────────────────────────────────────────────── */

  showHud(): void {
    this.root.querySelector('.hud')?.classList.remove('hidden');
    this.objectiveEl.classList.remove('hidden');
  }

  setObjective(text: string, sub?: string): void {
    this.objectiveEl.innerHTML = `<div class="objective-text">${esc(text)}</div>${sub ? `<div class="objective-sub">${esc(sub)}</div>` : ''}`;
    this.objectiveEl.classList.remove('hidden');
  }

  hud(stats: PlayerStatsData, weapon: WeaponDef, save: SaveData): void {
    if (!this.hudHealth) return;
    const hpPct = Math.max(0, Math.min(1, stats.health / Math.max(1, stats.maxHealth)));
    const poPct = Math.max(0, Math.min(1, stats.posture / Math.max(1, stats.maxPosture)));
    this.hudHealth.style.width = `${hpPct * 100}%`;
    this.hudPosture.style.width = `${poPct * 100}%`;
    this.hudHealth.classList.toggle('low', hpPct < 0.3);
    this.hudGourds.textContent = `◐ ${stats.gourds}/${stats.maxGourds}`;
    this.hudResolve.textContent = `◆ ${Math.floor(stats.resolve)}/${Math.floor(stats.maxResolve)}`;
    this.hudFlow.textContent = `≈ ${Math.floor(stats.flow)}`;
    this.hudFlow.classList.toggle('full', stats.flow >= 100);
    this.hudWeapon.textContent = weapon.name;
    this.hudXp.textContent = `LV ${stats.level} — XP ${stats.xp}/${stats.xpNext}`;
    this.hudEssence.textContent = `◉ ${stats.essence}`;
    const regionEl = this.root.querySelector('.hud-region');
    if (regionEl) regionEl.textContent = save.region;
    const lockEl = this.root.querySelector('.hud-lockon') as HTMLElement;
    lockEl.classList.toggle('hidden', !this.game.player.lockedTarget);
  }

  prompt(text: string, key: string, visible: boolean): void {
    if (!visible) {
      this.promptEl.classList.add('hidden');
      return;
    }
    this.promptEl.innerHTML = '';
    const label = this.div('prompt-label', esc(text));
    this.promptEl.appendChild(label);
    if (key) {
      this.promptKeyEl.textContent = key;
      this.promptEl.appendChild(this.promptKeyEl);
    }
    this.promptEl.classList.remove('hidden');
  }

  subtitle(speaker: string, text: string, duration: number): void {
    if (duration <= 0 || !text) {
      this.subtitleEl.classList.add('hidden');
      this.subtitleTimer = 0;
      return;
    }
    this.subtitleEl.innerHTML = `${speaker ? `<div class="subtitle-speaker">${esc(speaker)}</div>` : ''}<div class="subtitle-text">${esc(text)}</div>`;
    this.subtitleEl.classList.remove('hidden');
    this.subtitleTimer = Math.max(this.subtitleTimer, duration);
  }

  setFps(v: number): void {
    this.fpsEl.textContent = `${Math.round(v)} FPS`;
    this.fpsEl.classList.remove('hidden');
  }

  bossBar(snapshot: BossSnapshot | null): void {
    if (!snapshot) {
      this.bossEl.classList.add('hidden');
      return;
    }
    this.bossEl.classList.remove('hidden');
    this.bossName.textContent = `${snapshot.name} — ${snapshot.title}`;
    this.bossPhase.textContent = snapshot.phase;
    const hp = Math.max(0, Math.min(1, snapshot.hp / Math.max(1, snapshot.maxHp)));
    const po = Math.max(0, Math.min(1, snapshot.posture / Math.max(1, snapshot.maxPosture)));
    this.bossHp.style.width = `${hp * 100}%`;
    this.bossPosture.style.width = `${po * 100}%`;
  }

  chapterCard(chapter: ChapterDef): void {
    this.chapterCardEl.innerHTML = `
      <div class="chapter-card-number">CHAPTER ${chapter.index === 0 ? 'Prologue' : chapter.index}</div>
      <div class="chapter-card-title">${esc(chapter.title)}</div>
      <div class="chapter-card-kanji">${esc(chapter.kanji)}</div>
      <div class="chapter-card-sub">${esc(chapter.subtitle)}</div>
    `;
    this.chapterCardEl.classList.remove('hidden');
    setTimeout(() => this.chapterCardEl.classList.add('hidden'), 3800);
  }

  /* ── Toasts & damage numbers ─────────────────────────────────────────── */

  toast(title: string, text?: string, kind: string = 'item', iconName?: string, duration = 2800): void {
    const t = this.div(`toast kind-${esc(kind)}`);
    t.innerHTML = `
      ${iconName || kind === 'achievement' || kind === 'quest' ? `<span class="toast-icon">${icon(iconName ?? (kind === 'achievement' ? 'achievement' : kind === 'quest' ? 'quest' : 'item'))}</span>` : ''}
      <div class="toast-body"><div class="toast-title">${esc(title)}</div>${text ? `<div class="toast-text">${esc(text)}</div>` : ''}</div>
    `;
    this.toastWrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => {
      t.classList.remove('in');
      setTimeout(() => t.remove(), 500);
    }, duration);
  }

  private damagePopup(text: string, pos: { x: number; y: number; z: number }, kind: string): void {
    if (!this.game.settings.damageNumbers) return;
    const p = this.game.camera.project(new THREE.Vector3(pos.x, pos.y, pos.z));
    if (!p.visible) return;
    const el = this.div(`dmg dmg-${esc(kind)}`);
    el.textContent = text;
    el.style.left = `${p.x + (Math.random() - 0.5) * 20}px`;
    el.style.top = `${p.y}px`;
    this.root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    setTimeout(() => el.remove(), 900);
  }

  /* ── Dialogue ────────────────────────────────────────────────────────── */

  dialogueOpen(_id: string): void {
    this.dialogueEl.classList.remove('hidden');
    this.dialogueChoicesEl.innerHTML = '';
    this.pendingChoices = [];
    // The conversation takes over the screen: hide the interaction prompt and
    // dim the combat chrome so nothing competes with the speaking character.
    this.promptEl.classList.add('hidden');
    this.pauseEl.classList.add('hidden');
    document.documentElement.classList.add('dialog-active');
  }

  dialogueLine(speaker: string, text: string): void {
    this.dialogueSpeaker.textContent = speaker;
    this.dialogueText.textContent = text;
  }

  dialogueChoices(choices: DialogueChoice[]): void {
    this.pendingChoices = choices;
    this.dialogueChoicesEl.innerHTML = '';
    choices.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-choice';
      btn.textContent = c.text;
      btn.addEventListener('click', () => this.game.onDialogueChoice(i));
      this.dialogueChoicesEl.appendChild(btn);
    });
  }

  dialogueClose(): void {
    this.dialogueEl.classList.add('hidden');
    this.dialogueChoicesEl.innerHTML = '';
    this.pendingChoices = [];
    this.dialogueText.textContent = '';
    this.dialogueSpeaker.textContent = '';
    document.documentElement.classList.remove('dialog-active');
  }

  /* ── Cinematics ──────────────────────────────────────────────────────── */

  letterbox(on: boolean): void {
    this.letterboxEl.classList.toggle('hidden', !on);
  }

  hideLetterbox(): void {
    this.letterboxEl.classList.add('hidden');
  }

  cinematicTitle(text: string): void {
    this.cineTitleEl.textContent = text;
    this.cineTitleEl.classList.remove('hidden');
    setTimeout(() => this.cineTitleEl.classList.add('hidden'), 3600);
  }

  hideCinematicTitle(): void {
    this.cineTitleEl.classList.add('hidden');
  }

  fadeOverlay(value: number, duration = 0.8): void {
    this.fadeEl.style.transition = `opacity ${duration}s ease`;
    this.fadeEl.style.opacity = String(Math.max(0, Math.min(1, value)));
    this.fadeEl.style.pointerEvents = value > 0.5 ? 'all' : 'none';
  }

  /* ── Shrine ──────────────────────────────────────────────────────────── */

  showShrine(shrine: ShrineDef, travelTargets: Array<{ id: string; name: string; region: string; chapter: number }>): void {
    this.shrineEl.querySelector('.shrine-greeting')!.innerHTML = `
      <div class="shrine-name">${esc(shrine.name)}</div>
      <div class="shrine-desc">${esc(shrine.description)}</div>
    `;
    const travel = this.shrineEl.querySelector('.shrine-travel') as HTMLElement;
    travel.innerHTML = '<div class="shrine-travel-label">Travel to a discovered shrine:</div>' +
      travelTargets.map((t) => `<button data-action="travel-to" data-travel="${esc(t.id)}" class="travel-option"><span>${esc(t.name)}</span><span class="travel-region">${esc(t.region)}</span></button>`).join('');
    this.shrineEl.classList.remove('hidden');
    this.game.mode = 'paused';
  }

  hideShrine(): void {
    this.shrineEl.classList.add('hidden');
    if (this.game.mode === 'paused') this.game.mode = 'playing';
  }

  /* ── Death / pause / menus ───────────────────────────────────────────── */

  showDeath(): void {
    this.deathEl.classList.remove('hidden');
  }

  hideDeath(): void {
    this.deathEl.classList.add('hidden');
  }

  showPause(): void {
    this.pauseEl.classList.remove('hidden');
    this.refreshPauseTab();
  }

  hidePause(): void {
    this.pauseEl.classList.add('hidden');
    this.game.mode = 'playing';
  }

  private refreshPauseTab(): void {
    if (this.pauseTab === 'inventory') this.renderInventory();
    else if (this.pauseTab === 'achievements') this.renderAchievements();
    else if (this.pauseTab === 'save') this.renderSaveOptions();
    else this.renderSettingsForm();
  }

  showJournal(): void {
    this.journalEl.classList.remove('hidden');
    this.renderJournal();
  }

  showMap(): void {
    this.mapEl.classList.remove('hidden');
    this.renderMap();
  }

  showSkills(): void {
    this.skillsEl.classList.remove('hidden');
    this.renderSkills();
  }

  showCodex(): void {
    this.codexEl.classList.remove('hidden');
    this.renderCodex('all');
  }

  private closeMenu(): void {
    this.journalEl.classList.add('hidden');
    this.mapEl.classList.add('hidden');
    this.skillsEl.classList.add('hidden');
    this.codexEl.classList.add('hidden');
    if (this.game.mode === 'paused') this.game.mode = 'playing';
  }

  /* ── Journal / map ───────────────────────────────────────────────────── */

  private renderJournal(): void {
    const body = this.journalEl.querySelector('.journal-body') as HTMLElement;
    const save = this.game.save;
    const entries: string[] = [];
    for (const [id, st] of Object.entries(save.quests)) {
      const def = ALL_QUESTS[id];
      if (!def) continue;
      if (st.status === 'complete') {
        entries.push(`<div class="quest complete"><div class="quest-title">${esc(def.title)}</div><div class="quest-state">Complete</div></div>`);
        continue;
      }
      if (st.status !== 'active') continue;
      const stage = def.stages[st.stage];
      const stageText = stage ? stage.text : '';
      const hint = stage?.hint ? `<div class="quest-hint">${esc(stage.hint)}</div>` : '';
      entries.push(`<div class="quest"><div class="quest-title">${esc(def.title)} <span class="quest-type">${esc(def.type)}</span></div>
        <div class="quest-stage">${esc(stageText)}</div>${hint}</div>`);
    }
    body.innerHTML = entries.length ? entries.join('') : '<div class="empty-note">No active quests.</div>';
  }

  private renderMap(): void {
    const body = this.mapEl.querySelector('.map-body') as HTMLElement;
    const save = this.game.save;
    const regionNames: Record<string, string> = {
      shore: 'The Shore of Broken Words', bell_island: 'The Drowned Bell', snow: 'The White Silence',
      desert: 'The Drowned Dunes', bamboo: 'The Bamboo Requiem', crown: 'The Hollow Crown',
    };
    const shrines = save.discoveredShrines;
    const html = Object.entries(regionNames).map(([id, name]) => {
      const visited = save.visitedRegions.includes(id);
      return `<div class="map-region ${visited ? 'visited' : ''}">
        <div class="map-region-name">${esc(name)}</div>
        <div class="map-region-shrines">${visited ? 'Shrines found: ' + shrines.length : 'Not yet travelled'}</div>
      </div>`;
    }).join('');
    body.innerHTML = `<div class="map-intro">The world is six regions. Travel between discovered shrines at any shrine.</div>${html}`;
  }

  /* ── Skills ──────────────────────────────────────────────────────────── */

  private renderSkills(): void {
    const body = this.skillsEl.querySelector('.skills-body') as HTMLElement;
    const save = this.game.save;
    const points = save.stats.skillPoints;
    const head = `<div class="skills-points">Skill Points: <b>${points}</b></div>`;
    const trees = (Object.keys(SKILL_TREES) as Array<keyof typeof SKILL_TREES>).map((tree) => {
      const skills = SKILL_TREES[tree].map((id) => {
        const def = SKILLS[id];
        const rank = save.skills[id] ?? 0;
        const maxed = rank >= def.maxRank;
        const locked = def.requires?.some((r) => (save.skills[r] ?? 0) <= 0);
        return `<div class="skill-row ${maxed ? 'maxed' : ''} ${locked && rank === 0 ? 'locked' : ''}">
          <div class="skill-name">${icon(def.icon)} ${esc(def.name)} <span class="skill-rank">${rank}/${def.maxRank}</span></div>
          <div class="skill-desc">${esc(def.description)}</div>
          ${locked && rank === 0 ? '<div class="skill-locked">Requires a previous skill</div>' : maxed ? '<div class="skill-maxed">MAX</div>' : `<button data-skill="${id}" class="skill-buy">Learn (${def.cost} pt)</button>`}
        </div>`;
      }).join('');
      return `<div class="skill-tree"><div class="skill-tree-name">${esc(tree)}</div>${skills}</div>`;
    }).join('');
    body.innerHTML = head + trees;
  }

  /* ── Codex ───────────────────────────────────────────────────────────── */

  private renderCodex(cat: string): void {
    const save = this.game.save;
    const cats = this.codexEl.querySelector('.codex-cats') as HTMLElement;
    cats.innerHTML = `<button data-cat="all" class="${cat === 'all' ? 'active' : ''}">All</button>` +
      CODEX_CATEGORIES.map((c) => `<button data-cat="${c}" class="${cat === c ? 'active' : ''}">${esc(c)}</button>`).join('');
    const list = this.codexEl.querySelector('.codex-list') as HTMLElement;
    const entries = Object.values(CODEX).filter((e) => save.codex.includes(e.id) && (cat === 'all' || e.category === cat));
    list.innerHTML = entries.length
      ? entries.map((e) => `<div class="codex-entry" data-entry="${esc(e.id)}">${esc(e.title)}</div>`).join('')
      : '<div class="empty-note">No entries yet.</div>';
  }

  private showCodexEntry(id: string): void {
    const detail = this.codexEl.querySelector('.codex-detail') as HTMLElement;
    const e = CODEX[id];
    if (!e) return;
    detail.innerHTML = `<div class="codex-detail-title">${esc(e.title)}</div><div class="codex-detail-cat">${esc(e.category)}</div><div class="codex-detail-text">${esc(e.text)}</div>`;
  }

  /* ── Inventory / achievements / save / settings ──────────────────────── */

  private renderInventory(): void {
    const body = this.pauseEl.querySelector('[data-body="inventory"]') as HTMLElement;
    const save = this.game.save;
    const rows = Object.entries(ITEMS).map(([id, def]) => {
      const count = save.inventory[id] ?? 0;
      const equipped = this.game.equippedConsumable === id;
      return `<div class="inv-row">
        <div class="inv-name">${icon(def.icon)} ${esc(def.name)} ${equipped ? '<span class="inv-equipped">EQUIPPED</span>' : ''}</div>
        <div class="inv-desc">${esc(def.description)}</div>
        <div class="inv-count">× ${count}</div>
        ${count > 0 && ['heal', 'attack', 'smoke', 'health', 'posture'].includes(def.effect ?? '') ? `<button data-use="${id}" class="inv-use">Use</button>` : ''}
      </div>`;
    }).join('');
    body.innerHTML = `<div class="inv-head">Inventory</div>${rows}`;
    const use = body.querySelector('[data-use]');
    if (use) {
      use.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).dataset.use as string;
        this.game.tryConsumeItem(id);
        this.renderInventory();
      });
    }
  }

  private renderAchievements(): void {
    const body = this.pauseEl.querySelector('[data-body="achievements"]') as HTMLElement;
    const save = this.game.save;
    const list = ACHIEVEMENTS;
    body.innerHTML = `<div class="inv-head">Achievements — ${save.achievements.length}/${list.length}</div>` +
      list.map((a) => {
        const got = save.achievements.includes(a.id);
        return `<div class="ach-row ${got ? 'got' : ''}"><span class="ach-icon">${icon(a.icon)}</span><div><div class="ach-name">${esc(a.name)}</div><div class="ach-desc">${esc(a.description)}</div></div>${got ? '<span class="ach-got">✓</span>' : ''}</div>`;
      }).join('');
  }

  private renderSaveOptions(): void {
    const body = this.pauseEl.querySelector('[data-body="save"]') as HTMLElement;
    body.innerHTML = `
      <div class="inv-head">Save</div>
      <div class="save-options">
        ${[1, 2, 3].map((n) => {
          const d = this.game.saves.load(n);
          return `<button data-save="${n}" class="save-option"><span>Slot ${n}</span><span>${d ? esc(CHAPTERS[d.chapter]?.title ?? 'Chapter') + ' · ' + Math.floor(d.playtime / 60) + 'm' : 'Empty'}</span></button>`;
        }).join('')}
        <button data-save="0" class="save-option"><span>Autosave</span><span>Latest checkpoint</span></button>
      </div>
    `;
    body.querySelectorAll('[data-save]').forEach((b) => {
      b.addEventListener('click', () => {
        const slot = Number((b as HTMLElement).dataset.save);
        if (slot === 0) this.game.autosave(true);
        else this.game.saveToSlot(slot);
        this.renderSaveOptions();
      });
    });
  }

  private updateSettingsForm(): void {
    if (this.pauseEl.classList.contains('hidden')) return;
    this.renderSettingsForm();
  }

  private settingsFormHtml(): string {
    const s = this.game.settings;
    const slider = (label: string, key: keyof SettingsData, min: number, max: number, step: number): string => `
      <div class="setting-row">
        <label>${label}</label>
        <input type="range" min="${min}" max="${max}" step="${step}" data-setting="${key}" value="${s[key] as number}">
        <span class="setting-value">${(s[key] as number).toFixed(2)}</span>
      </div>`;
    const toggle = (label: string, key: keyof SettingsData): string => `
      <div class="setting-row"><label>${label}</label>
        <input type="checkbox" data-setting="${key}" ${s[key] ? 'checked' : ''}></div>`;
    const select = (label: string, key: keyof SettingsData, options: Array<[string, string]>): string => `
      <div class="setting-row"><label>${label}</label>
        <select data-setting="${key}">${options.map(([v, l]) => `<option value="${v}" ${s[key] === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
    return `
      <div class="settings-group"><div class="settings-group-title">Display</div>
        ${select('Quality', 'quality', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['ultra', 'Ultra']])}
        ${toggle('Bloom', 'bloom')}
        ${toggle('Film grain', 'filmGrain')}
        ${toggle('Outlines (ink)', 'outlines')}
        ${toggle('Motion blur', 'motionBlur')}
        ${toggle('Show FPS', 'showFps')}
        ${toggle('Kurosawa mode (B&W + grain)', 'kurosawaMode')}
        ${toggle('Photosensitivity-safe flashes', 'photosensitivity')}
        ${select('Colorblind filter', 'colorblind', [['none', 'None'], ['protanopia', 'Protanopia'], ['deuteranopia', 'Deuteranopia'], ['tritanopia', 'Tritanopia']])}
      </div>
      <div class="settings-group"><div class="settings-group-title">Audio</div>
        ${slider('Master', 'masterVolume', 0, 1, 0.01)}
        ${slider('Music', 'musicVolume', 0, 1, 0.01)}
        ${slider('SFX', 'sfxVolume', 0, 1, 0.01)}
        ${slider('Ambience', 'ambienceVolume', 0, 1, 0.01)}
      </div>
      <div class="settings-group"><div class="settings-group-title">Controls</div>
        ${slider('Look sensitivity', 'sensitivity', 0.1, 3, 0.05)}
        ${toggle('Invert Y', 'invertY')}
        ${toggle('Hold to guard', 'holdToGuard')}
        ${toggle('Hold to sprint', 'holdToSprint')}
        ${toggle('Auto lock-on', 'autoLockOn')}
        ${select('Touch controls', 'touchControls', [['auto', 'Auto'], ['on', 'On'], ['off', 'Off']])}
      </div>
      <div class="settings-group"><div class="settings-group-title">Accessibility</div>
        ${select('Difficulty', 'difficulty', [['story', 'Story'], ['warrior', 'Warrior'], ['nameless', 'Nameless']])}
        ${toggle('Subtitles', 'subtitles')}
        ${select('Subtitle size', 'subtitleSize', [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']])}
        ${toggle('Subtitle background', 'subtitleBackground')}
        ${toggle('Reduce motion', 'reduceMotion')}
        ${toggle('Damage numbers', 'damageNumbers')}
        ${toggle('Tutorial hints', 'tutorialHints')}
        ${slider('Game speed', 'gameSpeed', 0.5, 1.5, 0.05)}
      </div>
    `;
  }

  private bindSettingsControls(container: HTMLElement): void {
    container.querySelectorAll<HTMLInputElement>('input[data-setting]').forEach((input) => {
      input.addEventListener('change', () => {
        const key = input.dataset.setting as keyof SettingsData;
        const value = input.type === 'checkbox' ? input.checked : Number(input.value);
        (this.game.settings as unknown as Record<string, unknown>)[key] = value;
        if (input.type === 'range') {
          const val = input.parentElement?.querySelector('.setting-value');
          if (val) val.textContent = Number(value).toFixed(2);
        }
        this.game.applySettings();
      });
    });
    container.querySelectorAll<HTMLSelectElement>('select[data-setting]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const key = sel.dataset.setting as keyof SettingsData;
        const value = sel.value;
        (this.game.settings as unknown as Record<string, unknown>)[key] = value;
        this.game.applySettings();
      });
    });
  }

  private renderSettingsForm(): void {
    const body = this.pauseEl.querySelector('[data-body="settings"]') as HTMLElement;
    body.innerHTML = this.settingsFormHtml();
    this.bindSettingsControls(body);
  }

  private showSettingsFromTitle(): void {
    const modal = this.div('settings-modal');
    modal.innerHTML = `
      <div class="panel-head">Settings</div>
      <div class="settings-scroll">${this.settingsFormHtml()}</div>
      <button data-action="close" class="panel-close">Back</button>
    `;
    this.bindSettingsControls(modal);
    (modal.querySelector('[data-action="close"]') as HTMLElement).addEventListener('click', () => modal.remove());
    this.root.appendChild(modal);
  }

  /* ── Ending / credits ────────────────────────────────────────────────── */

  showEnding(ending: EndingDef, canNgPlus: boolean): void {
    this.hideAllScreens();
    this.endingEl.classList.remove('hidden');
    const inner = this.endingEl.querySelector('.ending-inner') as HTMLElement;
    inner.innerHTML = `
      <div class="ending-title" style="color:${ending.color}">${esc(ending.title)}</div>
      <div class="ending-kanji">${esc(ending.kanji)}</div>
      <div class="ending-requirement">${esc(ending.requirement)}</div>
      <div class="ending-text">${ending.text.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
      <div class="ending-epilogue">${esc(ending.epilogue)}</div>
      <div class="ending-actions">
        ${canNgPlus ? '<button data-action="ngplus">Begin New Game +</button>' : ''}
        <button data-action="title">Return to Title</button>
      </div>
    `;
    inner.querySelector('[data-action="ngplus"]')?.addEventListener('click', () => {
      this.game.beginNewGamePlus();
    });
    inner.querySelector('[data-action="title"]')?.addEventListener('click', () => {
      this.endingEl.classList.add('hidden');
      this.game.quitToTitle();
    });
  }

  private showCredits(): void {
    this.titleEl.classList.add('hidden');
    this.creditsEl.classList.remove('hidden');
  }

  /* ── Photo mode ──────────────────────────────────────────────────────── */

  photoMode(on: boolean): void {
    this.photoEl.classList.toggle('hidden', !on);
    this.root.querySelector('.hud')?.classList.toggle('hidden', on);
    this.objectiveEl.classList.toggle('hidden', on);
    this.bossEl.classList.toggle('hidden', on);
    this.toastWrap.classList.toggle('hidden', on);
  }

  private saveScreenshot(): void {
    const url = this.game.captureScreenshot();
    const a = document.createElement('a');
    a.href = url;
    a.download = `kotodama-${Date.now()}.png`;
    a.click();
    this.toast('Photo saved', 'You can find it in your Downloads.', 'item', '✦', 2600);
  }

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  hideAllScreens(): void {
    this.titleEl.classList.add('hidden');
    this.pauseEl.classList.add('hidden');
    this.journalEl.classList.add('hidden');
    this.mapEl.classList.add('hidden');
    this.skillsEl.classList.add('hidden');
    this.codexEl.classList.add('hidden');
    this.deathEl.classList.add('hidden');
    this.endingEl.classList.add('hidden');
    this.creditsEl.classList.add('hidden');
    this.shrineEl.classList.add('hidden');
    this.photoEl.classList.add('hidden');
    this.dialogueEl.classList.add('hidden');
  }

  private section(className: string, inner: string): HTMLElement {
    const el = document.createElement('section');
    el.className = className;
    el.innerHTML = inner;
    return el;
  }

  private div(className: string, inner = ''): HTMLElement {
    const el = document.createElement('div');
    el.className = className;
    el.innerHTML = inner;
    return el;
  }

  tick(dt: number): void {
    if (this.subtitleTimer > 0) {
      this.subtitleTimer -= dt;
      if (this.subtitleTimer <= 0) {
        this.subtitleEl.classList.add('hidden');
        this.dialogueText.textContent = '';
        this.dialogueSpeaker.textContent = '';
      }
    }
  }
}
