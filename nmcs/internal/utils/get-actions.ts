import { Apartment, Core, Entrance, RG_TYPE, RougeDataSet } from '@project-rouge/rg-core';
import { RgDefaultCreate } from '../../../../aggregator-utils/rg-default-create';
import { getApartmentCategory } from '../../../../aggregator/mix/get-apartment-category';
import { AggNmcsAction } from '../../agg-nmcs-action';
import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { getEntranceDistance } from './get-entrance-distance';
import { getEntranceDoorWidth } from './get-entrance-door-width';
import { getActionGia } from './get-action-gia';

export type Unit = (Core | Entrance | Readonly<Apartment>)

export function getActions (props: AggNmcsRulesData) {
  const units = extractUnitsFromProps(props.dataset);
  const rolloutWeights = getUnitWeights({ units, props });
  const corridorWidth = props.dataset.aggConfig.corridorWidth;

  const actions : AggNmcsAction[] = [];
  for (let i = 0; i < units.length; i++) {
    actions.push({
      unit: units[i],
      rolloutWeight: rolloutWeights[i],
      doorPosition: getEntryPosition(units[i]),
      doorWidth: getEntranceDoorWidth(units[i]),
      gia: getActionGia(units[i], corridorWidth, props.isDoubleLoaded)
    });
  }

  return actions;
}

function getUnitWeights ({ units, props }: {
  units: Unit[];
  props: AggNmcsRulesData;
}) {
  // entrances to occur proportional to targetEntranceCount considering size and total length
  const aboveEntrance = props.dataset.apartments.aboveEntrance[0];
  const entranceWeight = props.targetEntranceCount * (aboveEntrance.size[0] / props.targetLength);

  // apartment weight factors calculated and factored below
  const typicalCoreWeight = props.dataset.aggConfig.coreWithStairs.size[0] / (2 * props.dataset.aggConfig.maxTravelDistBidirectional);
  const apartmentWeightFactor = 1 - typicalCoreWeight - entranceWeight;
  const closeApartmentWeightFactor = 100 * apartmentWeightFactor;

  const weights = [];

  const permittedApartments = props.targetUnitMix.flatMap(m => m.apartmentNames);

  for (const unit of units) {
    let weight = 0;
    if (unit.type === RG_TYPE.Core) {
      // cores to occur proportional to corridor distance
      weight = unit.size[0] / (2 * props.dataset.aggConfig.maxTravelDistBidirectional);
    } else if (unit.type === RG_TYPE.Entrance) {
      weight = entranceWeight;
    } else {
      if (!permittedApartments.includes(unit.name)) {
        weight = 0;
      } else {
        // units to occur proportional to the unitMix ratio
        // weighting to consider ratio as well as how many units within the ratio
        const unitCategoryMix = getApartmentCategory(props.targetUnitMix, unit);
        weight = unitCategoryMix ? unitCategoryMix.ratio / unitCategoryMix.apartmentNames.length : 0;
        weight = Math.max(weight, 0.0001);
      }

      if (unit.data.closeCorridor) {
        weight *= closeApartmentWeightFactor;
      } else {
        weight *= apartmentWeightFactor;
      }
    }
    weights.push(weight);
  }
  return weights;
}

/**
 * extracts required units from the dataset
 * @param dataset
 * @returns
 */
function extractUnitsFromProps (dataset: RougeDataSet) : Unit[] {
  const { f2fHeight, gap, moduleDepth } = dataset.aggConfig;
  const coreWithStairs = dataset.aggConfig.coreWithStairs.size;
  const coreWithLifts = dataset.aggConfig.coreWithLifts.size;
  const coreWithFfLifts = dataset.aggConfig.coreWithFfLifts.size;

  const core = RgDefaultCreate<Core>({
    type: RG_TYPE.Core,
    size: [coreWithStairs[0], f2fHeight, coreWithStairs[1]],
    anchor: [0.5, 0, 0]
  });

  const liftCore = RgDefaultCreate<Core>({
    type: RG_TYPE.Core,
    size: [coreWithLifts[0], f2fHeight, coreWithLifts[1]],
    anchor: [0.5, 0, 0],
    data: {
      jointID: '',
      muscleID: '',
      hasNonFireLift: true,
      level: -1,
      levelId: ''
    }
  });

  const fireCore = RgDefaultCreate<Core>({
    type: RG_TYPE.Core,
    size: [coreWithFfLifts[0], f2fHeight, coreWithFfLifts[1]],
    anchor: [0.5, 0, 0],
    data: {
      jointID: '',
      muscleID: '',
      hasFireLift: true,
      level: -1,
      levelId: ''
    }
  });

  const aboveEntrance = dataset.apartments.aboveEntrance[0];
  const nextToEntrance = dataset.apartments.nextToEntrance[0];
  const entranceSizeX = aboveEntrance.size[0] - nextToEntrance.size[0] - gap;
  const entrance = RgDefaultCreate<Entrance>({
    type: RG_TYPE.Entrance,
    size: [entranceSizeX, dataset.aggConfig.f2fHeight, moduleDepth],
    anchor: [0.5, 0, 0]
  });

  const units : Unit[] = [
    ...dataset.apartments.all,
    entrance,
    core,
    fireCore,
    liftCore
  ];
  return units;
}

/**
 * calculates the distance of the units' entrance mid point in the direction of aggregation
 * because cores and entrances have their entrances added later in the pipeline an assumed position
 * is used instead of extracting it from the units themselves
 * @param units an array of (Entrance | Core | Apartment)
 * @returns the position of the entrance from the units end, in the direction of aggregation
 */
function getEntryPosition (unit: Unit) {
  // core entry position is calculated to be halfway through its width
  if (unit.type === RG_TYPE.Core) return unit.size[0] * 0.5;
  // entrance entry position is calculated to be halfway through its width
  else if (unit.type === RG_TYPE.Entrance) return unit.size[0] * 0.5;
  // calculate apartments' entry positions
  else { return getEntranceDistance(unit); }
}
