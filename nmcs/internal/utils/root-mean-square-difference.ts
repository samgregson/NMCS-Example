/** calculates the root square of the differences between target and actual numbers
 * Note: the sum of the differences are normalised by the sum of the list
 */
export function rootMeanSquareDifference (list: number[], targets: number[]) {
  if (list.length !== targets.length) { throw new Error('rootMeanSquareDifference list and target lengths are not equal'); }

  let sumDiffSq = 0;
  for (let i = 0; i < list.length; i++) {
    const diff = targets[i] - list[i];
    sumDiffSq += diff * diff;
  }

  return Math.sqrt(sumDiffSq) / list.reduce((sum, v) => sum + v, 0);
}
