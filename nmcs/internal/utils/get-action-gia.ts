import { RG_TYPE } from '@project-rouge/rg-core';
import { Unit } from './get-actions';

/** calculates the approximate gia contribution of the action,
 * accounting for appropriate proportion of corridor
*/
export function getActionGia (unit: Unit, corridorWidth: number, isDoubleLoaded: boolean) {
  // corridor contribution (assuming not closing)
  const effectiveCorrWidth = isDoubleLoaded ? corridorWidth : 0.5 * corridorWidth;
  let gia = unit.size[0] * effectiveCorrWidth;

  // module areas:
  if (unit.type === RG_TYPE.Apartment) {
    gia += unit.children.reduce((sum, m) => sum + m.size[0] * m.size[1], 0);
    // remove corridor contribution if closing apartment
    if (unit.data.closeLength) gia -= unit.data.closeLength * effectiveCorrWidth;
  }
  // core areas:
  if (unit.type === RG_TYPE.Apartment) {
    gia += unit.size[0] * unit.size[1];
  }
  return gia;
}
