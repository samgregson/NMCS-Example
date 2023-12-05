import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { AggNmcsState } from '../../agg-nmcs-state';

export function getLiftCoreCost (state: AggNmcsState, props: AggNmcsRulesData) {
  const liftCoreCost = (state.liftCoreCount === props.targetLiftCoreCount) ? 0 : 1e6;
  return liftCoreCost;
}
