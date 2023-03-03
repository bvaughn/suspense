export type ComparePoints<Point> = (a: Point, b: Point) => number;

export type Utilities<Point> = {
  compare(a: Point, b: Point): number;
  equals(a: Point, b: Point): boolean;
  greaterThan(a: Point, b: Point): boolean;
  greaterThanOrEqualTo(a: Point, b: Point): boolean;
  lessThan(a: Point, b: Point): boolean;
  lessThanOrEqualTo(a: Point, b: Point): boolean;
};
