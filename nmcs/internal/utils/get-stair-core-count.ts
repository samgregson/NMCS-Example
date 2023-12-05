import { RG_TYPE } from '@project-rouge/rg-core';
import { AggNmcsAction } from '../../agg-nmcs-action';

export function getStairCoreCount (sequence: AggNmcsAction[]) {
  let count: number = 0;
  for (let i = 0; i < sequence.length; i++) {
    const unit = sequence[i].unit;
    if (unit.type === RG_TYPE.Core && !unit.data.hasFireLift && !unit.data.hasNonFireLift) { count++; }
  }
  return count;
}
