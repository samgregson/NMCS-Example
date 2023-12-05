import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { AggNmcsState } from '../../agg-nmcs-state';
import { getDistribution } from '../utils/get-distribution';
import { rootMeanSquareDifference } from '../utils/root-mean-square-difference';

export function getUnitMixCost (state: AggNmcsState, props: AggNmcsRulesData) {
  const distribution = getDistribution(state.sequence, props);
  const distributionCost = rootMeanSquareDifference(distribution, props.targetUnitMix.map(m => m.ratio));
  return distributionCost;
}
