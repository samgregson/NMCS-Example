
export abstract class NmcsState<Action, FinalAction> {
  abstract clone: () => NmcsState<Action, FinalAction>;
  abstract update: (action: Action) => void;
  /** final update after all actions did run */
  finalUpdate (_action: FinalAction) {}
}
