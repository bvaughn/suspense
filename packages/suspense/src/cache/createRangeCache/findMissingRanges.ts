import { ComparisonFunction, GetPointForValue, RangeTuple } from "../../types";
import { findNearestIndex } from "./findNearestIndex";

export function findMissingRanges<Point, Value>(
  sortedValues: Value[],
  start: Point,
  end: Point,
  getPointForValue: GetPointForValue<Point, Value>,
  getRangeIterator: (start: Point, end: Point) => Iterator<Point>,
  comparisonFunction: ComparisonFunction<Point>
): RangeTuple<Point>[] {
  if (sortedValues.length === 0) {
    return [[start, end]];
  }

  const missingRanges: RangeTuple<Point>[] = [];

  let currentRange: RangeTuple<Point> | null = null;

  const iterator = getRangeIterator(start, end);
  const iterable: Iterable<Point> = { [Symbol.iterator]: () => iterator };
  for (let current of iterable) {
    const index = findNearestIndex(
      sortedValues,
      current,
      getPointForValue,
      comparisonFunction
    );
    const foundMatch = current === getPointForValue(sortedValues[index]);

    if (foundMatch) {
      if (currentRange) {
        missingRanges.push(currentRange);

        currentRange = null;
      }
    } else {
      if (currentRange) {
        currentRange[1] = current;
      } else {
        currentRange = [current, current];
      }
    }
  }

  if (currentRange) {
    missingRanges.push(currentRange);
  }

  return missingRanges;
}
