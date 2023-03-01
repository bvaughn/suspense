import { GetPoint } from "./createRangeCache";
import { ComparisonFunction } from "../../types";

export function findNearestIndex<Point, Value>(
  sortedValues: Value[],
  targetPoint: Point,
  getPoint: GetPoint<Point, Value>,
  comparisonFunction: ComparisonFunction<Point>
): number {
  let lowIndex = 0;
  let highIndex = sortedValues.length - 1;
  let middleIndex = -1;

  while (lowIndex <= highIndex) {
    middleIndex = (lowIndex + highIndex) >>> 1;

    const currentValue = sortedValues[middleIndex];
    const currentPoint = getPoint(currentValue);
    const value = comparisonFunction(targetPoint, currentPoint);
    if (value === 0) {
      return middleIndex;
    } else if (value > 0) {
      lowIndex = middleIndex + 1;
    } else {
      highIndex = middleIndex - 1;
    }
  }

  switch (sortedValues.length) {
    case 0:
      return -1;
    case 1:
      return 0;
  }

  const middlePoint = getPoint(sortedValues[middleIndex]);
  const value = comparisonFunction(targetPoint, middlePoint);
  if (value === 0) {
    return middleIndex;
  } else {
    let lowIndex = middleIndex;
    let highIndex = middleIndex;

    if (value > 0) {
      highIndex = Math.min(middleIndex + 1, sortedValues.length - 1);
    } else {
      lowIndex = Math.max(0, middleIndex - 1);
    }

    const lowPoint = getPoint(sortedValues[lowIndex]);
    const highPoint = getPoint(sortedValues[highIndex]);

    return Math.abs(comparisonFunction(targetPoint, lowPoint)) <
      Math.abs(comparisonFunction(targetPoint, highPoint))
      ? lowIndex
      : highIndex;
  }
}

export function findNearestIndexBefore<Point, Value>(
  sortedValues: Value[],
  targetPoint: Point,
  getPoint: GetPoint<Point, Value>,
  comparisonFunction: ComparisonFunction<Point>
): number {
  const index = findNearestIndex(
    sortedValues,
    targetPoint,
    getPoint,
    comparisonFunction
  );

  const point = getPoint(sortedValues[index]);
  const comparison = comparisonFunction(point, targetPoint);

  return comparison > 0 ? index - 1 : index;
}

export function findNearestIndexAfter<Point, Value>(
  sortedValues: Value[],
  targetPoint: Point,
  getPoint: GetPoint<Point, Value>,
  comparisonFunction: ComparisonFunction<Point>
): number {
  const index = findNearestIndex(
    sortedValues,
    targetPoint,
    getPoint,
    comparisonFunction
  );

  const point = getPoint(sortedValues[index]);
  const comparison = comparisonFunction(point, targetPoint);

  return comparison < 0 ? index + 1 : index;
}
