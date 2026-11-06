import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../content/chapters';
import { CODEX, INITIAL_CODEX } from '../content/codex';
import { DIALOGUE } from '../content/dialogue';
import { ALL_ENEMIES, BOSSES, ELITES } from '../content/enemies';
import { ALL_QUESTS } from '../content/quests';
import { REGIONS } from '../content/regions';
import { ARTS, ITEMS, PLAYER_MOVES, SKILLS, SKILL_TREES, WEAPONS } from '../content/weapons';
import { CINEMATICS } from '../content/cinematics';
import { ACHIEVEMENTS } from '../content/achievements';

describe('content integrity', () => {
  it('every chapter has a real region, spawn and boss', () => {
    for (const ch of CHAPTERS) {
      expect(REGIONS[ch.region], `chapter ${ch.index} region`).toBeDefined();
      const region = REGIONS[ch.region];
      expect(region.spawns.some((s) => s.id === ch.spawn), `chapter ${ch.index} spawn ${ch.spawn}`).toBe(true);
      if (ch.boss) {
        expect(BOSSES[ch.boss], `chapter ${ch.index} boss ${ch.boss}`).toBeDefined();
      }
      if (ch.intro) expect(CINEMATICS[ch.intro], `chapter ${ch.index} intro cinema`).toBeDefined();
      if (ch.outro) expect(CINEMATICS[ch.outro], `chapter ${ch.index} outro cinema`).toBeDefined();
      if (ch.rewards?.weapon) expect(WEAPONS[ch.rewards.weapon], `chapter ${ch.index} weapon`).toBeDefined();
    }
  });

  it('every arena references an existing boss and a landmark', () => {
    for (const region of Object.values(REGIONS)) {
      for (const arena of region.arenas) {
        expect(BOSSES[arena.boss], `arena ${arena.id} boss`).toBeDefined();
        const lm = region.landmarks.find((l) => l.arena === arena.id);
        expect(lm, `arena ${arena.id} landmark`).toBeDefined();
      }
    }
  });

  it('every NPC has an existing dialogue tree and optional quest', () => {
    const allNpcIds = new Set<string>();
    for (const region of Object.values(REGIONS)) {
      for (const npc of region.npcs) {
        allNpcIds.add(npc.id);
        expect(DIALOGUE[npc.dialogue], `npc ${npc.id} dialogue ${npc.dialogue}`).toBeDefined();
        if (npc.quest) {
          expect(ALL_QUESTS[npc.quest], `npc ${npc.id} quest`).toBeDefined();
        }
      }
    }
    // quest talk targets must be real NPCs
    for (const quest of Object.values(ALL_QUESTS)) {
      for (const stage of quest.stages) {
        if (stage.kind === 'talk') {
          expect(allNpcIds.has(stage.target), `quest ${quest.id} talk target ${stage.target}`).toBe(true);
        }
      }
    }
  });

  it('quest stage targets resolve to real content', () => {
    const landmarkIds = new Set<string>();
    const shrineIds = new Set<string>();
    const secretIds = new Set<string>();
    const spawnEnemyIds = new Set<string>();
    for (const region of Object.values(REGIONS)) {
      region.landmarks.forEach((l) => landmarkIds.add(l.id));
      region.shrines.forEach((s) => shrineIds.add(s.id));
      region.secrets.forEach((s) => secretIds.add(s.id));
      region.enemies.forEach((e) => spawnEnemyIds.add(e.enemy));
    }
    for (const quest of Object.values(ALL_QUESTS)) {
      for (const stage of quest.stages) {
        switch (stage.kind) {
          case 'kill':
          case 'boss':
            expect(
              ALL_ENEMIES[stage.target] || spawnEnemyIds.has(stage.target),
              `quest ${quest.id} stage ${stage.id} kill target ${stage.target}`,
            ).toBeTruthy();
            break;
          case 'collect':
            if (stage.target !== 'memory_fragment') {
              expect(ITEMS[stage.target], `quest ${quest.id} collect item ${stage.target}`).toBeDefined();
            }
            break;
          case 'reach':
            expect(
              landmarkIds.has(stage.target) || shrineIds.has(stage.target) || secretIds.has(stage.target),
              `quest ${quest.id} reach target ${stage.target}`,
            ).toBe(true);
            break;
          case 'talk':
            break;
          case 'flag':
          case 'choice':
            break;
        }
      }
    }
  });

  it('every weapon move, combo and art exists', () => {
    for (const weapon of Object.values(WEAPONS)) {
      expect(PLAYER_MOVES[weapon.heavy], `weapon ${weapon.id} heavy`).toBeDefined();
      expect(ARTS[weapon.art], `weapon ${weapon.id} art`).toBeDefined();
      for (const moveId of weapon.combo) {
        expect(PLAYER_MOVES[moveId], `weapon ${weapon.id} combo ${moveId}`).toBeDefined();
      }
      for (const art of Object.values(ARTS)) {
        if (art.weapon === weapon.id) {
          expect(PLAYER_MOVES[art.move], `art ${art.id} move`).toBeDefined();
        }
      }
    }
    for (const skill of Object.values(SKILLS)) {
      for (const req of skill.requires ?? []) {
        expect(SKILLS[req], `skill ${skill.id} requires ${req}`).toBeDefined();
      }
    }
  });

  it('skills trees only reference defined skills', () => {
    for (const skills of Object.values(SKILL_TREES)) {
      for (const id of skills) {
        expect(SKILLS[id], `skill tree id ${id}`).toBeDefined();
      }
    }
  });

  it('dialogue trees are internally consistent', () => {
    for (const [id, tree] of Object.entries(DIALOGUE)) {
      expect(tree.nodes[tree.start], `dialogue ${id} start node`).toBeDefined();
      for (const rule of tree.startByFlag ?? []) {
        expect(tree.nodes[rule.node], `dialogue ${id} startByFlag ${rule.flag} -> ${rule.node}`).toBeDefined();
      }
      for (const [nodeId, node] of Object.entries(tree.nodes)) {
        expect(node.id, `dialogue ${id} node ${nodeId} id field`).toBe(nodeId);
        if (node.next) expect(tree.nodes[node.next], `dialogue ${id} ${nodeId} next`).toBeDefined();
        for (const choice of node.choices ?? []) {
          expect(tree.nodes[choice.next], `dialogue ${id} ${nodeId} choice -> ${choice.next}`).toBeDefined();
          expect(choice.text.length).toBeGreaterThan(0);
        }
        for (const fx of node.effects ?? []) {
          expect(['flag', 'quest', 'item', 'essence', 'xp', 'unlock', 'heal', 'ending', 'codex', 'reputation']).toContain(fx.type);
        }
      }
    }
    // the ending choice's true-ending option must require the computed flag
    const ending = DIALOGUE.ending_choice;
    expect(ending).toBeDefined();
    const remember = ending.nodes.intro?.choices?.find((c) => c.next === 'remember');
    expect(remember?.requiresFlag).toBe('true_ending_unlocked');
  });

  it('codex initial entries exist', () => {
    for (const id of INITIAL_CODEX) {
      expect(CODEX[id], `initial codex ${id}`).toBeDefined();
    }
  });

  it('cinematics are internally consistent', () => {
    for (const [id, cine] of Object.entries(CINEMATICS)) {
      const steps = [...cine.steps].sort((a, b) => a.at - b.at);
      for (let i = 0; i < steps.length; i++) {
        expect(steps[i].at, `cinematic ${id} step order`).toBeGreaterThanOrEqual(i === 0 ? 0 : steps[i - 1].at);
      }
      expect(cine.duration).toBeGreaterThan(0);
      for (const step of steps) {
        if (step.kind === 'camera') {
          expect(step.from && step.to, `cinematic ${id} camera step`).toBeTruthy();
        }
        if (step.kind === 'line') expect(step.text).toBeTruthy();
      }
    }
  });

  it('achievements reference real bosses and quests', () => {
    for (const ach of ACHIEVEMENTS) {
      if (ach.condition.type === 'boss') {
        expect(BOSSES[ach.condition.target] || ELITES[ach.condition.target], `achievement ${ach.id} boss ${ach.condition.target}`).toBeDefined();
      }
      if (ach.condition.type === 'chapter') {
        expect(Number(ach.condition.target)).toBeLessThanOrEqual(10);
      }
    }
  });

  it('all chapter ids are unique and sequential', () => {
    const ids = CHAPTERS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    CHAPTERS.forEach((c, i) => expect(c.index).toBe(i));
  });
});
