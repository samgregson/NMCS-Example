import { Apartment, Core, Entrance, RG_TYPE, V3 } from '@project-rouge/rg-core';
import { getPivot, Vector3toV3 } from '@project-rouge/rg-three';
import { getApartmentEntryPosition } from '../../../../utils/get-apartment-entry-position';
import { getCoreEntryPosition } from '../../../../utils/get-core-entry-position';

/** calculates the distance to the centre of the entrance */
export function getEntranceDistance (unit: Apartment | Core | Entrance) : number {
  let entryPos: V3 = [0, 0, 0];
  if (unit.type === RG_TYPE.Apartment) entryPos = getApartmentEntryPosition(unit);
  else if (unit.type === RG_TYPE.Core) entryPos = getCoreEntryPosition(unit);
  else Vector3toV3(getPivot([0.5, 0, 0], unit));
  // the sign of entry position is relative to the apartment coordinate system therefore it needs negating
  const entryDistance = ((1 - unit.anchor[0]) * unit.size[0] - entryPos[0]);
  return entryDistance;
}
