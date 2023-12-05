import { NmcsState } from './nmcs-state';

/** this abstract class sets up all the required properties and methods
 * needed to define a set of rules which can be run by the Nmcs algorithm.
 */
export abstract class NmcsRules<State extends NmcsState<Action, FinalAction>, Action, FinalAction> {
  readonly initialState: State;

  constructor (initialState: State) {
    this.initialState = initialState;
  }

  /** optional method for implementing a cost of an action
   * the cost will be used only for the action decision that
   * is currently being considered in the nested search.
   * By default this returns 0, and so has no effect.
   */
  getActionCost (_action: Action) {
    return 0;
  }

  /** function to update the state with an action, the state is
   *  mutated in the process */
  abstract updateState(state: State, action: Action) : void;

  /** function to calculate valid actions */
  abstract getValidActions(state: State) : Action[];

  /** function to calculate cost which will be minimised
   * in reality the NMCS algorithm tries to maximise reward, this
   * is calculated as -1*cost.
   */
  abstract getCost(state: State) :number;

  abstract cloneState(state: State): State;

  /** add validity conditions.
   * expensive state validity checks should be done here.
  */
  protected abstract isActionValid(state: State, action: Action) : boolean;

  /** the default policy is to pick a valid action randomly
   * this can be overriden to use a "heavy playout" strategy
   * which biases to include some domain specific knowledge
  */
  pickActionWithPolicy (validActions: Action[], rng: () => number): Action {
    const action = validActions[Math.floor(rng() * validActions.length)];
    return action;
  }

  /** final action before costing */
  abstract finalAction(state: State): void;
}
