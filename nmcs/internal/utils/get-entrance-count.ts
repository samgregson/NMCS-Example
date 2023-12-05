import { RG_TYPE } from '@project-rouge/rg-core';
import { AggNmcsAction } from '../../agg-nmcs-action';

export function getEntranceCount (sequence: AggNmcsAction[]) {
  let count: number = 0;
  for (let i = 0; i < sequence.length; i++) {
    if (sequence[i].unit.type === RG_TYPE.Entrance) { count++; }
  }
  return count;
}
