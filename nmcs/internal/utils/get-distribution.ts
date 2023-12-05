import { Apartment, RG_TYPE } from '@project-rouge/rg-core';
import { getRatios } from '../../../distribution/get-distribution';
import { AggNmcsAction } from '../../agg-nmcs-action';
import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';

interface categoryCount {
  label: string,
  count: number
}

/** returns an array of ratios the order of which is consistent with the dataset  */
export function getDistribution (sequence: AggNmcsAction[], props: AggNmcsRulesData) {
  const unitMix = props.targetUnitMix;

  const counter : categoryCount[] = unitMix.map(m => { return { label: m.label, count: 0 }; });

  let apartment: Apartment | undefined;
  for (const action of sequence) {
    if (action.unit.type === RG_TYPE.Entrance) {
      apartment = props.dataset.apartments.aboveEntrance[0];
    }
    if (action.unit.type === RG_TYPE.Apartment) {
      apartment = action.unit;
    }
    if (apartment) {
      counter.find(c => c.label === apartment!.data.category)!.count++;
    }
  }
  const ratios = getRatios(counter.map(m => m.count));

  return ratios;
}
