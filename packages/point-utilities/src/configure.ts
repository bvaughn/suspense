import { ComparePoints, Utilities } from "./types";

export function configure<Point>(
  comparePoints: ComparePoints<Point>
): Utilities<Point> {
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
    greaterThan,
    greaterThanOrEqualTo,
    lessThan,
    lessThanOrEqualTo,
  };
}
