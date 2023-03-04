import { configure } from "point-utilities";
import { sliceValues } from "./sliceValues";

function getPointForValue(value: number) {
  return value;
}

function comparePoints(a: number, b: number): number {
  return a - b;
}

describe("sliceValues", () => {
  function test(sortedValues: number[], start: number, end: number): number[] {
    return sliceValues(
      sortedValues,
      start,
      end,
      getPointForValue,
      configure(comparePoints)
    );
  }

  it("should handle an empty array", () => {
    expect(test([], 0, 0)).toEqual([]);
  });

  it("should handle an exact match of the entire interval", () => {
    expect(test([1, 2, 3], 1, 3)).toEqual([1, 2, 3]);
  });

  it("should handle intervals that are before the sorted values", () => {
    expect(test([2, 3, 4], 0, 1)).toEqual([]);
  });

  it("should handle intervals that are after the sorted values", () => {
    expect(test([2, 3, 4], 5, 6)).toEqual([]);
  });

  it("should handle partially overlapping intervals", () => {
    expect(test([2, 3, 4], 0, 2)).toEqual([2]);
    expect(test([2, 3, 4], 0, 3)).toEqual([2, 3]);
    expect(test([2, 3, 4], 3, 6)).toEqual([3, 4]);
    expect(test([2, 3, 4], 4, 6)).toEqual([4]);
  });

  it("intervals that are proper subsets", () => {
    expect(test([1, 2, 3, 4, 5], 1, 2)).toEqual([1, 2]);
    expect(test([1, 2, 3, 4, 5], 2, 4)).toEqual([2, 3, 4]);
    expect(test([1, 2, 3, 4, 5], 4, 5)).toEqual([4, 5]);
  });
});
