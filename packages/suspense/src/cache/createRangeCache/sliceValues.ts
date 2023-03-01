import { ComparisonFunction, GetPoint } from "../../types";
import {
  findNearestIndexBefore,
  findNearestIndexAfter,
} from "./findNearestIndex";

export function sliceValues<Point, Value>(
  sortedValues: Value[],
  start: Point,
  end: Point,
  getPoint: GetPoint<Point, Value>,
  comparePoints: ComparisonFunction<Point>
): Value[] {
  if (sortedValues.length === 0) {
    return [];
  }

  const startIndex = findNearestIndexAfter(
    sortedValues,
    start,
    getPoint,
    comparePoints
  );

  const endIndex = findNearestIndexBefore(
    sortedValues,
    end,
    getPoint,
    comparePoints
  );

  return sortedValues.slice(startIndex, endIndex + 1);
}
