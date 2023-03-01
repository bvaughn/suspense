import { ComparisonFunction, GetPointForValue } from "../../types";

export function findNearestIndex<Point, Value>(
  sortedValues: Value[],
  targetPointForValue: Point,
  getPointForValue: GetPointForValue<Point, Value>,
  comparisonFunction: ComparisonFunction<Point>
): number {
  let lowIndex = 0;
  let highIndex = sortedValues.length - 1;
  let middleIndex = -1;

  while (lowIndex <= highIndex) {
    middleIndex = (lowIndex + highIndex) >>> 1;

    const currentValue = sortedValues[middleIndex];
    const currentPoint = getPointForValue(currentValue);
    const value = comparisonFunction(targetPointForValue, currentPoint);
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

  const middlePoint = getPointForValue(sortedValues[middleIndex]);
  const value = comparisonFunction(targetPointForValue, middlePoint);
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

    const lowPoint = getPointForValue(sortedValues[lowIndex]);
    const highPoint = getPointForValue(sortedValues[highIndex]);

    return Math.abs(comparisonFunction(targetPointForValue, lowPoint)) <
      Math.abs(comparisonFunction(targetPointForValue, highPoint))
      ? lowIndex
      : highIndex;
  }
}

export function findNearestIndexBefore<Point, Value>(
  sortedValues: Value[],
  targetPointForValue: Point,
  getPointForValue: GetPointForValue<Point, Value>,
  comparisonFunction: ComparisonFunction<Point>
): number {
  const index = findNearestIndex(
    sortedValues,
    targetPointForValue,
    getPointForValue,
    comparisonFunction
  );

  const point = getPointForValue(sortedValues[index]);
  const comparison = comparisonFunction(point, targetPointForValue);

  return comparison > 0 ? index - 1 : index;
}

export function findNearestIndexAfter<Point, Value>(
  sortedValues: Value[],
  targetPointForValue: Point,
  getPointForValue: GetPointForValue<Point, Value>,
  comparisonFunction: ComparisonFunction<Point>
): number {
  const index = findNearestIndex(
    sortedValues,
    targetPointForValue,
    getPointForValue,
    comparisonFunction
  );

  const point = getPointForValue(sortedValues[index]);
  const comparison = comparisonFunction(point, targetPointForValue);

  return comparison < 0 ? index + 1 : index;
}
