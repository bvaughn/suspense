import { configure as configurePointUtilities } from "point-utilities";
import { ComparePoints, Interval, SeparatedInterval, Utilities } from "./types";

export function configure<Point>(
  comparePoints: ComparePoints<Point>
): Utilities<Point> {
  const pointUtils = configurePointUtilities(comparePoints);

  function compare(a: Interval<Point>, b: Interval<Point>): number {
    const start = pointUtils.compare(a[0], b[0]);
    const end = pointUtils.compare(a[1], b[1]);
    return start === 0 ? end : start;
  }

  function contains(a: Interval<Point>, b: Interval<Point>): boolean {
    return (
      pointUtils.lessThanOrEqualTo(a[0], b[0]) &&
      pointUtils.greaterThanOrEqualTo(a[1], b[1])
    );
  }

  function equals(a: Interval<Point>, b: Interval<Point>): boolean {
    return pointUtils.equals(a[0], b[0]) && pointUtils.equals(a[1], b[1]);
  }

  function greaterThan(a: Interval<Point>, b: Interval<Point>): boolean {
    if (pointUtils.greaterThan(a[0], b[0])) {
      return true;
    } else if (pointUtils.equals(a[0], b[0])) {
      return pointUtils.greaterThan(a[1], b[1]);
    } else {
      return false;
    }
  }

  function greaterThanOrEqualTo(
    a: Interval<Point>,
    b: Interval<Point>
  ): boolean {
    return !lessThan(a, b);
  }

  function intersects(a: Interval<Point>, b: Interval<Point>): boolean {
    return (
      pointUtils.greaterThanOrEqualTo(a[1], b[0]) &&
      pointUtils.greaterThanOrEqualTo(b[1], a[0])
    );
  }

  function lessThan(a: Interval<Point>, b: Interval<Point>): boolean {
    if (pointUtils.lessThan(a[0], b[0])) {
      return true;
    } else if (pointUtils.equals(a[0], b[0])) {
      return pointUtils.lessThan(a[1], b[1]);
    } else {
      return false;
    }
  }

  function lessThanOrEqualTo(a: Interval<Point>, b: Interval<Point>): boolean {
    return !greaterThan(a, b);
  }

  function merge(a: Interval<Point>, b: Interval<Point>): Interval<Point>[] {
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

  function mergeAll(...sortedIntervals: Interval<Point>[]): Interval<Point>[] {
    if (sortedIntervals.length === 0) {
      return [];
    } else if (sortedIntervals.length === 1) {
      return sortedIntervals;
    }

    const merged: Interval<Point>[] = [];

    let prevInterval: Interval<Point> = sortedIntervals[0];
    let currentInterval: Interval<Point> | null = null;

    for (let index = 1; index < sortedIntervals.length; index++) {
      currentInterval = sortedIntervals[index];

      const tempMerged = merge(prevInterval, currentInterval);
      prevInterval = tempMerged.pop()!;
      merged.push(...tempMerged);
    }

    merged.push(prevInterval);

    return merged;
  }

  function separate(
    a: Interval<Point>,
    b: Interval<Point>
  ): SeparatedInterval<Point> {
    const separated: SeparatedInterval<Point> = {
      a: [],
      ab: [],
      b: [],
    };

    if (equals(a, b)) {
      separated.ab.push(a);
    } else if (!intersects(a, b)) {
      separated.a.push(a);
      separated.b.push(b);
    } else {
      const [a0, a1] = a;
      const [b0, b1] = b;

      if (pointUtils.lessThan(a0, b0)) {
        separated.a.push([a0, b0]);
      } else if (pointUtils.greaterThan(a0, b0)) {
        separated.b.push([b0, a0]);
      }

      if (pointUtils.lessThan(a0, b0)) {
        separated.ab.push([b0, pointUtils.lessThan(a1, b1) ? a1 : b1]);
      } else {
        separated.ab.push([a0, pointUtils.lessThan(a1, b1) ? a1 : b1]);
      }

      if (pointUtils.lessThan(a1, b1)) {
        separated.b.push([a1, b1]);
      } else if (pointUtils.greaterThan(a1, b1)) {
        separated.a.push([b1, a1]);
      }
    }

    return separated;
  }

  function separateAll(
    a: Interval<Point>[],
    b: Interval<Point>[]
  ): SeparatedInterval<Point> {
    const separated: SeparatedInterval<Point> = {
      a: [],
      ab: [],
      b: [],
    };

    let currentA: Interval<Point> | null = a[0] ?? null;
    let currentB: Interval<Point> | null = b[0] ?? null;

    let indexA = 0;
    let indexB = 0;

    while (currentA !== null && currentB !== null) {
      const separatedLoop = separate(currentA, currentB);

      // It's always okay to push all overlapping intervals
      separated.ab.push(...separatedLoop.ab);

      // If the ends of the current interval align, we can push all excluded intervals
      // Else we should keep the last interval for whichever comes last
      // because it might overlap with the next interval in the other set
      if (pointUtils.equals(currentA[1], currentB[1])) {
        separated.b.push(...separatedLoop.b);
        separated.a.push(...separatedLoop.a);

        currentA = a[++indexA] ?? null;
        currentB = b[++indexB] ?? null;
      } else if (pointUtils.greaterThan(currentA[1], currentB[1])) {
        currentA = separatedLoop.a.pop()!;

        separated.b.push(...separatedLoop.b);
        separated.a.push(...separatedLoop.a);

        currentB = b[++indexB] ?? null;
      } else {
        currentB = separatedLoop.b.pop()!;

        separated.b.push(...separatedLoop.b);
        separated.a.push(...separatedLoop.a);

        currentA = a[++indexA] ?? null;
      }
    }

    while (currentA !== null) {
      separated.a.push(currentA);

      currentA = a[++indexA] ?? null;
    }

    while (currentB !== null) {
      separated.b.push(currentB);

      currentB = b[++indexB] ?? null;
    }

    return separated;
  }

  function sort(...intervals: Interval<Point>[]): Interval<Point>[] {
    return intervals.sort(compare);
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
    separate,
    separateAll,
    sort,
  };
}
