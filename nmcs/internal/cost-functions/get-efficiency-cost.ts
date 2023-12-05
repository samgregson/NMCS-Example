import { RG_TYPE } from '@project-rouge/rg-core';
import { AggNmcsAction } from '../../agg-nmcs-action';
import { AggNmcsState } from '../../agg-nmcs-state';

export function getEfficiencyCost (state: AggNmcsState) {
  const sumGia = state.sequence.reduce((sum, a) => sum + a.gia, 0);
  const sumNia = state.sequence.reduce((sum, a) => sum + getActionNia(a), 0);
  return 1 - sumNia / sumGia;
}

function getActionNia (action: AggNmcsAction) {
  if (action.unit.type === RG_TYPE.Apartment) return action.unit.data.nia;
  return 0;
}
