import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { AggNmcsState } from '../../agg-nmcs-state';
import { getStartClashStatus } from '../utils/get-start-clash-status';

/** the nmcs aggregator cannot account for any shifting that occurs due to a non locked start
 * of the muscle. Therefore a clash check is required after full aggregation to check any clashing
 * under these conditions only (i.e. if lockEnds[0] is true assume checks have been made already)
 * Checks are only required for start clashes as shifting is accounted for for end clashes
 */
export function getEndClashCost (state: AggNmcsState, props: AggNmcsRulesData) {
  // if start is locked previous checks during aggregation would be sufficient
  if (props.lockEnds[0]) { return 0; }

  const action = state.sequence[0];
  if (!action) return 0;

  const diff = props.targetLength - state.totalLength;
  const startClosingDistance = props.endClosingDistances[0];
  const startEntranceDistance = props.endEntranceDistances[0];

  if (!getStartClashStatus({ action, startClosingDistance, startEntranceDistance, diff })) {
    return 1e6;
  } else {
    return 0;
  }
}
