import { beforeEach, describe, expect, it } from "vitest";
import { configure } from "./configure";
import { Utilities } from "./types";

describe("point-utilities", () => {
  let utilities: Utilities<number>;

  beforeEach(() => {
    utilities = configure<number>((a: number, b: number) => a - b);
  });

  describe("compare", () => {
    it("should work", () => {
      const { compare } = utilities;
      expect(compare(10, 10)).toBe(0);
      expect(compare(10, 0)).toBe(1);
      expect(compare(0, 10)).toBe(-1);
      expect(compare(-10, -10)).toBe(0);
      expect(compare(-10, 10)).toBe(-1);
      expect(compare(10, -10)).toBe(1);
    });
  });

  describe("equals", () => {
    it("should work", () => {
      const { equals } = utilities;
      expect(equals(-1, -1)).toBe(true);
      expect(equals(0, 0)).toBe(true);
      expect(equals(1, 1)).toBe(true);
      expect(equals(-1, 0)).toBe(false);
      expect(equals(0, -1)).toBe(false);
      expect(equals(1, -1)).toBe(false);
    });
  });

  describe("findIndex", () => {
    it("should handle an empty array", () => {
      const { findIndex } = utilities;
      expect(findIndex([], 0)).toBe(-1);
    });

    it("should handle an array with only one element", () => {
      const { findIndex } = utilities;
      expect(findIndex([1], 0)).toBe(-1);
      expect(findIndex([1], 1)).toBe(0);
      expect(findIndex([1], 2)).toBe(-1);
    });

    it("should handle exact matches", () => {
      const { findIndex } = utilities;
      expect(findIndex([1], 1)).toBe(0);
      expect(findIndex([1, 2], 2)).toBe(1);
      expect(findIndex([1, 2, 3], 1)).toBe(0);
      expect(findIndex([1, 2, 3], 2)).toBe(1);
      expect(findIndex([1, 2, 3], 3)).toBe(2);
    });

    it("should handle non-exact matches", () => {
      const { findIndex } = utilities;
      expect(findIndex([10, 20, 30], 1)).toBe(-1);
      expect(findIndex([10, 20, 30], 12)).toBe(-1);
      expect(findIndex([10, 20, 30], 18)).toBe(-1);
      expect(findIndex([10, 20, 30], 26)).toBe(-1);
      expect(findIndex([10, 20, 30], 40)).toBe(-1);
    });
  });

  describe("findNearestIndex", () => {
    it("should handle an empty array", () => {
      const { findNearestIndex } = utilities;
      expect(findNearestIndex([], 0)).toBe(-1);
    });

    it("should handle an array with only one element", () => {
      const { findNearestIndex } = utilities;
      expect(findNearestIndex([1], 0)).toBe(0);
      expect(findNearestIndex([1], 1)).toBe(0);
      expect(findNearestIndex([1], 2)).toBe(0);
    });

    it("should handle exact matches", () => {
      const { findNearestIndex } = utilities;
      expect(findNearestIndex([1], 1)).toBe(0);
      expect(findNearestIndex([1, 2], 2)).toBe(1);
      expect(findNearestIndex([1, 2, 3], 1)).toBe(0);
      expect(findNearestIndex([1, 2, 3], 2)).toBe(1);
      expect(findNearestIndex([1, 2, 3], 3)).toBe(2);
    });

    it("should handle non-exact matches", () => {
      const { findNearestIndex } = utilities;
      expect(findNearestIndex([10, 20, 30], 1)).toBe(0);
      expect(findNearestIndex([10, 20, 30], 12)).toBe(0);
      expect(findNearestIndex([10, 20, 30], 18)).toBe(1);
      expect(findNearestIndex([10, 20, 30], 26)).toBe(2);
      expect(findNearestIndex([10, 20, 30], 40)).toBe(2);
    });
  });

  describe("findNearestIndexAfter", () => {
    it("should handle an empty array", () => {
      const { findNearestIndexAfter } = utilities;
      expect(findNearestIndexAfter([], 0)).toBe(-1);
    });

    it("should handle an array with only one element", () => {
      const { findNearestIndexAfter } = utilities;
      expect(findNearestIndexAfter([1], 0)).toBe(0);
      expect(findNearestIndexAfter([1], 1)).toBe(0);
      expect(findNearestIndexAfter([1], 2)).toBe(1);
    });

    it("should handle exact matches", () => {
      const { findNearestIndexAfter } = utilities;
      expect(findNearestIndexAfter([1], 1)).toBe(0);
      expect(findNearestIndexAfter([1, 2], 2)).toBe(1);
      expect(findNearestIndexAfter([1, 2, 3], 1)).toBe(0);
      expect(findNearestIndexAfter([1, 2, 3], 2)).toBe(1);
      expect(findNearestIndexAfter([1, 2, 3], 3)).toBe(2);
    });

    it("should handle non-exact matches", () => {
      const { findNearestIndexAfter } = utilities;
      expect(findNearestIndexAfter([10, 20, 30], 1)).toBe(0);
      expect(findNearestIndexAfter([10, 20, 30], 9)).toBe(0);

      expect(findNearestIndexAfter([10, 20, 30], 11)).toBe(1);
      expect(findNearestIndexAfter([10, 20, 30], 19)).toBe(1);

      expect(findNearestIndexAfter([10, 20, 30], 21)).toBe(2);
      expect(findNearestIndexAfter([10, 20, 30], 29)).toBe(2);

      expect(findNearestIndexAfter([10, 20, 30], 31)).toBe(3);
    });
  });

  describe("findNearestIndexBefore", () => {
    it("should handle an empty array", () => {
      const { findNearestIndexBefore } = utilities;
      expect(findNearestIndexBefore([], 0)).toBe(-1);
    });

    it("should handle an array with only one element", () => {
      const { findNearestIndexBefore } = utilities;
      expect(findNearestIndexBefore([1], 0)).toBe(-1);
      expect(findNearestIndexBefore([1], 1)).toBe(0);
      expect(findNearestIndexBefore([1], 2)).toBe(0);
    });

    it("should handle exact matches", () => {
      const { findNearestIndexBefore } = utilities;
      expect(findNearestIndexBefore([1], 1)).toBe(0);
      expect(findNearestIndexBefore([1, 2], 2)).toBe(1);
      expect(findNearestIndexBefore([1, 2, 3], 1)).toBe(0);
      expect(findNearestIndexBefore([1, 2, 3], 2)).toBe(1);
      expect(findNearestIndexBefore([1, 2, 3], 3)).toBe(2);
    });

    it("should handle non-exact matches", () => {
      const { findNearestIndexBefore } = utilities;
      expect(findNearestIndexBefore([10, 20, 30], 1)).toBe(-1);
      expect(findNearestIndexBefore([10, 20, 30], 9)).toBe(-1);

      expect(findNearestIndexBefore([10, 20, 30], 11)).toBe(0);
      expect(findNearestIndexBefore([10, 20, 30], 19)).toBe(0);

      expect(findNearestIndexBefore([10, 20, 30], 21)).toBe(1);
      expect(findNearestIndexBefore([10, 20, 30], 29)).toBe(1);

      expect(findNearestIndexBefore([10, 20, 30], 31)).toBe(2);
    });

    it("should handle a target less than the array", () => {
      const { findNearestIndexBefore } = utilities;
      expect(findNearestIndexBefore([10, 20, 30], 5)).toBe(-1);
    });
  });

  describe("greaterThan", () => {
    it("should work", () => {
      const { greaterThan } = utilities;
      expect(greaterThan(1, 0)).toBe(true);
      expect(greaterThan(0, 0)).toBe(false);
      expect(greaterThan(0, 1)).toBe(false);
      expect(greaterThan(-10, 0)).toBe(false);
      expect(greaterThan(0, -10)).toBe(true);
      expect(greaterThan(-5, -10)).toBe(true);
      expect(greaterThan(-10, -5)).toBe(false);
    });
  });

  describe("greaterThanOrEqualTo", () => {
    it("should work", () => {
      const { greaterThanOrEqualTo } = utilities;
      expect(greaterThanOrEqualTo(1, 0)).toBe(true);
      expect(greaterThanOrEqualTo(0, 0)).toBe(true);
      expect(greaterThanOrEqualTo(0, 1)).toBe(false);
      expect(greaterThanOrEqualTo(-10, 0)).toBe(false);
      expect(greaterThanOrEqualTo(0, -10)).toBe(true);
      expect(greaterThanOrEqualTo(-10, -10)).toBe(true);
      expect(greaterThanOrEqualTo(-5, -10)).toBe(true);
      expect(greaterThanOrEqualTo(-10, -5)).toBe(false);
    });
  });

  describe("lessThan", () => {
    it("should work", () => {
      const { lessThan } = utilities;
      expect(lessThan(1, 0)).toBe(false);
      expect(lessThan(0, 0)).toBe(false);
      expect(lessThan(0, 1)).toBe(true);
      expect(lessThan(-10, 0)).toBe(true);
      expect(lessThan(0, -10)).toBe(false);
      expect(lessThan(-5, -10)).toBe(false);
      expect(lessThan(-10, -5)).toBe(true);
    });
  });

  describe("lessThanOrEqualTo", () => {
    it("should work", () => {
      const { lessThanOrEqualTo } = utilities;
      expect(lessThanOrEqualTo(1, 0)).toBe(false);
      expect(lessThanOrEqualTo(0, 0)).toBe(true);
      expect(lessThanOrEqualTo(0, 1)).toBe(true);
      expect(lessThanOrEqualTo(-10, 0)).toBe(true);
      expect(lessThanOrEqualTo(0, -10)).toBe(false);
      expect(lessThanOrEqualTo(-10, -10)).toBe(true);
      expect(lessThanOrEqualTo(-5, -10)).toBe(false);
      expect(lessThanOrEqualTo(-10, -5)).toBe(true);
    });
  });
});
