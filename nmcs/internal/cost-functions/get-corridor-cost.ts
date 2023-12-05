import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { AggNmcsState } from '../../agg-nmcs-state';
import { rootMeanSquareDifference } from '../utils/root-mean-square-difference';

export function getCorridorCost (state: AggNmcsState, props: AggNmcsRulesData) {
  if (props.skipCores) { return 0; }

  const corridorDists = state.corridorLengths;
  const targetDists = new Array(corridorDists.length).fill(props.maxCorridorDists.middle);
  if (corridorDists.length === 1) {
    targetDists[0] = Math.min(props.maxCorridorDists.start, props.maxCorridorDists.end);
  } else {
    targetDists[0] = props.maxCorridorDists.start;
    targetDists[targetDists.length - 1] = props.maxCorridorDists.end;
  }
  /** these values are adjusted based on whether the corridor has
   * cores at both ends, in which case they are halved. This is done
   * to account for the fact that in these corridors the average walking
   * distance is half of that of an end one.
  */
  const targetDistsAdjusted = targetDists.map(v => 0.5 * v);
  const corridorDistsAdjusted = corridorDists.map(v => 0.5 * v);
  if (props.maxCorridorDists.start !== props.maxCorridorDists.middle) {
    targetDistsAdjusted[0] *= 2;
    corridorDistsAdjusted[0] *= 2;
  }
  if (props.maxCorridorDists.end !== props.maxCorridorDists.middle) {
    targetDistsAdjusted[targetDistsAdjusted.length - 1] *= 2;
    corridorDistsAdjusted[corridorDistsAdjusted.length - 1] *= 2;
  }
  // cost for even distribution of lengths
  let corridorCost = rootMeanSquareDifference(corridorDistsAdjusted, targetDistsAdjusted);

  // cost for when constraints are violated
  for (let i = 0; i < corridorDists.length; i++) {
    if (corridorDists[i] > targetDists[i]) { corridorCost += 1e6; }
  }
  return corridorCost;
}
