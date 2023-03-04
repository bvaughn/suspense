import { Utilities } from "point-utilities";

import { GetPointForValue } from "../../types";

export function sliceValues<Point, Value>(
  sortedValues: Value[],
  start: Point,
  end: Point,
  getPointForValue: GetPointForValue<Point, Value>,
  pointUtils: Utilities<Point>
): Value[] {
  if (sortedValues.length === 0) {
    return [];
  }

  const sortedPoints = sortedValues.map(getPointForValue);
  const startIndex = pointUtils.findNearestIndexAfter(sortedPoints, start);
  const endIndex = pointUtils.findNearestIndexBefore(sortedPoints, end);

  return sortedValues.slice(startIndex, endIndex + 1);
}
