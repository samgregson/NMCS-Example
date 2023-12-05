import { RG_TYPE, getDefaultMix } from '@project-rouge/rg-core';
import { AggNmcsRulesProps, getDefaultAggRulesProps } from '../../agg-nmcs-rules-data';
import { getActions } from './get-actions';
import { getDoorDistanceFromRight } from './get-door-distance-from-right.internal';

/** a method for AggNmcs which creates the data and action properties for a given initial aggRulesProps */
export function getDataAndActions (aggRulesProps: AggNmcsRulesProps) {
  const { gap } = aggRulesProps.dataset.aggConfig;
  const allApartments = aggRulesProps.dataset.apartments.all;
  const smallestApartmentSize = gap + Math.min(...allApartments.map(a => a.size[0]));
  const largestUnitSize = gap + Math.max(...allApartments.map(a => a.size[0]), aggRulesProps.dataset.aggConfig.coreWithLifts.size[0]);
  const smallestNextToEntranceSize = gap + aggRulesProps.dataset.apartments.nextToEntrance.map(a => a.size[0]).sort()[0];
  const defaultProps = getDefaultAggRulesProps(aggRulesProps.dataset);

  // remove undefined from aggRulesProps
  Object.keys(aggRulesProps).forEach(k => {
    const key = k as keyof AggNmcsRulesProps;
    if (aggRulesProps[key] === undefined) { delete aggRulesProps[key]; }
  });

  // combine defaultProps and aggRulesProps
  const data = {
    ...defaultProps,
    ...aggRulesProps as Required<AggNmcsRulesProps>,
    smallestApartmentSize,
    largestUnitSize,
    minDoorPositionFromEnd: 0,
    smallestNextToEntranceSize
  };

  const actions = getActions(data);
  redefineTargetUnitMix(data);
  const minDoorPositionFromEnd = Math.min(...actions.filter(a => a.unit.type === RG_TYPE.Apartment).map(a => getDoorDistanceFromRight(a)));
  data.minDoorPositionFromEnd = minDoorPositionFromEnd;
  return { data, actions };
}

/** targetUnitMix needs to properly align with the dataset categories
 * this method ensures that every category is covered even if they are missing from the input.
 */
function redefineTargetUnitMix (props: AggNmcsRulesProps) {
  const newTargetUnitMix = getDefaultMix(props.dataset);
  newTargetUnitMix.forEach(t => { t.ratio = 0; });
  if (props.targetUnitMix) {
    for (const t of props.targetUnitMix) {
      const category = newTargetUnitMix.find(nt => nt.label === t.label);
      if (category) { category.ratio = t.ratio; }
    }
  }
  props.targetUnitMix = newTargetUnitMix;
}
