import { AggRulesWeights } from './agg-rules-weights';

export const aggRulesWeightDefaults: AggRulesWeights = {
  coreCountWeight: 2,
  totalLengthWeight: 1,
  unitMixWeight: 20,
  entranceCountWeight: 1, // penalty only
  corridorLengthWeight: 5,
  efficiencyWeight: 10,
  closingWeight: 10
};
