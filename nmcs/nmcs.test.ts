import { Core, RG_TYPE, RougeDataSets } from '@project-rouge/rg-core';
import seedrandom from 'seedrandom';
import { expect, it } from 'vitest';
import { RgDefaultCreate } from '../../aggregator-utils/rg-default-create';
import { FloatKnapsack } from '../knapsack/float-knapsack';
import { AggNmcsRules } from './agg-nmcs-rules';
import { AggNmcs } from './agg-nmcs.internal';
import { Nmcs } from './nmcs';

/** toggle logs */
const logs = false;

const rng = seedrandom('1');
const dataset = RougeDataSets.uk_01;
const { coreWithStairs, f2fHeight } = dataset.aggConfig;
const coreSize: [number, number, number] = [
  coreWithStairs.size[0],
  f2fHeight,
  coreWithStairs.size[1]
];
const partialCore: Partial<Core> = { anchor: [0.5, 0, 0], size: coreSize };
const core = RgDefaultCreate(partialCore, RG_TYPE.Core) as Core;
const units = [
  ...dataset.apartments.main.slice(),
  core
];

it('is fast', () => {
  const t = Date.now();
  const targetLength = 100;
  const rules = new AggNmcsRules({ dataset, targetLength });
  const nmcs = new Nmcs(rules);

  const { solution } = nmcs.runSearch({ level: 2, rng });

  logs && console.log(solution.sequence.map(u => u.unit.name));
  logs && console.log(solution.corridorLengths);
  logs && console.log(`cost: ${rules.getCost(solution)}`);
  logs && console.log(`length: ${solution.totalLength}`);
  logs && console.log(`time taken: ${Date.now() - t}`);
  expect(Date.now() - t).toBeLessThan(500);
});

it('returns expected worst case rollouts', () => {
  const targetLength = 100;
  const rules = new AggNmcsRules({ dataset, targetLength });
  const nmcs = new Nmcs(rules);
  const iter = 100;
  const { worstState } = nRollouts(nmcs, iter, rng);
  const expectedWorst = targetLength - Math.max(...units.map(u => u.size[0]));
  const worstLength = worstState.totalLength;
  logs && console.log(`worst reward: ${worstLength}, expected worst: ${expectedWorst}`);

  expect(worstLength).toBeGreaterThanOrEqual(expectedWorst);
});

it('is better than pure rollouts', () => {
  const targetLength = 100;

  const rules = new AggNmcsRules({ dataset, targetLength, skipCores: false });
  let mctAve = 0;
  let rolloutAve = 0;
  let iterAve = 0;

  const n = 20;
  for (let i = 0; i < n; i++) {
    const nmcs = new Nmcs(rules);
    const { reward, iters } = nmcs.runSearch({ level: 2, rng });
    const { bestReward: rolloutReward } = nRollouts(nmcs, iters, rng);

    mctAve += reward;
    rolloutAve += rolloutReward;
    iterAve += iters;
  }
  mctAve /= n;
  rolloutAve /= n;
  iterAve /= n;

  logs && console.log(`nmcs reward: ${mctAve}, rollout reward: ${rolloutAve}, average iterations: ${iterAve}`);

  expect(mctAve, 'average nested reward to be better than average rollout rewards').toBeGreaterThanOrEqual(rolloutAve - 0.00001);
});

it('never gives invalid solutions on rollout', () => {
  const targetLength = 100;
  const rules = new AggNmcsRules({ dataset, targetLength, canCloseEnds: [false, false] });
  let worstReward = 0;

  const n = 1000;
  for (let i = 0; i < n; i++) {
    const nmcs = new Nmcs(rules);
    const { worstReward: reward, worstState } = nRollouts(nmcs, 1, rng);
    worstReward = Math.min(reward, worstReward);
    if (reward < -1000) {
      logs && console.log(reward);
      logs && console.log(worstState.sequence.map(u => u.unit.name));
      logs && console.log(worstState.totalLength);
      logs && console.log(worstState.corridorLengths);
    }
  }

  expect(worstReward).toBeGreaterThan(-1000);
});

it('is within 1% of knapsack', () => {
  const targetLength = 200;
  const rules = new AggNmcsRules({
    dataset,
    targetLength,
    targetEntranceCount: 0,
    lockEnds: [true, false],
    weights: {
      totalLengthWeight: 1,
      coreCountWeight: 0,
      unitMixWeight: 0,
      entranceCountWeight: 0,
      corridorLengthWeight: 0,
      efficiencyWeight: 0,
      closingWeight: 0
    }
  });
  let t = Date.now();
  const nmcs = new Nmcs(rules);
  const { iters, solution } = nmcs.runSearch({ level: 2, rng });
  const tNmcs = Date.now() - t;
  const nmcsLength = solution.totalLength;

  const widths = dataset.apartments.main.map(a => a.size[0]);
  t = Date.now();
  const rewardKnapsack = FloatKnapsack(widths, targetLength);
  const tKnapsack = Date.now() - t;

  logs && console.log(`best nmcs: ${nmcsLength}, iters: ${iters}, in ${tNmcs}`);
  logs && console.log(`knapsack: ${rewardKnapsack}, in ${tKnapsack}`);
  logs && console.log(solution.sequence.map(u => u.unit.name));

  expect(nmcsLength).toBeGreaterThan(rewardKnapsack * 0.99);
});

function nRollouts (nmcs: AggNmcs, n: number, rng: () => number) {
  const { reward, solution } = nmcs.runSearch({ rng, level: 0 });
  let bestReward = reward;
  let worstReward = reward;
  let worstState = solution;
  let bestState = solution;

  for (let i = 1; i < n; i++) {
    const { reward, solution } = nmcs.runSearch({ rng, level: 0 });
    if (reward > bestReward) { bestReward = reward; bestState = solution; }
    if (reward < worstReward) { worstReward = reward; worstState = solution; }
  }

  return { bestReward, worstReward, bestState, worstState };
}
