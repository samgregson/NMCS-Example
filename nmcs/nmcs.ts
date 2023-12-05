import { NmcsRules } from './nmcs-rules';
import { NmcsState } from './nmcs-state';

/** This class contains the algorithm for running a Nested Monte Carlo Search (NMCS).
 * The class accepts a set of rules (an implementation of NmcsRules) in its constructor
 * and runs a nested search via the main method 'runSearch'.
 */
export class Nmcs<State extends NmcsState<Action, FinalAction>, Action, FinalAction> {
  private readonly rootState: State;
  private rules: NmcsRules<State, Action, FinalAction>;

  constructor (rules: NmcsRules<State, Action, FinalAction>) {
    this.rules = rules;
    this.rootState = this.rules.initialState;
  }

  /**
   * Runs a NMC search
   * For more information on the algorithm see for example: https://www.ijcai.org/Proceedings/09/Papers/083.pdf
   * @param state is primarily used internally and defaults to the initial state defined in the NmcsRules
   * @param level defined the level of nested calls, the higher the level the better the result but the
   * search increases exponentially, typically a level of 2 provides a good balance.
   * @param rng a random number generator to be used by random actions such as rollouts
   * @returns a solution which extends NmcsState, as defined by the NmcsRules
   */
  runSearch ({ state, level, rng }: {
    state?: State;
    level: number;
    rng: () => number;
  }) {
    if (!state) state = this.rootState;
    const currentState = this.rules.cloneState(state);
    let bestReward = -Infinity;
    let bestSolution = this.rootState;
    let iters = 0;
    const nRollouts = 1;

    if (level === 0) {
      let { reward: bestInnerReward, solution: bestInnerSolution } = this.rollout(currentState, rng);
      for (let i = 1; i < nRollouts; i++) {
        const { reward, solution } = this.rollout(currentState, rng);
        if (reward > bestInnerReward) { bestInnerReward = reward; bestInnerSolution = solution; }
      }
      return { reward: bestInnerReward, solution: bestInnerSolution, iters: nRollouts };
    } else {
      let validActions = this.rules.getValidActions(currentState);
      if (validActions.length === 0) {
        this.rules.finalAction(currentState);
        const reward = -1 * this.rules.getCost(currentState);
        return { reward, solution: currentState, iters };
      }
      while (validActions.length > 0) {
        // run nested mcs for each action and select the best one
        let bestInnerReward = -Infinity;
        let bestInnerSolution = this.rules.cloneState(this.rootState);
        let bestAction = validActions[0];
        for (const action of validActions) {
          const innerState = this.rules.cloneState(currentState);
          this.rules.updateState(innerState, action);
          const { reward, solution, iters: rolloutIters } = this.runSearch({ state: innerState, level: level - 1, rng });
          const rewardAdjusted = reward - this.rules.getActionCost(action);
          if (rewardAdjusted > bestInnerReward) { bestInnerReward = rewardAdjusted; bestAction = action; bestInnerSolution = solution; }
          iters += rolloutIters;
        }
        if (bestInnerReward > bestReward) { bestReward = bestInnerReward; bestSolution = bestInnerSolution; }
        this.rules.updateState(currentState, bestAction);
        validActions = this.rules.getValidActions(currentState);
      }
      return { reward: bestReward, solution: bestSolution, iters };
    }
  }

  /** takes actions according to the policy
   * until a terminal NmcsState has been reached
   * and returns the cost.
   * final action allows any modifications that need
   * to occur at the end of a rollout before getting costs
   */
  private rollout (state: State, rng: () => number) {
    const solution = this.rules.cloneState(state);
    let validActions = this.rules.getValidActions(state);
    while (validActions.length > 0) {
      const action = this.rules.pickActionWithPolicy(validActions, rng);
      this.rules.updateState(solution, action);
      validActions = this.rules.getValidActions(solution);
    }
    this.rules.finalAction(solution);
    const reward = -1 * this.rules.getCost(solution);
    return { reward, solution };
  }
}
