import { Apartment, Core, Door, Entrance, RG_TYPE } from '@project-rouge/rg-core';

const DEFAULT_DOOR_WIDTH = 1.3;

export function getEntranceDoorWidth (unit: Apartment | Core | Entrance) : number {
  let entryWidth = DEFAULT_DOOR_WIDTH;
  if (unit.type === RG_TYPE.Apartment) entryWidth = getApartmentEntryDoorWidth(unit);
  else if (unit.type === RG_TYPE.Core || unit.type === RG_TYPE.Entrance) entryWidth = getCoreEntryDoorWidth(unit);
  return entryWidth;
}

/**
 * Calculates the width of the apartment entrance door
 * The function looks for a `Door` where `door.data.isEntrance`. If no door can be found, the
 * DEFAULT_DOOR_WIDTH is returned
 * @param apt the target apartment
 * @returns a number
 */
function getApartmentEntryDoorWidth (apt: Apartment): number {
  for (const module of apt.children.filter(c => c.type === RG_TYPE.Module)) {
    for (const wall of module.children.filter(c => c.type === RG_TYPE.Wall)) {
      const door = wall.children.find(c => c.type === RG_TYPE.Door && (c as Door).data.isEntrance);
      if (door) {
        const doorWidth = door.size[0];
        return doorWidth;
      }
    }
  }
  return DEFAULT_DOOR_WIDTH;
}

/**
 * Calculates the width of the core or entrance entrance door
 * The function looks for a `Door` where `door.data.isEntrance`. If no door can be found, the
 * DEFAULT_DOOR_WIDTH is returned
 * @param unit the target core or entrance
 * @returns a number
 */
function getCoreEntryDoorWidth (unit: Core | Entrance): number {
  for (const wall of unit.children.filter(c => c.type === RG_TYPE.Wall)) {
    const door = wall.children.find(c => c.type === RG_TYPE.Door && (c as Door).data.isEntrance);
    if (door) {
      const doorWidth = door.size[0];
      return doorWidth;
    }
  }
  return DEFAULT_DOOR_WIDTH;
}
