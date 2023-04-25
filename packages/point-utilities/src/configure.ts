import { ComparePoints, Utilities } from "./types";

export function configure<Point>(
  comparePoints: ComparePoints<Point>
): Utilities<Point> {
  function binarySearch(
    sortedPoints: Point[],
    targetPoint: Point,
    exactMatch: boolean
  ): number {
    if (sortedPoints.length === 0) {
      return -1;
    }

    let lowIndex = 0;
    let highIndex = sortedPoints.length - 1;
    let middleIndex = -1;

    while (lowIndex <= highIndex) {
      middleIndex = (lowIndex + highIndex) >>> 1;

      const currentPoint = sortedPoints[middleIndex]!;
      const value = comparePoints(targetPoint, currentPoint);
      if (value === 0) {
        return middleIndex;
      } else if (value > 0) {
        lowIndex = middleIndex + 1;
      } else {
        highIndex = middleIndex - 1;
      }
    }

    if (exactMatch) {
      return -1;
    }

    const middlePoint = sortedPoints[middleIndex]!;
    const value = comparePoints(targetPoint, middlePoint);
    if (value === 0) {
      return middleIndex;
    } else {
      let lowIndex = middleIndex;
      let highIndex = middleIndex;

      if (value > 0) {
        highIndex = Math.min(middleIndex + 1, sortedPoints.length - 1);
      } else {
        lowIndex = Math.max(0, middleIndex - 1);
      }

      const lowPoint = sortedPoints[lowIndex]!;
      const highPoint = sortedPoints[highIndex]!;

      return Math.abs(comparePoints(targetPoint, lowPoint)) <
        Math.abs(comparePoints(targetPoint, highPoint))
        ? lowIndex
        : highIndex;
    }
  }

  function compare(a: Point, b: Point): number {
    const result = comparePoints(a, b);
    if (result === 0) {
      return 0;
    } else {
      return result < 0 ? -1 : 1;
    }
  }

  function equals(a: Point, b: Point): boolean {
    return comparePoints(a, b) === 0;
  }

  function findIndex(sortedPoints: Point[], point: Point): number {
    return binarySearch(sortedPoints, point, true);
  }

  function findNearestIndex(sortedPoints: Point[], point: Point): number {
    return binarySearch(sortedPoints, point, false);
  }

  function findNearestIndexAfter(
    sortedPoints: Point[],
    targetPoint: Point
  ): number {
    if (sortedPoints.length === 0) {
      return -1;
    }

    const index = binarySearch(sortedPoints, targetPoint, false);

    const foundPoint = sortedPoints[index]!;
    const comparison = comparePoints(foundPoint, targetPoint);

    return comparison < 0 ? index + 1 : index;
  }

  function findNearestIndexBefore(
    sortedPoints: Point[],
    targetPoint: Point
  ): number {
    if (sortedPoints.length === 0) {
      return -1;
    }

    const index = binarySearch(sortedPoints, targetPoint, false);

    const foundPoint = sortedPoints[index]!;
    const comparison = comparePoints(foundPoint, targetPoint);

    return comparison > 0 ? index - 1 : index;
  }

  function greaterThan(a: Point, b: Point): boolean {
    return comparePoints(a, b) > 0;
  }

  function greaterThanOrEqualTo(a: Point, b: Point): boolean {
    return comparePoints(a, b) >= 0;
  }

  function lessThan(a: Point, b: Point): boolean {
    return comparePoints(a, b) < 0;
  }

  function lessThanOrEqualTo(a: Point, b: Point): boolean {
    return comparePoints(a, b) <= 0;
  }

  return {
    compare,
    equals,
    findIndex,
    findNearestIndex,
    findNearestIndexAfter,
    findNearestIndexBefore,
    greaterThan,
    greaterThanOrEqualTo,
    lessThan,
    lessThanOrEqualTo,
  };
}
