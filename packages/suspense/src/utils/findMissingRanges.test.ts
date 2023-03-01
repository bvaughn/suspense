import { findMissingRanges } from "./findMissingRanges";

function comparePoints(a: number, b: number): number {
  return a - b;
}

function getPoint(value: number) {
  return value;
}

function rangeIterator(
  start: number,
  end: number,
  callback: (current: number) => void
) {
  for (let current = start; current <= end; current++) {
    callback(current);
  }
}

describe("findMissingRanges", () => {
  function test(
    sortedValues: number[],
    start: number,
    end: number
  ): number[][] {
    return findMissingRanges(
      sortedValues,
      start,
      end,
      getPoint,
      rangeIterator,
      comparePoints
    );
  }

  it("should support empty values array", () => {
    expect(test([], 0, 5)).toEqual([[0, 5]]);
  });

  it("should support exact match", () => {
    expect(test([1], 1, 1)).toEqual([]);
    expect(test([0, 1, 2], 0, 2)).toEqual([]);
  });

  it("should support subset", () => {
    expect(test([0, 1, 5], 1, 4)).toEqual([[2, 4]]);
    expect(test([0, 1, 3, 5], 0, 3)).toEqual([[2, 2]]);
    expect(test([0, 1, 3, 5], 4, 5)).toEqual([[4, 4]]);
  });

  it("should support superset", () => {
    expect(test([2, 3], 1, 4)).toEqual([
      [1, 1],
      [4, 4],
    ]);
    expect(test([3, 4, 5], 0, 7)).toEqual([
      [0, 2],
      [6, 7],
    ]);
  });

  it("should support partial overlaps", () => {
    expect(test([3, 4, 5], 1, 4)).toEqual([[1, 2]]);
    expect(test([3, 4, 5], 3, 8)).toEqual([[6, 8]]);
  });

  it("should support ranges with multiple overlapping gaps", () => {
    expect(test([0, 4, 5], 3, 7)).toEqual([
      [3, 3],
      [6, 7],
    ]);
    expect(test([3, 4, 7, 9], 2, 8)).toEqual([
      [2, 2],
      [5, 6],
      [8, 8],
    ]);
    expect(test([0, 1, 2, 6, 9, 10], 1, 7)).toEqual([
      [3, 5],
      [7, 7],
    ]);
    expect(test([0, 2, 6, 8, 10], 1, 7)).toEqual([
      [1, 1],
      [3, 5],
      [7, 7],
    ]);
  });
});
