import { Core, RG_TYPE, RougeDataSets } from '@project-rouge/rg-core';
import { expect, it } from 'vitest';
import { RgDefaultCreate } from '../../aggregator-utils/rg-default-create';
import { AggNmcsAction } from './agg-nmcs-action';
import { AggNmcsRules } from './agg-nmcs-rules';
import { AggNmcsRulesData, getDefaultAggRulesProps } from './agg-nmcs-rules-data';
import { AggNmcsState } from './agg-nmcs-state';
import { getDoorDistanceFromRight } from './internal/utils/get-door-distance-from-right.internal';
import { getEntranceDistance } from './internal/utils/get-entrance-distance';
import { getEntranceDoorWidth } from './internal/utils/get-entrance-door-width';
import { getActionGia } from './internal/utils/get-action-gia';
import { getDataAndActions } from './internal/utils/get-data-and-actions';

const dataset = RougeDataSets.uk_01;
const { coreWithStairs, f2fHeight, gap, corridorWidth } = dataset.aggConfig;
const core = RgDefaultCreate<Core>({
  type: RG_TYPE.Core,
  size: [coreWithStairs.size[0], f2fHeight, coreWithStairs.size[1]],
  anchor: [0.5, 0, 0]
});

it('has # valid actions equal to # apartments (skip cores, no entrance)', () => {
  const targetLength = 100;
  const rules = new AggNmcsRules({ dataset, targetLength, skipCores: true, targetEntranceCount: 0 });
  // filter out 'closing' apartments
  const validUnits = dataset.apartments.all.filter(a => !a.data.closeDirection || a.data.closeDirection[0] > 0);

  expect(rules.getValidActions(rules.initialState).length).toEqual(validUnits.length);
});

it('state update gives correct corridor distances', () => {
  const { data } = getDataAndActions({ dataset, targetLength: 100 });
  const state = new AggNmcsState({ gap, data });

  const apartment1 = dataset.apartments.main[0];
  const apartment2 = dataset.apartments.main[2];

  const units = [
    apartment1,
    apartment2,
    core,
    apartment2,
    core,
    apartment1
  ];

  const actions: AggNmcsAction[] = units.map(u => {
    return {
      unit: u,
      rolloutWeight: 1,
      doorPosition: getEntranceDistance(u),
      doorWidth: getEntranceDoorWidth(u),
      gia: getActionGia(u, corridorWidth, true)
    };
  });

  expect(state.corridorLengths).toEqual([0]);

  state.update(actions[0]);
  let dist0 = getDoorDistanceFromRight(actions[0]);
  expect(state.corridorLengths).toEqual([dist0]);

  state.update(actions[1]);
  dist0 += actions[1].unit.size[0];
  expect(state.corridorLengths).toEqual([dist0]);

  state.update(actions[2]);
  expect(state.corridorLengths).toEqual([dist0, 0]);

  state.update(actions[3]);
  const dist1 = actions[3].unit.size[0];
  expect(state.corridorLengths).toEqual([dist0, dist1]);

  state.update(actions[4]);
  state.update(actions[5]);
  const dist2 = actions[5].unit.size[0];
  expect(state.corridorLengths).toEqual([dist0, dist1, dist2]);

  const rulesState = getDefaultAggRulesProps(dataset) as AggNmcsRulesData;
  rulesState.targetLength = state.totalLength;

  state.finalUpdate(rulesState);
  const dist3 = actions[5].doorPosition - 0.5 * actions[5].doorWidth;
  expect(state.corridorLengths).toEqual([dist0, dist1, dist3]);
});

it('has correct no. of valid actions (skip cores, no entrance)', () => {
  const targetLength = 10;
  const rules = new AggNmcsRules({ dataset, targetLength, skipCores: true, targetEntranceCount: 0 });
  // filter out too large apartments
  const validUnits = dataset.apartments.all.filter(a => a.size[0] < targetLength);

  expect(rules.getValidActions(rules.initialState).length).toEqual(validUnits.length);
});
