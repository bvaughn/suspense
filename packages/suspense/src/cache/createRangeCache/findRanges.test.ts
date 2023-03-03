import { createPointUtils } from "./createPointUtils";
import { createRangeUtils } from "./createRangeUtils";
import { CachedRanges, findRanges, FoundRanges } from "./findRanges";

describe("findRanges", () => {
  const comparePoints = (a: number, b: number) => a - b;
  const pointUtils = createPointUtils(comparePoints);
  const rangeUtils = createRangeUtils(pointUtils);

  function test(
    start: number,
    end: number,
    cached: Partial<CachedRanges<number>>
  ): FoundRanges<number> {
    const { loaded = [], pending = [] } = cached;
    return findRanges(
      {
        loaded,
        pending,
      },
      [start, end],
      rangeUtils
    );
  }

  it("should support initial case (no loaded or pending ranges)", () => {
    expect(test(0, 5, {})).toEqual({
      missing: [[0, 5]],
      pending: [],
    });
  });

  it("should support exact matches", () => {
    expect(test(1, 1, { loaded: [[1, 1]] })).toEqual({
      missing: [],
      pending: [],
    });

    expect(test(0, 2, { pending: [[0, 2]] })).toEqual({
      missing: [],
      pending: [[0, 2]],
    });
  });

  it("should support subset", () => {
    expect(test(1, 4, { loaded: [[1, 5]] })).toEqual({
      missing: [],
      pending: [],
    });

    expect(test(1, 4, { pending: [[-5, 10]] })).toEqual({
      missing: [],
      pending: [[1, 4]],
    });
  });

  it("should support superset", () => {
    expect(test(1, 4, { loaded: [[2, 3]] })).toEqual({
      missing: [
        [1, 2],
        [3, 4],
      ],
      pending: [],
    });

    expect(test(-7, 0, { pending: [[-5, -3]] })).toEqual({
      missing: [
        [-7, -5],
        [-3, 0],
      ],
      pending: [[-5, -3]],
    });

    expect(test(-7, 0, { loaded: [[-7, -5]], pending: [[-5, -3]] })).toEqual({
      missing: [[-3, 0]],
      pending: [[-5, -3]],
    });
  });

  it("should support partial overlaps", () => {
    expect(test(1, 4, { loaded: [[3, 5]] })).toEqual({
      missing: [[1, 3]],
      pending: [],
    });

    expect(test(3, 8, { loaded: [[3, 5]] })).toEqual({
      missing: [[5, 8]],
      pending: [],
    });

    expect(test(1, 3, { loaded: [[1, 2]], pending: [[2, 4]] })).toEqual({
      missing: [],
      pending: [[2, 3]],
    });

    expect(test(2, 5, { loaded: [[1, 3]], pending: [[3, 4]] })).toEqual({
      missing: [[4, 5]],
      pending: [[3, 4]],
    });
  });

  it("should support ranges with multiple overlapping gaps", () => {
    expect(
      test(3, 7, {
        loaded: [
          [0, 0],
          [4, 5],
        ],
      })
    ).toEqual({
      missing: [
        [3, 4],
        [5, 7],
      ],
      pending: [],
    });

    expect(
      test(2, 8, {
        loaded: [
          [3, 4],
          [7, 9],
        ],
      })
    ).toEqual({
      missing: [
        [2, 3],
        [4, 7],
      ],
      pending: [],
    });

    expect(
      test(1, 7, {
        loaded: [
          [0, 2],
          [6, 6],
          [9, 10],
        ],
      })
    ).toEqual({
      missing: [[2, 7]],
      pending: [],
    });
  });

  it("should merge missing ranges to avoid unnecessary loads", () => {
    expect(
      test(1, 7, {
        loaded: [
          [0, 0],
          [2, 2],
          [6, 6],
          [8, 8],
          [10, 10],
        ],
      })
    ).toEqual({
      missing: [[1, 7]],
      pending: [],
    });
  });

  it("should merge missing ranges when there are overlapping missing and pending ranges", () => {
    // This case demonstrates awkward overlap
    //    missing: [1,2], [2,6], and [6,7]
    //    pending: [2,2]
    //
    // It looks silly when we are dealing with sequential numbers (e.g. 1, 2, 3)
    // but it's a side effect of supporting data types like BigInts
    //
    // In this case, the missing ranges should get merged and the (contained) pending range should be removed
    expect(
      test(1, 7, {
        loaded: [
          [0, 0],
          [6, 6],
          [10, 10],
        ],
        pending: [
          [2, 2],
          [8, 8],
        ],
      })
    ).toEqual({
      missing: [[1, 7]],
      pending: [],
    });
  });
});
