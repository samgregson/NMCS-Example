import { RG_TYPE } from '@project-rouge/rg-core';
import { randomWeightedItem } from '@project-rouge/rg-three';
import { AggNmcsAction } from './agg-nmcs-action';
import { AggNmcsRulesData, AggNmcsRulesProps } from './agg-nmcs-rules-data';
import { AggNmcsState } from './agg-nmcs-state';
import { getCoreCost } from './internal/cost-functions/get-core-cost';
import { getCorridorCost } from './internal/cost-functions/get-corridor-cost';
import { getEndClashCost } from './internal/cost-functions/get-end-clash-cost';
import { getEntranceCost } from './internal/cost-functions/get-entrance-cost';
import { getFireCoreCost } from './internal/cost-functions/get-fire-core-cost';
import { getLengthCost } from './internal/cost-functions/get-length-cost';
import { getLiftCoreCost } from './internal/cost-functions/get-lift-core-cost';
import { getEfficiencyCost } from './internal/cost-functions/get-efficiency-cost';
import { getUnitMixCost } from './internal/cost-functions/get-unit-mix-cost';
import { NmcsRules } from './nmcs-rules';
import { getStairCoreCost } from './internal/cost-functions/get-stair-core-cost';
import { getDataAndActions } from './internal/utils/get-data-and-actions';
import { getDoorDistanceFromRight } from './internal/utils/get-door-distance-from-right.internal';
import { getStartClashStatus } from './internal/utils/get-start-clash-status';
import { getClosingCost } from './internal/cost-functions/get-closing-cost';

enum CorridorType {
  Start = 'Start',
  Middle = 'Middle',
  End = 'End'
}

/** This class extends from NmcsRules in order to apply the NMCS algorithm to the apartment
 * aggregation problem.
 * The class does a bunch of things but the two primary objectives are:
 * - Define which actions are valid for a given state. Where actions are which apartment, core,
 * or entrance unit to add, and state is the current state of units already added.
 * - Define a scoring system for a solution (a completed aggregation of units). This score
 * balances a number of objectives which is dealt with by applying weights to each objective.
 * */
export class AggNmcsRules extends NmcsRules<AggNmcsState, AggNmcsAction, AggNmcsRulesData> {
  readonly actions: readonly AggNmcsAction[];
  private data: AggNmcsRulesData;

  constructor (aggRulesProps : AggNmcsRulesProps) {
    const { gap } = aggRulesProps.dataset.aggConfig;
    const { data, actions } = getDataAndActions(aggRulesProps);

    super(new AggNmcsState({ gap, data }));
    this.data = data;
    this.actions = actions;
  }

  protected isActionValid (state: AggNmcsState, action: AggNmcsAction, ignoreEntranceCheck?: boolean) {
    const { gap } = this.data.dataset.aggConfig;
    // (effective) unit length
    const unitLength = gap + action.unit.size[0];

    if (!this.isValidForBuildingEntrance(state, action, ignoreEntranceCheck)) return false;

    const totalLengthWithShift = state.totalLength + state.requiredShift;
    const prevUnit = state.sequence[state.sequence.length - 1];
    const isDefinitelyLastApartment = (totalLengthWithShift + unitLength) > (this.data.targetLength - this.data.smallestApartmentSize);

    // check unit size fits within target length
    if ((totalLengthWithShift + unitLength) > this.data.targetLength) return false;

    if (state.sequence.length === 0 && !this.isValidForClashesAtStart(action, this.data.lockEnds[0])) return false;
    if (isDefinitelyLastApartment && !this.isValidForClashesAtEnd(state, action)) return false;

    // do not allow close apartment if cannot close
    if (action.unit.type === RG_TYPE.Apartment && action.unit.data.closeDirection) {
      const closeDirection = action.unit.data.closeDirection;
      const canCloseStart = this.data.canCloseEnds[0] && this.data.endClosingDistances[0] === 0;
      const canCloseEnd = this.data.canCloseEnds[1] && this.data.endClosingDistances[1] === 0;
      const closesAtStart = closeDirection[0] > 0;
      const closesAtEnd = closeDirection[0] < 0;
      const isFirstUnit = state.sequence.length === 0;

      if (closesAtStart && !isFirstUnit) return false;
      if (closesAtStart && !canCloseStart) return false;
      if (closesAtEnd && !canCloseEnd) return false;
      if (closesAtEnd && !isDefinitelyLastApartment) return false;
    }

    // do not allow anything following a closing corridor
    if (prevUnit && prevUnit.unit.type === RG_TYPE.Apartment && prevUnit.unit.data.closeCorridor) {
      const closeDirection = prevUnit.unit.data.closeDirection;
      if (closeDirection && closeDirection[0] < 0) return false;
    }

    // checks should be arranged in order of increasing computational complexity for optimal performance
    if (!this.isValidForSkipCores(action)) return false;
    if (!this.isValidForFireCores(state, action)) return false;
    if (!this.isValidForCorridorDistances(state, action, totalLengthWithShift, prevUnit, unitLength)) return false;

    return true;
  }

  /** Checks related to building entrances, including:
   * - making sure there is an entrance at the start when required
   * - invalidating entrances when not required
   * - checking next to entrance validity
   * - checking above entrance validity
  */
  isValidForBuildingEntrance (state: AggNmcsState, action: AggNmcsAction, ignoreEntranceCheck?: boolean) {
    if (action.unit.type === RG_TYPE.Entrance) {
      if (state.entranceCount + 1 > this.data.targetEntranceCount) return false;

      // check if the "next to entrance" apartments can be aggregated
      const tempState = state.clone();
      tempState.update(action);
      const nextToActions = this.actions.filter(a => a.unit.type === RG_TYPE.Apartment && a.unit.data.nextToEntrance);
      const validForNext = nextToActions.some(n => this.isActionValid(tempState, n));
      if (!validForNext) return false;

      // check if the "above entrance" apartments can be aggregated
      const aboveActions = this.actions.filter(a => a.unit.type === RG_TYPE.Apartment && a.unit.data.aboveEntrance);
      const validForAbove = aboveActions.some(n => this.isActionValid(state, n, true));
      if (!validForAbove) return false;
    }

    // force entrance at start when applicable
    if (state.sequence.length === 0 && this.data.hasEntryAtStart && !ignoreEntranceCheck) {
      if (action.unit.type !== RG_TYPE.Entrance) return false;
    }

    // filters for when prev unit is entrance
    let isRequiredByEntrance = false;
    const prevUnit = state.sequence[state.sequence.length - 1];
    const isPrevUnitEntrance = (prevUnit && prevUnit.unit.type === RG_TYPE.Entrance);
    if (isPrevUnitEntrance) {
      const validAfterEntrance = this.data.dataset.apartments.nextToEntrance.map(a => a.name).includes(action.unit.name);
      if (!validAfterEntrance) { return false; } else { isRequiredByEntrance = true; }
    }
    // ban actions with 0 rollout weight unless required
    if (action.rolloutWeight === 0 && !isRequiredByEntrance) {
      return false;
    }

    return true;
  };

  /** loop through all actions and append valid actions to validActions list */
  getValidActions (state: AggNmcsState) {
    const allActions = this.actions;
    const validActions: AggNmcsAction[] = [];
    for (const action of allActions) {
      if (this.isActionValid(state, action)) {
        validActions.push(action);
      }
    }
    return validActions;
  };

  /** Costs are used to optimise the action selection, the lower the cost the better,
   * in general each cost should not change too much even if the muscle length
   * changes considerably in order to bring consistency and make tuning weights easier.
  */
  getCost (state: AggNmcsState) {
    const corridorCost = this.data.weights.corridorLengthWeight * getCorridorCost(state, this.data);
    const coreCost = this.data.weights.coreCountWeight * getCoreCost(state, this.data);
    const lengthCost = this.data.weights.totalLengthWeight * getLengthCost(state, this.data);
    const unitMixCost = this.data.weights.unitMixWeight * getUnitMixCost(state, this.data);
    const entranceCost = this.data.weights.entranceCountWeight * getEntranceCost(state, this.data);
    const fireCoreCost = 1 * getFireCoreCost(state, this.data);
    const liftCoreCost = 1 * getLiftCoreCost(state, this.data);
    const stairCoreCost = 1 * getStairCoreCost(state, this.data);
    const efficiencyCost = this.data.weights.efficiencyWeight * getEfficiencyCost(state);
    const endClashCost = 1 * getEndClashCost(state, this.data);
    const closingCost = this.data.weights.closingWeight * getClosingCost(state, this.data);

    const totalCost =
      corridorCost +
      coreCost +
      lengthCost +
      unitMixCost +
      entranceCost +
      fireCoreCost +
      liftCoreCost +
      stairCoreCost +
      efficiencyCost +
      endClashCost +
      closingCost;

    return totalCost;
  };

  pickActionWithPolicy (validActions: AggNmcsAction[], rng: () => number): AggNmcsAction {
    if (validActions.length === 1) {
      return validActions[0];
    }
    const weights = [];
    for (const action of validActions) weights.push(action.rolloutWeight);
    const action = randomWeightedItem({ list: validActions, weights, rng });
    return action;
  }

  cloneState (state: AggNmcsState) { return state.clone(); };

  updateState (state: AggNmcsState, action: AggNmcsAction) {
    state.update(action);
  };

  finalAction (state: AggNmcsState): void {
    state.finalUpdate(this.data);
  }

  /** returns true if valid, false otherwise */
  private isValidForClashesAtStart (action: AggNmcsAction, lockedStart: boolean) : boolean {
    const startClosingDistance = this.data.endClosingDistances[0];
    const startEntranceDistance = this.data.endEntranceDistances[0];
    // if not locked at start then the position of the first unit could shift to the right,
    // therefore skip check against any existing closing apartment as this could get resolved.
    const skipExistingClosingCheck = !lockedStart;
    const clashStatus = getStartClashStatus({ action, startClosingDistance, startEntranceDistance, skipExistingClosingCheck });
    return clashStatus;
  }

  private isValidForClashesAtEnd (state: AggNmcsState, action: AggNmcsAction) : boolean {
    // calculate any gap at end if muscle not locked at end
    let shift = 0;
    if (!this.data.lockEnds[1]) {
      shift = this.data.targetLength - (state.totalLength + this.data.dataset.aggConfig.gap + action.unit.size[0]);
    }

    // check clash of this unit with an existing closing apartment at end
    if (this.data.endClosingDistances[1] > 0) {
      // calculate door position of this unit from end of unit considering shift if not locked
      const doorPositionFromEnd = getDoorDistanceFromRight(action) + shift;

      if (doorPositionFromEnd < this.data.endClosingDistances[1]) {
        return false;
      }

      if (action.unit.type === RG_TYPE.Apartment && action.unit.data.closeCorridor) {
        return false;
      }
    }

    // check clash of a new closing apartment with existing normal apartment at end
    if (action.unit.type === RG_TYPE.Apartment && action.unit.data.closeCorridor) {
      if (action.unit.data.closeLength! + shift > this.data.endEntranceDistances[1]) {
        return false;
      }
    }

    return true;
  }

  private isValidForCorridorDistances (state: AggNmcsState, action: AggNmcsAction, totalLengthWithShift: number, prevUnit: AggNmcsAction, unitLength: number) : boolean {
    // ignore corridor distances if skipping cores
    if (this.data.skipCores) return true;

    // calculate corridor dist
    const corridorDists = state.corridorLengths;
    const currentCorridorLength = corridorDists[corridorDists.length - 1] ?? 0;
    const lengthRemaining = this.data.targetLength - totalLengthWithShift;
    const { corridorType, maxCorridorDist } = this.getCorridorTypeAndDistance(corridorDists, lengthRemaining);

    if (action.unit.type === RG_TYPE.Core) {
      const twoConsecutiveCores = prevUnit && prevUnit.unit.type === RG_TYPE.Core;
      if (twoConsecutiveCores) { return false; }
    } else {
      // Check apartment conditions:

      if (!prevUnit && corridorType === CorridorType.Start && !this.data.hasCornerAt[0]) {
        // on very first unit, with no core at start, check if the distance to the unit's door doesn't exceed max travel distance
        // check adding unit does not exceed corridor dist constraints (from right only)
        if (Math.max(getDoorDistanceFromRight(action), unitLength - this.data.endEntranceDistances[0]) > maxCorridorDist) { return false; }
      } else if (corridorType === CorridorType.End && !this.data.hasCornerAt[1]) {
        // on end section, with no core at muscle end, check if the distance to the unit's door doesn't exceed max travel distance
        // check adding unit does not exceed corridor dist constraints (from left only)
        if (currentCorridorLength + action.doorPosition > maxCorridorDist) { return false; }
      } else {
        // on start or middle, or end section with a core at the end
        // check if adding the whole length of the unit exceeds the max travel distance
        if (currentCorridorLength + unitLength > maxCorridorDist) { return false; }
      }
    }

    return true;
  }

  private isValidForSkipCores (action: AggNmcsAction) {
    if (this.data.skipCores && action.unit.type === RG_TYPE.Core) { return false; }
    return true;
  }

  private isValidForFireCores (state: AggNmcsState, action: AggNmcsAction) {
    if (action.unit.type === RG_TYPE.Core) {
      if (action.unit.data.hasFireLift) {
        if (state.fireCoreCount + 1 > this.data.targetFireCoreCount) { return false; }
      }
      if (action.unit.data.hasNonFireLift) {
        if (state.liftCoreCount + 1 > this.data.targetLiftCoreCount) { return false; }
      }
    }
    return true;
  }

  /** `corridorType` is calculated and defined as follows:
   * - Start: the current unit is positioned before the first core
   * - Middle: the current unit is between two cores
   * - End: the current unit is after the last core
   *
   * the `maxCorridorDist` reflects the `corridorType` and `aggConfig`
   */
  private getCorridorTypeAndDistance (corridorDists: readonly number[], lengthRemaining: number) {
    let corridorType: CorridorType;

    const allowableEndDist = this.data.maxCorridorDists.end - this.data.distToCore[1];
    const currentEndCorridorLength = lengthRemaining + corridorDists[corridorDists.length - 1];

    if (currentEndCorridorLength <= allowableEndDist + this.data.minDoorPositionFromEnd) {
      // if length remaining is less than max corridor dist at end
      // then we are at the last corridor
      corridorType = CorridorType.End;
    } else if (corridorDists.length <= 1) {
      // else if no core has been added yet
      // then we are in the first corridor
      corridorType = CorridorType.Start;
    } else {
      // if none of the above is met, use the middle distance threshold
      // otherwise we are in an intermediate corridor
      corridorType = CorridorType.Middle;
    }

    let maxCorridorDist;
    if (corridorType === CorridorType.Start) maxCorridorDist = this.data.maxCorridorDists.start;
    else if (corridorType === CorridorType.Middle) maxCorridorDist = this.data.maxCorridorDists.middle;
    else maxCorridorDist = allowableEndDist;

    return { corridorType, maxCorridorDist };
  }
}
