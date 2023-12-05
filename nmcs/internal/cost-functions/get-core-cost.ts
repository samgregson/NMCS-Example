import { RG_TYPE } from '@project-rouge/rg-core';
import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { AggNmcsState } from '../../agg-nmcs-state';

/** adds a cost to each core, so as to encourage a low core count */
export function getCoreCost (state: AggNmcsState, props: AggNmcsRulesData) {
  if (props.skipCores) { return 0; }
  const coreCost = state.sequence.filter(u => u.unit.type === RG_TYPE.Core).length * props.dataset.aggConfig.maxTravelDistBidirectional * 2 / state.totalLength;
  return coreCost;
}
