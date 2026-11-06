import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { EventBus } from '../core/EventBus';
import { createNewSave, DEFAULT_SETTINGS } from '../core/SaveSystem';
import { angleDelta, pointInArc, wrapAngle } from '../core/MathUtils';
import { Player } from '../engine/Player';
import { QuestSystem } from '../engine/QuestSystem';
import { trueEndingAvailable } from '../content/endings';
import { SIDE_QUESTS, MAIN_QUESTS } from '../content/quests';
import type { SaveData, SettingsData } from '../types';

const audioStub = {
  sfx: () => undefined,
  gainFlow: () => undefined,
} as never;

function makePlayer(save?: SaveData): Player {
  const data = save ?? createNewSave(1);
  const events = new EventBus();
  return new Player(new THREE.Scene(), data, { ...DEFAULT_SETTINGS } as SettingsData, events, audioStub);
}

describe('combat math', () => {
  it('takeHit applies raw damage on an unguarded hit', () => {
    const p = makePlayer();
    p.invuln = 0;
    const before = p.stats.health;
    const hit = {
      attacker: 'enemy' as const,
      damage: 30,
      posture: 10,
      damageType: 'physical' as const,
      knockback: 0,
      hitstop: 0,
    };
    const r = p.takeHit(hit, new THREE.Vector3(2, 0, 0));
    expect(r.blocked).toBe(false);
    expect(r.parried).toBe(false);
    expect(p.stats.health).toBeLessThan(before);
    expect(p.stats.posture).toBeGreaterThan(0);
  });

  it('guarding blocks and reduces damage', () => {
    const p = makePlayer();
    p.invuln = 0;
    p.yaw = 0; // face the attacker at +Z
    p.guarding = true;
    p.guardTimer = 0.01; // inside parry window => parry
    const before = p.stats.health;
    p.takeHit(
      { attacker: 'enemy', damage: 50, posture: 20, damageType: 'physical', knockback: 0, hitstop: 0 },
      new THREE.Vector3(0, 0, 4),
    );
    expect(p.stats.health).toBe(before); // perfect parry takes no damage
    expect(p.save.parries).toBe(1);

    // now a late guard attempt (block, not parry)
    p.guardTimer = 0.5;
    const before2 = p.stats.health;
    const r2 = p.takeHit(
      { attacker: 'enemy', damage: 50, posture: 20, damageType: 'physical', knockback: 0, hitstop: 0 },
      new THREE.Vector3(0, 0, 4),
    );
    expect(r2.blocked).toBe(true);
    expect(p.stats.health).toBeLessThan(before2);
    expect(p.stats.health).toBeGreaterThan(before2 - 50);
  });

  it('perilous attacks cannot be parried or blocked', () => {
    const p = makePlayer();
    p.invuln = 0;
    p.guarding = true;
    p.guardTimer = 0.01;
    const before = p.stats.health;
    p.takeHit(
      { attacker: 'enemy', damage: 60, posture: 20, damageType: 'physical', knockback: 0, hitstop: 0, perilous: true } as never,
      new THREE.Vector3(0, 0, 4),
    );
    expect(p.stats.health).toBeLessThan(before);
  });

  it('dodge invulnerability avoids damage entirely', () => {
    const p = makePlayer();
    p.invuln = 0.3;
    const before = p.stats.health;
    const r = p.takeHit(
      { attacker: 'enemy', damage: 100, posture: 0, damageType: 'physical', knockback: 0, hitstop: 0 },
      new THREE.Vector3(0, 0, 4),
    );
    expect(r.parried).toBe(true);
    expect(p.stats.health).toBe(before);
  });

  it('difficulty modifies incoming damage', () => {
    const story = makePlayer();
    story.settings = { ...DEFAULT_SETTINGS, difficulty: 'story' } as SettingsData;
    const nameless = makePlayer();
    nameless.settings = { ...DEFAULT_SETTINGS, difficulty: 'nameless' } as SettingsData;
    story.invuln = 0;
    nameless.invuln = 0;
    const hit = { attacker: 'enemy' as const, damage: 100, posture: 0, damageType: 'physical' as const, knockback: 0, hitstop: 0 };
    const beforeS = story.stats.health;
    const beforeN = nameless.stats.health;
    story.takeHit(hit, new THREE.Vector3(2, 0, 0));
    nameless.takeHit(hit, new THREE.Vector3(2, 0, 0));
    const lossS = beforeS - story.stats.health;
    const lossN = beforeN - nameless.stats.health;
    expect(lossN).toBeGreaterThan(lossS);
  });

  it('posture accumulates to the maximum on heavy hits', () => {
    const p = makePlayer();
    p.invuln = 0;
    p.stats.posture = p.stats.maxPosture - 1;
    p.takeHit(
      { attacker: 'enemy', damage: 5, posture: 30, damageType: 'physical', knockback: 0, hitstop: 0 },
      new THREE.Vector3(2, 0, 0),
    );
    expect(p.stats.posture).toBe(p.stats.maxPosture);
  });

  it('death flow emits death and responds to respawn', () => {
    const p = makePlayer();
    p.invuln = 0;
    p.stats.health = 1;
    p.takeHit(
      { attacker: 'enemy', damage: 500, posture: 0, damageType: 'physical', knockback: 0, hitstop: 0 },
      new THREE.Vector3(2, 0, 0),
    );
    expect(p.dead).toBe(true);
    expect(p.save.deaths).toBe(1);
    p.respawn({ heightAt: () => 0, isUnderWater: () => false, inBounds: () => true, waterLevel: null, half: 100 } as never);
    expect(p.dead).toBe(false);
    expect(p.stats.health).toBe(p.stats.maxHealth);
  });

  it('gourd consumption heals and tracks usage', () => {
    const p = makePlayer();
    p.stats.health = 10;
    p.useGourd();
    expect(p.stats.health).toBeGreaterThan(10);
    expect(p.stats.gourds).toBe(2);
  });

  it('weapon switching rebuilds the rig', () => {
    const p = makePlayer();
    p.unlockWeapon('odachi');
    expect(p.equipWeapon('odachi')).toBe(true);
    expect(p.save.weapon).toBe('odachi');
    expect(p.weapon.id).toBe('odachi');
  });
});

describe('math utils', () => {
  it('angleDelta wraps to [-PI, PI]', () => {
    expect(angleDelta(0, Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(angleDelta(0, -Math.PI * 0.5)).toBeCloseTo(-Math.PI * 0.5);
  });
  it('wrapAngle keeps in [-PI, PI]', () => {
    expect(wrapAngle(Math.PI * 2)).toBeCloseTo(0);
    expect(wrapAngle(-Math.PI * 1.5)).toBeCloseTo(Math.PI * 0.5);
  });
  it('pointInArc restricts by range and arc', () => {
    // facing +X is π/2 in atan2(dx,dz) convention
    expect(pointInArc(0, 0, Math.PI / 2, 3, 0, 4, 2)).toBe(true);
    // behind the attacker
    expect(pointInArc(0, 0, Math.PI / 2, -3, 0, 4, 2)).toBe(false);
    // out of range
    expect(pointInArc(0, 0, Math.PI / 2, 9, 0, 4, 2)).toBe(false);
  });
});

describe('quest system', () => {
  function makeQuests(save?: SaveData): { quests: QuestSystem; save: SaveData; granted: Array<{ quest: string; reward: unknown }> } {
    const s = save ?? createNewSave(1);
    const granted: Array<{ quest: string; reward: unknown }> = [];
    const events = new EventBus();
    const quests = new QuestSystem({
      save: s,
      events,
      grant: (quest, reward) => granted.push({ quest: quest.id, reward }),
    });
    return { quests, save: s, granted };
  }

  it('main quest auto-starts for a chapter', () => {
    const { quests, save } = makeQuests();
    quests.ensureChapterMain(0);
    expect(save.quests.mq_prologue.status).toBe('active');
    expect(save.quests.mq_prologue.stage).toBe(0);
  });

  it('talk stage advances then completes with rewards and flags', () => {
    const { quests, save, granted } = makeQuests();
    quests.ensureChapterMain(0);
    quests.onTalk('ame');
    expect(save.quests.mq_prologue.status).toBe('complete');
    expect(save.flags.chapter_0_done).toBeUndefined(); // set by Game, not quests
    expect(granted.some((g) => g.quest === 'mq_prologue')).toBe(true);
    expect(quests.completedMainCount()).toBe(1);
  });

  it('kill stages count towards completion', () => {
    const { quests, save } = makeQuests();
    quests.start('sq_fuyu_wolves');
    expect(save.flags.sq_fuyu_wolves_started ?? save.quests.sq_fuyu_wolves).toBeTruthy();
    quests.onEnemyKilled('snow_beast');
    expect(save.quests.sq_fuyu_wolves.progress).toBe(1);
    quests.onEnemyKilled('snow_beast');
    quests.onEnemyKilled('snow_beast');
    expect(save.quests.sq_fuyu_wolves.stage).toBe(1);
    quests.onTalk('fuyu');
    expect(save.quests.sq_fuyu_wolves.status).toBe('complete');
    expect(save.flags.sq_fuyu_done).toBe(true);
  });

  it('collect stages count memory fragments', () => {
    const { quests, save } = makeQuests();
    quests.start('sq_lantern');
    quests.onCollect('memory_fragment');
    quests.onCollect('memory_fragment');
    expect(save.quests.sq_lantern.stage).toBe(0);
    quests.onCollect('memory_fragment');
    expect(save.quests.sq_lantern.stage).toBe(1);
    quests.onTalk('ame');
    expect(save.quests.sq_lantern.status).toBe('complete');
    expect(save.flags.sq_lantern_done).toBe(true);
  });

  it('reach stages fire on named landmarks', () => {
    const { quests, save } = makeQuests();
    quests.start('sq_tobi_arm');
    quests.onEnemyKilled('juzo');
    expect(save.quests.sq_tobi_arm.stage).toBe(1);
    quests.onReach('lm_shore_shipwreck');
    expect(save.quests.sq_tobi_arm.stage).toBe(2);
    quests.onTalk('tobi');
    expect(save.quests.sq_tobi_arm.status).toBe('complete');
  });

  it('boss stages complete only on the named boss', () => {
    const { quests, save } = makeQuests();
    quests.ensureChapterMain(1);
    quests.onBossKilled('kane');
    expect(save.quests.mq_ushio.status).toBe('active');
    quests.onBossKilled('ushio');
    expect(save.quests.mq_ushio.status).toBe('complete');
    expect(save.flags.boss_ushio).toBeUndefined(); // set by Game
  });

  it('choice stages resolve through flags', () => {
    const { quests, save } = makeQuests();
    quests.start('sq_zahra_water');
    quests.onReach('lm_desert_oasis');
    expect(save.quests.sq_zahra_water.stage).toBe(1);
    quests.onFlagChanged('garden_choice');
    expect(save.quests.sq_zahra_water.status).toBe('active');
    quests.setFlag('garden_choice', 'shared');
    expect(save.quests.sq_zahra_water.status).toBe('complete');
  });

  it('forceComplete completes from any stage', () => {
    const { quests, save, granted } = makeQuests();
    quests.start('sq_sami_star');
    expect(quests.forceComplete('sq_sami_star')).toBe(true);
    expect(save.quests.sq_sami_star.status).toBe('complete');
    expect(save.flags.sq_sami_done).toBe(true);
    expect(granted.length).toBe(1);
  });

  it('completedSideCount and true ending gate', () => {
    const { quests, save } = makeQuests();
    expect(quests.completedSideCount()).toBe(0);
    for (const id of Object.keys(SIDE_QUESTS).slice(0, 5)) {
      quests.forceComplete(id);
    }
    expect(quests.completedSideCount()).toBe(5);
    expect(trueEndingAvailable(save.flags, 5)).toBe(false);
    save.flags.ame_name = true;
    expect(trueEndingAvailable(save.flags, 5)).toBe(false);
    quests.forceComplete('sq_lin_letter');
    expect(quests.completedSideCount()).toBe(6);
    quests.recomputeTrueEnding();
    expect(save.flags.true_ending_unlocked).toBe(true);
  });

  it('main quest count includes all eleven', () => {
    const { quests } = makeQuests();
    for (const id of Object.keys(MAIN_QUESTS)) quests.forceComplete(id);
    expect(quests.completedMainCount()).toBe(11);
  });
});
