import type { EventBus } from '../core/EventBus';
import type { FlagValue, QuestDef, QuestState, SaveData } from '../types';
import { ALL_QUESTS, MAIN_QUESTS, SIDE_QUESTS } from '../content/quests';

/**
 * QuestSystem — the only place quest state mutates.
 *
 * Quests are data (`src/content/quests.ts`); the system is a thin state
 * machine over them. It listens to world verbs (talk / kill / collect /
 * reach / boss / flag / choice), advances the current stage of every active
 * quest that matches, and applies accept/complete flags. It never touches
 * player stats directly — rewards are handed to a `grant` callback so the
 * game layer can add XP, items and skill points consistently.
 */

export interface QuestGrant {
  xp?: number;
  essence?: number;
  skillPoints?: number;
  items?: { id: string; count: number }[];
}

export interface QuestSystemOptions {
  save: SaveData;
  events: EventBus;
  /** Called when a quest completes (after flags are applied). */
  grant?: (quest: QuestDef, reward: QuestGrant) => void;
  /** Called after any quest-state mutation (for autosave). */
  onDirty?: () => void;
}

export class QuestSystem {
  private readonly save: SaveData;
  private readonly events: EventBus;
  private readonly grant: (quest: QuestDef, reward: QuestGrant) => void;
  private readonly onDirty: () => void;

  constructor(opts: QuestSystemOptions) {
    this.save = opts.save;
    this.events = opts.events;
    this.grant = opts.grant ?? (() => undefined);
    this.onDirty = opts.onDirty ?? (() => undefined);
  }

  get quests(): Record<string, QuestState> {
    return this.save.quests;
  }

  state(id: string): QuestState | undefined {
    return this.save.quests[id];
  }

  completedSideCount(): number {
    let n = 0;
    for (const id of Object.keys(SIDE_QUESTS)) {
      const st = this.save.quests[id];
      if (st?.status === 'complete') n++;
    }
    return n;
  }

  completedMainCount(): number {
    let n = 0;
    for (const id of Object.keys(MAIN_QUESTS)) {
      const st = this.save.quests[id];
      if (st?.status === 'complete') n++;
    }
    return n;
  }

  isComplete(id: string): boolean {
    return this.save.quests[id]?.status === 'complete';
  }

  isActive(id: string): boolean {
    return this.save.quests[id]?.status === 'active';
  }

  /** Auto-start the main quest for a chapter when entering it. */
  ensureChapterMain(chapter: number): QuestDef | null {
    const main = MAIN_QUESTS[chapter === 0 ? 'mq_prologue' : chapter === 1 ? 'mq_ushio' : chapter === 2 ? 'mq_kane' : chapter === 3 ? 'mq_yuki' : chapter === 4 ? 'mq_kaji' : chapter === 5 ? 'mq_sabaku' : chapter === 6 ? 'mq_mori' : chapter === 7 ? 'mq_futari' : chapter === 8 ? 'mq_kage' : chapter === 9 ? 'mq_yu' : chapter === 10 ? 'mq_crown' : 'mq_prologue'];
    if (!main) return null;
    if (!this.state(main.id)) this.start(main.id);
    return main;
  }

  /** Accept a quest (idempotent). */
  start(id: string): boolean {
    const def = ALL_QUESTS[id];
    if (!def) return false;
    if (this.save.quests[id]) return false;
    this.save.quests[id] = {
      id,
      status: 'active',
      stage: 0,
      progress: 0,
      startedAt: Date.now(),
    };
    if (def.acceptFlags) {
      for (const [flag, value] of Object.entries(def.acceptFlags)) {
        this.save.flags[flag] = value as FlagValue;
      }
    }
    this.events.emit('quest:start', { quest: def });
    this.onDirty();
    return true;
  }

  /**
   * Called every time an enemy dies. Matches 'kill' and 'boss' stages.
   */
  onEnemyKilled(enemyId: string, boss = false): void {
    const def = ALL_QUESTS[enemyId];
    void def;
    this.tickAll((quest, stage) => {
      if ((stage.kind === 'kill' || stage.kind === 'boss') && stage.target === enemyId) {
        return { amount: 1 };
      }
      return null;
    });
    if (boss) this.onBossKilled(enemyId);
  }

  /** Boss death is its own verb so the UI can special-case it. */
  onBossKilled(bossId: string): void {
    const def = ALL_QUESTS[bossId];
    void def;
    for (const quest of Object.values(ALL_QUESTS)) {
      const st = this.save.quests[quest.id];
      if (!st || st.status !== 'active') continue;
      const stage = quest.stages[st.stage];
      if (!stage || stage.kind !== 'boss') continue;
      if (stage.target === bossId) this.advance(quest, st, stage.count ?? 1);
    }
  }

  /** Collectibles and items. `id` is the codex/collect target id. */
  onCollect(target: string, amount = 1): void {
    this.tickAll((quest, stage) => {
      if (stage.kind === 'collect' && stage.target === target) return { amount, complete: undefined };
      return null;
    });
  }

  /** A named landmark / shrine / secret was reached. */
  onReach(id: string): void {
    this.tickAll((quest, stage) => {
      if (stage.kind === 'reach' && stage.target === id) {
        return { amount: 1, complete: undefined };
      }
      return null;
    });
  }

  /** A named NPC was spoken to. */
  onTalk(npcId: string): void {
    this.tickAll((quest, stage) => {
      if (stage.kind === 'talk' && stage.target === npcId) {
        return { amount: 1, complete: undefined };
      }
      return null;
    });
  }

  /** A flag was set or a dialogue choice was made. */
  onFlagChanged(flag: string): void {
    this.tickAll((quest, stage) => {
      if ((stage.kind === 'flag' || stage.kind === 'choice') && stage.target === flag) {
        const value = this.save.flags[flag];
        if (typeof value === 'boolean' && value) return { amount: 1, complete: undefined };
        if (typeof value === 'string' && value.length > 0) return { amount: 1, complete: undefined };
        if (typeof value === 'number' && value > 0) return { amount: 1, complete: undefined };
      }
      return null;
    });
  }

  /** Sets a flag directly and resolves any flag/choice stages that watch it. */
  setFlag(flag: string, value: FlagValue): void {
    this.save.flags[flag] = value;
    this.onFlagChanged(flag);
  }

  /**
   * Force a quest to completion (used by dialogue effects like "complete").
   * Grants rewards and sets complete flags exactly once.
   */
  forceComplete(id: string): boolean {
    const def = ALL_QUESTS[id];
    if (!def) return false;
    let st = this.save.quests[id];
    if (!st) {
      this.start(id);
      st = this.save.quests[id];
    }
    if (!st) return false;
    if (st.status === 'complete') return true;
    if (st.status !== 'active') return false;
    for (let i = st.stage; i < def.stages.length; i++) {
      this.save.flags[`quest_${id}_stage_${i + 1}`] = true;
    }
    st.progress = def.stages[st.stage]?.count ?? 1;
    this.complete(def, st);
    return true;
  }

  private tickAll(
    match: (quest: QuestDef, stage: QuestDef['stages'][number]) => { amount: number } | null,
  ): void {
    for (const quest of Object.values(ALL_QUESTS)) {
      const st = this.save.quests[quest.id];
      if (!st || st.status !== 'active') continue;
      const stage = quest.stages[st.stage];
      if (!stage) continue;
      const result = match(quest, stage);
      if (!result) continue;
      const need = stage.count ?? 1;
      st.progress += result.amount;
      if (st.progress >= need) {
        this.advance(quest, st, need);
      }
    }
  }

  private advance(quest: QuestDef, st: QuestState, _need: number): void {
    st.progress = 0;
    const next = st.stage + 1;
    if (next >= quest.stages.length) {
      this.complete(quest, st);
      return;
    }
    st.stage = next;
    this.save.flags[`quest_${quest.id}_stage_${next}`] = true;
    this.events.emit('quest:update', {
      quest,
      stage: next,
      text: quest.stages[next].text,
    });
    this.onDirty();
  }

  private complete(quest: QuestDef, st: QuestState): void {
    st.status = 'complete';
    st.completedAt = Date.now();
    st.progress = st.stage;
    if (quest.completeFlags) {
      for (const [flag, value] of Object.entries(quest.completeFlags)) {
        this.save.flags[flag] = value as FlagValue;
      }
    }
    this.grant(quest, quest.rewards);
    this.recomputeTrueEnding();
    this.events.emit('quest:complete', { quest });
    this.events.emit('ui:toast', {
      title: quest.title,
      text: 'Quest complete.',
      kind: 'quest',
      duration: 3200,
    });
    this.onDirty();
  }

  /** True ending requires Ame's name + six side quests. */
  recomputeTrueEnding(): void {
    const ameName = Boolean(this.save.flags['ame_name']);
    const done = this.completedSideCount();
    if (ameName && done >= 6) {
      this.save.flags['true_ending_unlocked'] = true;
    }
  }
}
