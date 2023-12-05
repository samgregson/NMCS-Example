import { RougeDataSet, getDefaultMix, UnitCategoryMix } from '@project-rouge/rg-core';

import { aggRulesWeightDefaults } from './agg-rules-weight-defaults';
import { AggRulesWeights } from './agg-rules-weights';

export interface AggNmcsRulesData extends Required<AggNmcsRulesProps> {
  smallestApartmentSize: number;
  smallestNextToEntranceSize: number;
  largestUnitSize: number;
  minDoorPositionFromEnd: number;
}

export interface AggNmcsRulesProps {
  dataset: Readonly<RougeDataSet>;
  targetLength: number;
  targetUnitMix?: UnitCategoryMix[];
  canCloseEnds?: [boolean, boolean];
  targetEntranceCount?: number;
  hasEntryAtStart?: boolean;
  hasCornerAt?: [boolean, boolean];
  distToCore?: [number, number];
  targetFireCoreCount?: number;
  targetLiftCoreCount?: number;
  targetStairCoreCount?: number;
  skipCores?: boolean;
  maxCorridorDists?: { start: number, middle: number, end: number };
  endClosingDistances?: [start: number, end: number];
  endEntranceDistances?: [start: number, end: number];
  lockEnds?: [start: boolean, end: boolean];
  weights?: AggRulesWeights;
  isDoubleLoaded?: boolean;
}

export function getDefaultAggRulesProps (dataset: RougeDataSet): Partial<AggNmcsRulesProps> {
  return {
    targetUnitMix: getDefaultMix(dataset),
    canCloseEnds: [true, true],
    targetEntranceCount: 0,
    hasEntryAtStart: false,
    hasCornerAt: [false, false],
    distToCore: [0, 0],
    targetFireCoreCount: 0,
    targetLiftCoreCount: 0,
    targetStairCoreCount: 0,
    skipCores: true,
    maxCorridorDists: {
      start: dataset.aggConfig.maxTravelDistSprinklered,
      middle: dataset.aggConfig.maxTravelDistBidirectional * 2,
      end: dataset.aggConfig.maxTravelDistSprinklered
    },
    endClosingDistances: [0, 0],
    endEntranceDistances: [Infinity, Infinity], // default to not considering any blocking on the opposite side
    lockEnds: [true, false],
    weights: aggRulesWeightDefaults,
    isDoubleLoaded: true
  };
};
