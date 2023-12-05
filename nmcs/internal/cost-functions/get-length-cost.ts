import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { AggNmcsState } from '../../agg-nmcs-state';

export function getLengthCost (state: AggNmcsState, props: AggNmcsRulesData) {
  const totalLength = state.totalLength;
  const diff = props.targetLength - totalLength;
  const lengthCost = diff >= 0 ? diff * diff : 1e6;
  return lengthCost;
}
