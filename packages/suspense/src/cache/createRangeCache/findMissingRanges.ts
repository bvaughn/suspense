import {
  ComparisonFunction,
  GetPoint,
  RangeIterator,
  RangeTuple,
} from "../../types";
import { findNearestIndex } from "./findNearestIndex";

export function findMissingRanges<Point, Value>(
  sortedValues: Value[],
  start: Point,
  end: Point,
  getPoint: GetPoint<Point, Value>,
  rangeIterator: RangeIterator<Point>,
  comparisonFunction: ComparisonFunction<Point>
): RangeTuple<Point>[] {
  if (sortedValues.length === 0) {
    return [[start, end]];
  }

  const missingRanges: RangeTuple<Point>[] = [];

  let currentRange: RangeTuple<Point> | null = null;

  rangeIterator(start, end, (current: Point) => {
    const index = findNearestIndex(
      sortedValues,
      current,
      getPoint,
      comparisonFunction
    );
    const foundMatch = current === getPoint(sortedValues[index]);

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
  });

  if (currentRange) {
    missingRanges.push(currentRange);
  }

  return missingRanges;
}
