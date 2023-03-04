import type { ComparePoints as ExternalComparePoints } from "point-utilities";

export type ComparePoints<Point> = ExternalComparePoints<Point>;

export type Interval<Point> = [start: Point, end: Point];

export type SeparatedInterval<Point> = {
  a: Interval<Point>[];
  ab: Interval<Point>[];
  b: Interval<Point>[];
};

export type Utilities<Point> = {
  compare(a: Interval<Point>, b: Interval<Point>): number;
  contains(a: Interval<Point>, b: Interval<Point>): boolean;
  equals(a: Interval<Point>, b: Interval<Point>): boolean;
  greaterThan(a: Interval<Point>, b: Interval<Point>): boolean;
  greaterThanOrEqualTo(a: Interval<Point>, b: Interval<Point>): boolean;
  intersects(a: Interval<Point>, b: Interval<Point>): boolean;
  lessThan(a: Interval<Point>, b: Interval<Point>): boolean;
  lessThanOrEqualTo(a: Interval<Point>, b: Interval<Point>): boolean;
  merge(a: Interval<Point>, b: Interval<Point>): Interval<Point>[];
  mergeAll(...intervals: Interval<Point>[]): Interval<Point>[];
  separate(a: Interval<Point>, b: Interval<Point>): SeparatedInterval<Point>;
  separateAll(
    a: Interval<Point>[],
    b: Interval<Point>[]
  ): SeparatedInterval<Point>;
  sort(...intervals: Interval<Point>[]): Interval<Point>[];
};
