import { RG_TYPE } from '@project-rouge/rg-core';
import { AggNmcsRulesData } from '../../agg-nmcs-rules-data';
import { AggNmcsState } from '../../agg-nmcs-state';

/** adds a cost to each non-closing unit on ends, so as to encourage 2 closing units where possible
 * a cost of 0.5 is added for each end for which a closing unit could be added but is not
 */
export function getClosingCost (state: AggNmcsState, props: AggNmcsRulesData) {
  let closingCost = 0;

  // loop over both ends
  for (let i = 0; i < 2; i++) {
    // only consider ends where it is possible to add a closing unit
    if (props.canCloseEnds[i] && props.endClosingDistances[i] === 0) {
      const n = i === 0 ? 0 : state.sequence.length - 1;
      const action = state.sequence[n];
      if (!action) return 0;
      if (action.unit.type === RG_TYPE.Apartment && action.unit.data.closeCorridor) continue;
      else closingCost += 0.5;
    }
  }
  return closingCost;
}
