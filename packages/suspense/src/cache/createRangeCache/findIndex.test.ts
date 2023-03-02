import {
  findNearestIndex,
  findNearestIndexBefore,
  findNearestIndexAfter,
  findIndex,
} from "./findIndex";

function getPointForValue(value: number) {
  return value;
}

function comparePoints(a: number, b: number): number {
  return a - b;
}

describe("findIndex", () => {
  function test(sortedValues: number[], targetValue: number): number {
    return findIndex(
      sortedValues,
      targetValue,
      getPointForValue,
      comparePoints
    );
  }

  it("should handle an empty array", () => {
    expect(test([], 0)).toBe(-1);
  });

  it("should handle an array with only one element", () => {
    expect(test([1], 0)).toBe(-1);
    expect(test([1], 1)).toBe(0);
    expect(test([1], 2)).toBe(-1);
  });

  it("should handle exact matches", () => {
    expect(test([1], 1)).toBe(0);
    expect(test([1, 2], 2)).toBe(1);
    expect(test([1, 2, 3], 1)).toBe(0);
    expect(test([1, 2, 3], 2)).toBe(1);
    expect(test([1, 2, 3], 3)).toBe(2);
  });

  it("should handle non-exact matches", () => {
    expect(test([10, 20, 30], 1)).toBe(-1);
    expect(test([10, 20, 30], 12)).toBe(-1);
    expect(test([10, 20, 30], 18)).toBe(-1);
    expect(test([10, 20, 30], 26)).toBe(-1);
    expect(test([10, 20, 30], 40)).toBe(-1);
  });
});

describe("findNearestIndex", () => {
  function test(sortedValues: number[], targetValue: number): number {
    return findNearestIndex(
      sortedValues,
      targetValue,
      getPointForValue,
      comparePoints
    );
  }

  it("should handle an empty array", () => {
    expect(test([], 0)).toBe(-1);
  });

  it("should handle an array with only one element", () => {
    expect(test([1], 0)).toBe(0);
    expect(test([1], 1)).toBe(0);
    expect(test([1], 2)).toBe(0);
  });

  it("should handle exact matches", () => {
    expect(test([1], 1)).toBe(0);
    expect(test([1, 2], 2)).toBe(1);
    expect(test([1, 2, 3], 1)).toBe(0);
    expect(test([1, 2, 3], 2)).toBe(1);
    expect(test([1, 2, 3], 3)).toBe(2);
  });

  it("should handle non-exact matches", () => {
    expect(test([10, 20, 30], 1)).toBe(0);
    expect(test([10, 20, 30], 12)).toBe(0);
    expect(test([10, 20, 30], 18)).toBe(1);
    expect(test([10, 20, 30], 26)).toBe(2);
    expect(test([10, 20, 30], 40)).toBe(2);
  });
});

describe("findNearestIndexBefore", () => {
  function test(sortedValues: number[], targetValue: number): number {
    return findNearestIndexBefore(
      sortedValues,
      targetValue,
      getPointForValue,
      comparePoints
    );
  }

  it("should handle an empty array", () => {
    expect(test([], 0)).toBe(-1);
  });

  it("should handle an array with only one element", () => {
    expect(test([1], 0)).toBe(-1);
    expect(test([1], 1)).toBe(0);
    expect(test([1], 2)).toBe(0);
  });

  it("should handle exact matches", () => {
    expect(test([1], 1)).toBe(0);
    expect(test([1, 2], 2)).toBe(1);
    expect(test([1, 2, 3], 1)).toBe(0);
    expect(test([1, 2, 3], 2)).toBe(1);
    expect(test([1, 2, 3], 3)).toBe(2);
  });

  it("should handle non-exact matches", () => {
    expect(test([10, 20, 30], 1)).toBe(-1);
    expect(test([10, 20, 30], 9)).toBe(-1);

    expect(test([10, 20, 30], 11)).toBe(0);
    expect(test([10, 20, 30], 19)).toBe(0);

    expect(test([10, 20, 30], 21)).toBe(1);
    expect(test([10, 20, 30], 29)).toBe(1);

    expect(test([10, 20, 30], 31)).toBe(2);
  });

  it("should handle a target less than the array", () => {
    expect(test([10, 20, 30], 5)).toBe(-1);
  });
});

describe("findNearestIndexAfter", () => {
  function test(sortedValues: number[], targetValue: number): number {
    return findNearestIndexAfter(
      sortedValues,
      targetValue,
      getPointForValue,
      comparePoints
    );
  }

  it("should handle an empty array", () => {
    expect(test([], 0)).toBe(-1);
  });

  it("should handle an array with only one element", () => {
    expect(test([1], 0)).toBe(0);
    expect(test([1], 1)).toBe(0);
    expect(test([1], 2)).toBe(1);
  });

  it("should handle exact matches", () => {
    expect(test([1], 1)).toBe(0);
    expect(test([1, 2], 2)).toBe(1);
    expect(test([1, 2, 3], 1)).toBe(0);
    expect(test([1, 2, 3], 2)).toBe(1);
    expect(test([1, 2, 3], 3)).toBe(2);
  });

  it("should handle non-exact matches", () => {
    expect(test([10, 20, 30], 1)).toBe(0);
    expect(test([10, 20, 30], 9)).toBe(0);

    expect(test([10, 20, 30], 11)).toBe(1);
    expect(test([10, 20, 30], 19)).toBe(1);

    expect(test([10, 20, 30], 21)).toBe(2);
    expect(test([10, 20, 30], 29)).toBe(2);

    expect(test([10, 20, 30], 31)).toBe(3);
  });
});
