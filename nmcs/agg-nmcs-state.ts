import { RG_TYPE } from '@project-rouge/rg-core';
import { AggNmcsAction } from './agg-nmcs-action';
import { NmcsState } from './nmcs-state';
import { getCurrentLength } from './internal/utils/get-current-length';
import { getDoorDistanceFromRight } from './internal/utils/get-door-distance-from-right.internal';
import { getEntranceCount } from './internal/utils/get-entrance-count';
import { getLiftCoreCount } from './internal/utils/get-lift-core-count';
import { AggNmcsRulesData } from './agg-nmcs-rules-data';
import { getStairCoreCount } from './internal/utils/get-stair-core-count';
import { getFireCoreCount } from './internal/utils/get-fire-core-count';
import { getStartClashStatus } from './internal/utils/get-start-clash-status';

/** this class extends NmcsState and represents the states used by AggRules.
 * in AggRules a state (AggState) describes the sequence of apartments, cores and
 * entrances aggregated along a muscle, it also holds information additional information
 * such as accumulated length and methods as necessitated by extending NmcsState: 'clone'
 * and 'update'
 */
export class AggNmcsState extends NmcsState<AggNmcsAction, AggNmcsRulesData> {
  readonly sequence: AggNmcsAction[] = [];
  private gap: number;
  private data: AggNmcsRulesData;

  private _requiredShift: number = 0;
  public get requiredShift (): number {
    return this._requiredShift;
  }

  private _totalLength: number;
  public get totalLength (): number {
    return this._totalLength;
  }

  private readonly _corridorLengths: number[];
  public get corridorLengths (): readonly number[] {
    return this._corridorLengths;
  }

  private _entranceCount: number;
  public get entranceCount (): number {
    return this._entranceCount;
  }

  private _fireCoreCount: number;
  public get fireCoreCount (): number {
    return this._fireCoreCount;
  }

  private _liftCoreCount: number;
  public get liftCoreCount (): number {
    return this._liftCoreCount;
  }

  private _stairCoreCount: number;
  public get stairCoreCount (): number {
    return this._stairCoreCount;
  }

  constructor ({ gap, sequence = [], totalLength, corridorLengths = [0], requiredShift = 0, data }: {
    gap: number;
    sequence?: AggNmcsAction[];
    totalLength?: number;
    corridorLengths?: number[];
    requiredShift?: number;
    data: AggNmcsRulesData;
  }) {
    super();
    this.gap = gap;
    this.data = data;

    this.sequence = sequence;
    this._totalLength = totalLength ?? getCurrentLength(this.sequence, this.gap);
    this._corridorLengths = corridorLengths;
    this._entranceCount = getEntranceCount(this.sequence);
    this._fireCoreCount = getFireCoreCount(this.sequence);
    this._liftCoreCount = getLiftCoreCount(this.sequence);
    this._stairCoreCount = getStairCoreCount(this.sequence);
    this._requiredShift = requiredShift;
  }

  update = (action: AggNmcsAction) => {
    this.sequence.push(action);

    // total length
    if (this._totalLength === 0) {
      this._totalLength += action.unit.size[0];

      // move unit due to avoid starting clash, only valid when not locked at start
      if (this.data.lockEnds[0] === false) {
        const startClosingDistance = this.data.endClosingDistances[0];
        const startEntranceDistance = this.data.endEntranceDistances[0];
        const clashStatus = getStartClashStatus({ action, startClosingDistance, startEntranceDistance });
        if (!clashStatus) {
          this._requiredShift = startClosingDistance - (action.doorPosition - 0.5 * action.doorWidth);
        }
      }
    } else {
      this._totalLength += this.gap + action.unit.size[0];
    }

    this.updateCorridorDistance(action, this._requiredShift);

    // entrance count
    if (action.unit.type === RG_TYPE.Entrance) { this._entranceCount++; }
    // fire core count
    if (action.unit.type === RG_TYPE.Core && action.unit.data.hasFireLift) { this._fireCoreCount++; }
    // lift core count
    if (action.unit.type === RG_TYPE.Core && action.unit.data.hasNonFireLift) { this._liftCoreCount++; }
    // stair core count
    if (action.unit.type === RG_TYPE.Core && !action.unit.data.hasFireLift && !action.unit.data.hasNonFireLift) { this._stairCoreCount++; }

    // distribution: calculate at end only, not implemented here
  };

  clone = () => {
    return new AggNmcsState({
      sequence: this.sequence.slice(),
      totalLength: this._totalLength,
      corridorLengths: this._corridorLengths.slice(),
      gap: this.gap,
      requiredShift: this._requiredShift,
      data: this.data
    });
  };

  /** this function updates the array of travel distances
   * travel distances are an array where each item in the array
   * represents a travel distance between cores.
   * Where there are no cores at ends:
   * At the start the distance to the first door must be considered.
   * At the end the distance to the last door must be considered, this is not
   * considered here as it is not possible to know if the unit is the last.
   * Therefore this detail must be considered elsewhere.
   */
  private updateCorridorDistance (action: AggNmcsAction, shift: number = 0) {
    if (action.unit.type === RG_TYPE.Core) {
      // if this is a core, add new corridor length with 0
      this._corridorLengths.push(0);
    } else if (this.sequence.length === 1) {
      if (this.data.hasCornerAt[0] === false) {
        // if this is the first element, and there's no core at the start, use the entry door position
        this._corridorLengths[0] += Math.max(getDoorDistanceFromRight(action), shift + action.unit.size[0] - this.data.endEntranceDistances[0]);
      } else {
        this._corridorLengths[this._corridorLengths.length - 1] += action.unit.size[0] + this.data.distToCore[0];
      }
    } else {
      // for all other cases, use the size of the element
      this._corridorLengths[this._corridorLengths.length - 1] += action.unit.size[0];
    }
  }

  finalUpdate (data: AggNmcsRulesData) {
    this.finishCorridorDistance(data);
  }

  /** this should be called when a aggregation has finished
   * it accounts for the door position of the final apartment
   * as well as the final door position on the opposite muscle
   * as long as there is no core at the end of the muscle.
   */
  private finishCorridorDistance (rulesData: AggNmcsRulesData) {
    // calculate any shifting if muscle is locked at end
    const firstAction = this.sequence[0];
    if (!firstAction) return;
    const shift = rulesData.targetLength - this._totalLength;
    const isShiftedToRight = !rulesData.lockEnds[0] && rulesData.lockEnds[1];
    if (isShiftedToRight && getDoorDistanceFromRight(firstAction) < firstAction.unit.size[0] - this.data.endEntranceDistances[0] + shift) {
      // some shift already accounted for, therefore subtract this from increment
      this._corridorLengths[0] += shift - this._requiredShift;
    }

    if (this.data.hasCornerAt[1]) return;
    const lastUnit = this.sequence[this.sequence.length - 1];
    if (!lastUnit && this._corridorLengths[this._corridorLengths.length - 1] !== 0) return;
    const startOfDoorPosFromEnd = getDoorDistanceFromRight(lastUnit) + lastUnit.doorWidth;
    let oppositeDoorPosFromEnd = this.data.endEntranceDistances[1];
    if (!isShiftedToRight) {
      // some shift already accounted for, therefore subtract this from decrement
      oppositeDoorPosFromEnd -= shift - this._requiredShift;
    }
    const endDoorPos = Math.min(startOfDoorPosFromEnd, oppositeDoorPosFromEnd);
    this._corridorLengths[this._corridorLengths.length - 1] -= endDoorPos;
  }
}
