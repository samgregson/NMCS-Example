import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { AggNmcsState } from '../../agg-nmcs-state';

export function getStairCoreCost (state: AggNmcsState, props: AggNmcsRulesData) {
  const cost = (state.stairCoreCount >= props.targetStairCoreCount) ? 0 : 1e6;
  return cost;
}
