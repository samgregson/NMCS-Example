import { RG_TYPE } from '@project-rouge/rg-core';
import { AggNmcsAction } from '../../agg-nmcs-action';

/** returns false if there is a clash between closing apartments
 * and apartments on the opposite muscle.
 * This clash is calculated for existing as well as new closing apartments
 */
export function getStartClashStatus ({ action, startClosingDistance, startEntranceDistance, diff = 0, skipExistingClosingCheck = false }: {
  action: AggNmcsAction;
  startClosingDistance: number;
  startEntranceDistance: number;
  diff?: number;
  skipExistingClosingCheck?: boolean;
}) {
  // check clash of this unit with an existing closing apartment at start
  if (startClosingDistance > 0 && !skipExistingClosingCheck) {
    if ((action.doorPosition - 0.5 * action.doorWidth + diff) < startClosingDistance) {
      return false;
    }
    if (action.unit.type === RG_TYPE.Apartment && action.unit.data.closeCorridor) {
      return false;
    }
  }

  // check clash of a new closing apartment with existing normal apartment at start
  if (action.unit.type === RG_TYPE.Apartment && action.unit.data.closeCorridor) {
    if (action.unit.data.closeLength! + diff > startEntranceDistance) {
      return false;
    }
  }

  return true;
}
