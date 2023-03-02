import { ComparisonFunction, GetPointForValue } from "../../types";
import { findNearestIndexBefore, findNearestIndexAfter } from "./findIndex";

export function sliceValues<Point, Value>(
  sortedValues: Value[],
  start: Point,
  end: Point,
  getPointForValue: GetPointForValue<Point, Value>,
  comparePoints: ComparisonFunction<Point>
): Value[] {
  if (sortedValues.length === 0) {
    return [];
  }

  const startIndex = findNearestIndexAfter(
    sortedValues,
    start,
    getPointForValue,
    comparePoints
  );

  const endIndex = findNearestIndexBefore(
    sortedValues,
    end,
    getPointForValue,
    comparePoints
  );

  return sortedValues.slice(startIndex, endIndex + 1);
}
