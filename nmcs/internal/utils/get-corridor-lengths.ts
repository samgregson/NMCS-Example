import { RG_TYPE } from '@project-rouge/rg-core';
import { AggNmcsAction } from '../../agg-nmcs-action';
import { getCurrentLength } from './get-current-length';

export function getCorridorLengths (sequence: AggNmcsAction[], gap: number) {
  const corridorDists: number[] = [];
  let lastCorridor = -1;
  let unitsList;
  for (let i = 0; i < sequence.length; i++) {
    if (sequence[i].unit.type === RG_TYPE.Core) {
      unitsList = sequence.slice(lastCorridor + 1, i);
      if (unitsList && unitsList.length > 0) { corridorDists.push(getCurrentLength(unitsList, gap)); } else { corridorDists.push(0); }
      lastCorridor = i;
    }
  }
  unitsList = sequence.slice(lastCorridor + 1, sequence.length);
  if (unitsList && unitsList.length > 0) { corridorDists.push(getCurrentLength(unitsList, gap)); } else { corridorDists.push(0); }
  return corridorDists;
}
