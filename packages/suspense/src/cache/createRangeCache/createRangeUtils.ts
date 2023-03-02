import { PointUtils, RangeTuple, RangeUtils } from "../../types";

export function createRangeUtils<Point>(
  pointUtils: PointUtils<Point>
): RangeUtils<Point> {
  function compare(a: RangeTuple<Point>, b: RangeTuple<Point>): number {
    const start = pointUtils.compare(a[0], b[0]);
    const end = pointUtils.compare(a[1], b[1]);
    return start === 0 ? end : start;
  }

  function contains(a: RangeTuple<Point>, b: RangeTuple<Point>): boolean {
    return (
      pointUtils.lessThanOrEqualTo(a[0], b[0]) &&
      pointUtils.greaterThanOrEqualTo(a[1], b[1])
    );
  }

  function equals(a: RangeTuple<Point>, b: RangeTuple<Point>): boolean {
    return pointUtils.equals(a[0], b[0]) && pointUtils.equals(a[1], b[1]);
  }

  function greaterThan(a: RangeTuple<Point>, b: RangeTuple<Point>): boolean {
    if (pointUtils.greaterThan(a[0], b[0])) {
      return true;
    } else if (pointUtils.equals(a[0], b[0])) {
      return pointUtils.greaterThan(a[1], b[1]);
    } else {
      return false;
    }
  }

  function greaterThanOrEqualTo(
    a: RangeTuple<Point>,
    b: RangeTuple<Point>
  ): boolean {
    return !lessThan(a, b);
  }

  function intersects(a: RangeTuple<Point>, b: RangeTuple<Point>): boolean {
    return (
      pointUtils.greaterThanOrEqualTo(a[1], b[0]) &&
      pointUtils.greaterThanOrEqualTo(b[1], a[0])
    );
  }

  function lessThan(a: RangeTuple<Point>, b: RangeTuple<Point>): boolean {
    if (pointUtils.lessThan(a[0], b[0])) {
      return true;
    } else if (pointUtils.equals(a[0], b[0])) {
      return pointUtils.lessThan(a[1], b[1]);
    } else {
      return false;
    }
  }

  function lessThanOrEqualTo(
    a: RangeTuple<Point>,
    b: RangeTuple<Point>
  ): boolean {
    return !greaterThan(a, b);
  }

  function merge(
    a: RangeTuple<Point>,
    b: RangeTuple<Point>
  ): RangeTuple<Point>[] {
    if (contains(a, b)) {
      return [a];
    } else if (contains(b, a)) {
      return [b];
    } else if (!intersects(a, b)) {
      return pointUtils.lessThan(a[0], b[0]) ? [a, b] : [b, a];
    } else {
      if (pointUtils.lessThan(a[0], b[0])) {
        return [[a[0], b[1]]];
      } else {
        return [[b[0], a[1]]];
      }
    }
  }

  function mergeAll(...sortedRanges: RangeTuple<Point>[]): RangeTuple<Point>[] {
    if (sortedRanges.length === 0) {
      return [];
    } else if (sortedRanges.length === 1) {
      return sortedRanges;
    }

    const merged: RangeTuple<Point>[] = [];

    let prevRange: RangeTuple<Point> = sortedRanges[0];
    let currentRange: RangeTuple<Point> | null = null;

    for (let index = 1; index < sortedRanges.length; index++) {
      currentRange = sortedRanges[index];
      //console.log(`${index}: %s, %s`, prevRange, currentRange);

      const tempMerged = merge(prevRange, currentRange);
      //console.log(`  ->`, ...tempMerged);
      prevRange = tempMerged.pop();
      merged.push(...tempMerged);
      //console.log(`  -> ->`, merged.length);
    }

    //console.log(prevRange);
    merged.push(prevRange);

    return merged;
  }

  function sort(...ranges: RangeTuple<Point>[]): RangeTuple<Point>[] {
    return ranges.sort(compare);
  }

  function subtract(
    a: RangeTuple<Point>,
    b: RangeTuple<Point>
  ): RangeTuple<Point>[] {
    if (equals(a, b) || contains(a, b)) {
      return [];
    } else if (!intersects(a, b)) {
      return [b];
    } else {
      const tuples: RangeTuple<Point>[] = [];
      if (pointUtils.lessThan(b[0], a[0])) {
        tuples.push([b[0], a[0]]);
      }
      if (pointUtils.lessThan(a[1], b[1])) {
        tuples.push([a[1], b[1]]);
      }
      return tuples;
    }
  }

  return {
    compare,
    contains,
    equals,
    greaterThan,
    greaterThanOrEqualTo,
    intersects,
    lessThan,
    lessThanOrEqualTo,
    merge,
    mergeAll,
    sort,
    subtract,
  };
}
