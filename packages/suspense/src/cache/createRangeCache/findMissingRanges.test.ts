import { RangeTuple } from "../../types";
import { createPointUtils } from "./createPointUtils";
import { createRangeUtils } from "./createRangeUtils";
import { findMissingRanges } from "./findMissingRanges";

describe("findMissingRanges", () => {
  function test(
    loadedRanges: RangeTuple<number>[],
    start: number,
    end: number
  ): number[][] {
    const comparePoints = (a: number, b: number) => a - b;
    const pointUtils = createPointUtils(comparePoints);
    const rangeUtils = createRangeUtils(pointUtils);

    return findMissingRanges(
      loadedRanges,
      [start, end],
      rangeUtils,
      pointUtils
    );
  }

  it("should support empty values array", () => {
    expect(test([], 0, 5)).toEqual([[0, 5]]);
  });

  it("should support exact match", () => {
    expect(test([[1, 1]], 1, 1)).toEqual([]);
    expect(test([[0, 2]], 0, 2)).toEqual([]);
  });

  it("should support subset", () => {
    expect(test([[1, 5]], 1, 4)).toEqual([]);
    expect(test([[1, 5]], 1, 3)).toEqual([]);
    expect(test([[1, 5]], 4, 5)).toEqual([]);
  });

  it("should support superset", () => {
    expect(test([[2, 3]], 1, 4)).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(test([[-5, -3]], -7, 0)).toEqual([
      [-7, -5],
      [-3, 0],
    ]);
  });

  it("should support partial overlaps", () => {
    expect(test([[3, 5]], 1, 4)).toEqual([[1, 3]]);
    expect(test([[3, 5]], 3, 8)).toEqual([[5, 8]]);
  });

  it("should support ranges with multiple overlapping gaps", () => {
    expect(
      test(
        [
          [0, 0],
          [4, 5],
        ],
        3,
        7
      )
    ).toEqual([
      [3, 4],
      [5, 7],
    ]);

    expect(
      test(
        [
          [3, 4],
          [7, 9],
        ],
        2,
        8
      )
    ).toEqual([
      [2, 3],
      [4, 7],
    ]);

    expect(
      test(
        [
          [0, 2],
          [6, 6],
          [9, 10],
        ],
        1,
        7
      )
    ).toEqual([
      [2, 6],
      [6, 7],
    ]);

    expect(
      test(
        [
          [0, 0],
          [2, 2],
          [6, 6],
          [8, 8],
          [10, 10],
        ],
        1,
        7
      )
    ).toEqual([
      [1, 2],
      [2, 6],
      [6, 7],
    ]);
  });
});
