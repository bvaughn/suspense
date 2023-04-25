import { configure as configureIntervalUtilities } from "interval-utilities";

import {
  CachedIntervals,
  findIntervals,
  FoundIntervals,
} from "./findIntervals";

describe("findIntervals", () => {
  const comparePoints = (a: number, b: number) => a - b;
  const intervalUtilities = configureIntervalUtilities(comparePoints);

  function test(
    start: number,
    end: number,
    cached: Partial<CachedIntervals<number>>
  ): FoundIntervals<number> {
    const { failed = [], loaded = [], partial = [], pending = [] } = cached;
    return findIntervals(
      {
        failed,
        loaded,
        partial,
        pending,
      },
      [start, end],
      intervalUtilities
    );
  }

  it("should support initial case (no loaded or pending intervals)", () => {
    expect(test(0, 5, {})).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [[0, 5]],
      pending: [],
    });
  });

  it("should support exact matches", () => {
    expect(test(1, 1, { loaded: [[1, 1]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [],
      pending: [],
    });

    expect(test(0, 2, { pending: [[0, 2]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [],
      pending: [[0, 2]],
    });

    expect(test(0, 2, { failed: [[0, 2]] })).toEqual({
      containsFailedResults: true,
      containsPartialResults: false,
      missing: [[0, 2]],
      pending: [],
    });

    expect(test(0, 2, { partial: [[0, 2]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: true,
      missing: [],
      pending: [],
    });
  });

  it("should support subset", () => {
    expect(test(1, 4, { loaded: [[1, 5]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [],
      pending: [],
    });

    expect(test(1, 4, { pending: [[-5, 10]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [],
      pending: [[1, 4]],
    });

    expect(test(1, 4, { failed: [[-5, 10]] })).toEqual({
      containsFailedResults: true,
      containsPartialResults: false,
      missing: [[1, 4]],
      pending: [],
    });

    expect(test(1, 4, { partial: [[-5, 10]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [[1, 4]],
      pending: [],
    });
  });

  it("should support superset", () => {
    expect(test(1, 4, { loaded: [[2, 3]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [
        [1, 2],
        [3, 4],
      ],
      pending: [],
    });

    expect(test(-7, 0, { pending: [[-5, -3]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [
        [-7, -5],
        [-3, 0],
      ],
      pending: [[-5, -3]],
    });

    expect(test(-7, 0, { loaded: [[-7, -5]], pending: [[-5, -3]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [[-3, 0]],
      pending: [[-5, -3]],
    });

    expect(test(1, 4, { failed: [[2, 3]] })).toEqual({
      containsFailedResults: true,
      containsPartialResults: false,
      missing: [[1, 4]],
      pending: [],
    });

    expect(test(1, 5, { partial: [[2, 4]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: true,
      missing: [
        [1, 2],
        [4, 5],
      ],
      pending: [],
    });
  });

  it("should support partial overlaps", () => {
    expect(test(1, 4, { loaded: [[3, 5]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [[1, 3]],
      pending: [],
    });

    expect(test(3, 8, { loaded: [[3, 5]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [[5, 8]],
      pending: [],
    });

    expect(test(1, 3, { loaded: [[1, 2]], pending: [[2, 4]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [],
      pending: [[2, 3]],
    });

    expect(test(2, 5, { loaded: [[1, 3]], pending: [[3, 4]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [[4, 5]],
      pending: [[3, 4]],
    });

    expect(test(1, 4, { failed: [[3, 5]] })).toEqual({
      containsFailedResults: true,
      containsPartialResults: false,
      missing: [[1, 4]],
      pending: [],
    });

    expect(test(1, 4, { partial: [[3, 5]] })).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [[1, 4]],
      pending: [],
    });
  });

  it("should support intervals with multiple overlapping gaps", () => {
    expect(
      test(3, 7, {
        loaded: [
          [0, 0],
          [4, 5],
        ],
      })
    ).toEqual({
      containsFailedResults: false,
      containsPartialResults: false,
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
      containsFailedResults: false,
      containsPartialResults: false,
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
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [[2, 7]],
      pending: [],
    });
  });

  it("should merge missing intervals to avoid unnecessary loads", () => {
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
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [[1, 7]],
      pending: [],
    });
  });

  it("should merge missing intervals when there are overlapping missing and pending intervals", () => {
    // This case demonstrates awkward overlap
    //    missing: [1,2], [2,6], and [6,7]
    //    pending: [2,2]
    //
    // It looks silly when we are dealing with sequential numbers (e.g. 1, 2, 3)
    // but it's a side effect of supporting data types like BigInts
    //
    // In this case, the missing intervals should get merged and the (contained) pending interval should be removed
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
      containsFailedResults: false,
      containsPartialResults: false,
      missing: [[1, 7]],
      pending: [],
    });
  });

  describe("partial results", () => {
    it("should not be fetched if requested interval is the same", () => {
      expect(test(3, 8, { partial: [[3, 8]] })).toEqual({
        containsFailedResults: false,
        containsPartialResults: true,
        missing: [],
        pending: [],
      });
    });

    it("should not be fetched if requested interval is larger", () => {
      expect(test(1, 10, { partial: [[3, 8]] })).toEqual({
        containsFailedResults: false,
        containsPartialResults: true,
        missing: [
          [1, 3],
          [8, 10],
        ],
        pending: [],
      });
    });

    it("should be fetched if requested interval is smaller", () => {
      expect(test(4, 6, { partial: [[1, 8]] })).toEqual({
        containsFailedResults: false,
        containsPartialResults: false,
        missing: [[4, 6]],
        pending: [],
      });

      expect(test(1, 3, { partial: [[1, 8]] })).toEqual({
        containsFailedResults: false,
        containsPartialResults: false,
        missing: [[1, 3]],
        pending: [],
      });

      expect(test(8, 8, { partial: [[1, 8]] })).toEqual({
        containsFailedResults: false,
        containsPartialResults: false,
        missing: [[8, 8]],
        pending: [],
      });
    });

    it("should be fetched if requested interval intersects", () => {
      expect(test(1, 6, { partial: [[4, 10]] })).toEqual({
        containsFailedResults: false,
        containsPartialResults: false,
        missing: [[1, 6]],
        pending: [],
      });

      expect(test(6, 8, { partial: [[4, 6]] })).toEqual({
        containsFailedResults: false,
        containsPartialResults: false,
        missing: [[6, 8]],
        pending: [],
      });

      expect(test(5, 8, { partial: [[1, 6]] })).toEqual({
        containsFailedResults: false,
        containsPartialResults: false,
        missing: [[5, 8]],
        pending: [],
      });
    });
  });
});
