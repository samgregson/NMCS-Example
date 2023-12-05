import { AggNmcsAction } from '../../agg-nmcs-action';
/** distance from right apartment corner to right door corner */
export function getDoorDistanceFromRight (action: AggNmcsAction) {
  return action.unit.size[0] - action.doorPosition - 0.5 * action.doorWidth;
}
