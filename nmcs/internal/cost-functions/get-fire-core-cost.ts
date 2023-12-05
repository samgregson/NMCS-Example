import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { AggNmcsState } from '../../agg-nmcs-state';

export function getFireCoreCost (state: AggNmcsState, props: AggNmcsRulesData) {
  const fireCoreCost = (state.fireCoreCount === props.targetFireCoreCount) ? 0 : 1e6;
  return fireCoreCost;
}
