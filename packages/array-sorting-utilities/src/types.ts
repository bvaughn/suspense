export type CompareValues<Point> = (a: Point, b: Point) => number;

export type Utilities<Value> = {
  find(sortedItems: Value[], targetItem: Value): Value | null;
  findIndex(
    sortedItems: Value[],
    targetItem: Value,
    exactMatch?: boolean
  ): number;
  findInsertIndex(sortedItems: Value[], item: Value): number;
  insert(sortedItems: Value[], item: Value): Value[];
};
