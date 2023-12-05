import { AggNmcsAction } from '../../agg-nmcs-action';

export function getCurrentLength (sequence: AggNmcsAction[], gap: number) {
  if (sequence.length === 0) return 0;
  return sequence.reduce((sum, apartment) => sum + apartment.unit.size[0] + gap, 0) - gap;
}
