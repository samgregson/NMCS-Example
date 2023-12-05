import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { AggNmcsState } from '../../agg-nmcs-state';

export function getEntranceCost (state: AggNmcsState, props: AggNmcsRulesData) {
  const entranceCost = (state.entranceCount === props.targetEntranceCount) ? 0 : 1e6;
  return entranceCost;
}
