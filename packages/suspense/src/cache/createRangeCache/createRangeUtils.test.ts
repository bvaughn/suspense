import { RangeUtils } from "../../types";
import { createPointUtils } from "./createPointUtils";
import { createRangeUtils } from "./createRangeUtils";

describe("createRangeUtils", () => {
  let rangeUtils: RangeUtils<number>;

  beforeEach(() => {
    rangeUtils = createRangeUtils<number>(
      createPointUtils((a: number, b: number) => a - b)
    );
  });

  describe("compare", () => {
    it("should handle ranges with different start points", () => {
      const { compare } = rangeUtils;
      expect(compare([0, 3], [2, 5])).toBe(-1);
      expect(compare([2, 4], [1, 3])).toBe(1);
    });

    it("should handle ranges with the same start points", () => {
      const { compare } = rangeUtils;
      expect(compare([1, 3], [1, 5])).toBe(-1);
      expect(compare([-5, -2], [-5, -4])).toBe(1);
      expect(compare([-3, 5], [-3, 1])).toBe(1);
      expect(compare([-10, 0], [-10, 5])).toBe(-1);
    });

    it("should handle ranges with the same start and end points", () => {
      const { compare } = rangeUtils;
      expect(compare([2, 4], [2, 4])).toBe(0);
      expect(compare([-5, -3], [-5, -3])).toBe(0);
    });
  });

  describe("contains", () => {
    it("should accept exact matches", () => {
      const { contains } = rangeUtils;
      expect(contains([0, 0], [0, 0])).toBe(true);
      expect(contains([1, 4], [1, 4])).toBe(true);
      expect(contains([-5, 2], [-5, 2])).toBe(true);
    });

    it("should accept subsets", () => {
      const { contains } = rangeUtils;
      expect(contains([1, 10], [1, 2])).toBe(true);
      expect(contains([1, 10], [5, 8])).toBe(true);
      expect(contains([1, 10], [10, 10])).toBe(true);
      expect(contains([-10, 10], [-8, -4])).toBe(true);
      expect(contains([-10, 10], [2, 8])).toBe(true);
    });

    it("should reject partial intersections", () => {
      const { contains } = rangeUtils;
      expect(contains([2, 4], [1, 2])).toBe(false);
      expect(contains([2, 4], [1, 3])).toBe(false);
      expect(contains([2, 4], [3, 5])).toBe(false);
      expect(contains([2, 4], [4, 5])).toBe(false);
      expect(contains([-10, -5], [-12, -8])).toBe(false);
      expect(contains([-10, -5], [-8, -2])).toBe(false);
    });

    it("should reject non intersections", () => {
      const { contains } = rangeUtils;
      expect(contains([1, 4], [-5, -2])).toBe(false);
      expect(contains([-5, -10], [1, 4])).toBe(false);
      expect(contains([1, 4], [5, 10])).toBe(false);
      expect(contains([10, 20], [1, 8])).toBe(false);
    });
  });

  describe("equals", () => {
    it("should accept exact ranges", () => {
      const { equals } = rangeUtils;
      expect(equals([1, 5], [1, 5])).toBe(true);
      expect(equals([-1, 5], [-1, 5])).toBe(true);
      expect(equals([-1, -5], [-1, -5])).toBe(true);
    });

    it("should reject supersets and subsets", () => {
      const { equals } = rangeUtils;
      expect(equals([1, 5], [2, 4])).toBe(false);
      expect(equals([1, 5], [1, 4])).toBe(false);
      expect(equals([1, 5], [2, 5])).toBe(false);
      expect(equals([2, 4], [1, 5])).toBe(false);
      expect(equals([1, 4], [1, 5])).toBe(false);
      expect(equals([2, 5], [1, 5])).toBe(false);
    });

    it("should reject intersecting ranges", () => {
      const { equals } = rangeUtils;
      expect(equals([2, 4], [1, 2])).toBe(false);
      expect(equals([2, 4], [1, 3])).toBe(false);
      expect(equals([2, 4], [3, 5])).toBe(false);
      expect(equals([2, 4], [4, 5])).toBe(false);
      expect(equals([-10, -5], [-12, -8])).toBe(false);
      expect(equals([-10, -5], [-8, -2])).toBe(false);
    });

    it("should reject non intersecting ranges", () => {
      const { equals } = rangeUtils;
      expect(equals([1, 4], [-5, -2])).toBe(false);
      expect(equals([-5, -10], [1, 4])).toBe(false);
      expect(equals([1, 4], [5, 10])).toBe(false);
      expect(equals([10, 20], [1, 8])).toBe(false);
    });
  });

  describe("greaterThan", () => {
    it("should handle ranges with different start points", () => {
      const { greaterThan } = rangeUtils;
      expect(greaterThan([0, 3], [2, 5])).toBe(false);
      expect(greaterThan([2, 4], [1, 3])).toBe(true);
    });

    it("should handle ranges with the same start points", () => {
      const { greaterThan } = rangeUtils;
      expect(greaterThan([1, 3], [1, 5])).toBe(false);
      expect(greaterThan([-5, -2], [-5, -4])).toBe(true);
      expect(greaterThan([-3, 5], [-3, 1])).toBe(true);
      expect(greaterThan([-10, 0], [-10, 5])).toBe(false);
    });

    it("should handle ranges with the same start and end points", () => {
      const { greaterThan } = rangeUtils;
      expect(greaterThan([2, 4], [2, 4])).toBe(false);
      expect(greaterThan([-5, -3], [-5, -3])).toBe(false);
    });
  });

  describe("greaterThanOrEqualTo", () => {
    it("should handle ranges with different start points", () => {
      const { greaterThanOrEqualTo } = rangeUtils;
      expect(greaterThanOrEqualTo([0, 3], [2, 5])).toBe(false);
      expect(greaterThanOrEqualTo([2, 4], [1, 3])).toBe(true);
    });

    it("should handle ranges with the same start points", () => {
      const { greaterThanOrEqualTo } = rangeUtils;
      expect(greaterThanOrEqualTo([1, 3], [1, 5])).toBe(false);
      expect(greaterThanOrEqualTo([-5, -2], [-5, -4])).toBe(true);
      expect(greaterThanOrEqualTo([-3, 5], [-3, 1])).toBe(true);
      expect(greaterThanOrEqualTo([-10, 0], [-10, 5])).toBe(false);
    });

    it("should handle ranges with the same start and end points", () => {
      const { greaterThanOrEqualTo } = rangeUtils;
      expect(greaterThanOrEqualTo([2, 4], [2, 4])).toBe(true);
      expect(greaterThanOrEqualTo([-5, -3], [-5, -3])).toBe(true);
    });
  });

  describe("intersects", () => {
    it("should accept exact matches", () => {
      const { intersects } = rangeUtils;
      expect(intersects([0, 0], [0, 0])).toBe(true);
      expect(intersects([1, 4], [1, 4])).toBe(true);
      expect(intersects([-5, 2], [-5, 2])).toBe(true);
    });

    it("should accept subsets", () => {
      const { intersects } = rangeUtils;
      expect(intersects([1, 10], [1, 2])).toBe(true);
      expect(intersects([1, 10], [5, 8])).toBe(true);
      expect(intersects([1, 10], [10, 10])).toBe(true);
      expect(intersects([-10, 10], [-8, -4])).toBe(true);
      expect(intersects([-10, 10], [2, 8])).toBe(true);
    });

    it("should accept partial intersections", () => {
      const { intersects } = rangeUtils;
      expect(intersects([2, 4], [1, 2])).toBe(true);
      expect(intersects([2, 4], [1, 3])).toBe(true);
      expect(intersects([2, 4], [3, 5])).toBe(true);
      expect(intersects([2, 4], [4, 5])).toBe(true);
      expect(intersects([-10, -5], [-12, -8])).toBe(true);
      expect(intersects([-10, -5], [-8, -2])).toBe(true);
    });

    it("should reject non intersections", () => {
      const { intersects } = rangeUtils;
      expect(intersects([1, 4], [-5, -2])).toBe(false);
      expect(intersects([-5, -10], [1, 4])).toBe(false);
      expect(intersects([1, 4], [5, 10])).toBe(false);
      expect(intersects([10, 20], [1, 8])).toBe(false);
    });
  });

  describe("lessThan", () => {
    it("should handle ranges with different start points", () => {
      const { lessThan } = rangeUtils;
      expect(lessThan([0, 3], [2, 5])).toBe(true);
      expect(lessThan([2, 4], [1, 3])).toBe(false);
    });

    it("should handle ranges with the same start points", () => {
      const { lessThan } = rangeUtils;
      expect(lessThan([1, 3], [1, 5])).toBe(true);
      expect(lessThan([-5, -2], [-5, -4])).toBe(false);
      expect(lessThan([-3, 5], [-3, 1])).toBe(false);
      expect(lessThan([-10, 0], [-10, 5])).toBe(true);
    });

    it("should handle ranges with the same start and end points", () => {
      const { lessThan } = rangeUtils;
      expect(lessThan([2, 4], [2, 4])).toBe(false);
      expect(lessThan([-5, -3], [-5, -3])).toBe(false);
    });
  });

  describe("lessThanOrEqualTo", () => {
    it("should handle ranges with different start points", () => {
      const { lessThanOrEqualTo } = rangeUtils;
      expect(lessThanOrEqualTo([0, 3], [2, 5])).toBe(true);
      expect(lessThanOrEqualTo([2, 4], [1, 3])).toBe(false);
    });

    it("should handle ranges with the same start points", () => {
      const { lessThanOrEqualTo } = rangeUtils;
      expect(lessThanOrEqualTo([1, 3], [1, 5])).toBe(true);
      expect(lessThanOrEqualTo([-5, -2], [-5, -4])).toBe(false);
      expect(lessThanOrEqualTo([-3, 5], [-3, 1])).toBe(false);
      expect(lessThanOrEqualTo([-10, 0], [-10, 5])).toBe(true);
    });

    it("should handle ranges with the same start and end points", () => {
      const { lessThanOrEqualTo } = rangeUtils;
      expect(lessThanOrEqualTo([2, 4], [2, 4])).toBe(true);
      expect(lessThanOrEqualTo([-5, -3], [-5, -3])).toBe(true);
    });
  });

  describe("merge", () => {
    it("should return an exact match", () => {
      const { merge } = rangeUtils;
      expect(merge([1, 5], [1, 5])).toEqual([[1, 5]]);
    });

    it("should return the larger range when one contains the other", () => {
      const { merge } = rangeUtils;
      expect(merge([1, 5], [2, 4])).toEqual([[1, 5]]);
      expect(merge([1, 5], [1, 4])).toEqual([[1, 5]]);
      expect(merge([2, 4], [1, 5])).toEqual([[1, 5]]);
      expect(merge([1, 3], [1, 5])).toEqual([[1, 5]]);
    });

    it("should merge intersecting ranges", () => {
      const { merge } = rangeUtils;
      expect(merge([1, 3], [3, 5])).toEqual([[1, 5]]);
      expect(merge([1, 4], [2, 5])).toEqual([[1, 5]]);
      expect(merge([3, 5], [1, 3])).toEqual([[1, 5]]);
      expect(merge([2, 5], [1, 4])).toEqual([[1, 5]]);
    });

    it("should not merge non-intersecting ranges", () => {
      const { merge } = rangeUtils;
      expect(merge([1, 3], [5, 10])).toEqual([
        [1, 3],
        [5, 10],
      ]);
      expect(merge([5, 10], [1, 3])).toEqual([
        [1, 3],
        [5, 10],
      ]);
    });
  });

  describe("mergeAll", () => {
    it("should handle edge cases", () => {
      const { mergeAll } = rangeUtils;
      expect(mergeAll()).toEqual([]);
      expect(mergeAll([1, 5])).toEqual([[1, 5]]);
    });

    it("should handle ranges that are equal", () => {
      const { mergeAll } = rangeUtils;
      expect(mergeAll([1, 5], [1, 5], [1, 5])).toEqual([[1, 5]]);
      expect(mergeAll([-10, -5], [-10, -5])).toEqual([[-10, -5]]);
      expect(mergeAll([0, 0], [0, 0], [0, 0], [0, 0])).toEqual([[0, 0]]);
    });

    it("should merge subsets and supersets", () => {
      const { mergeAll } = rangeUtils;
      expect(mergeAll([1, 5], [1, 10], [2, 4], [8, 8])).toEqual([[1, 10]]);
      expect(mergeAll([1, 10], [3, 7], [3, 10])).toEqual([[1, 10]]);
      expect(mergeAll([1, 5], [1, 10], [2, 9])).toEqual([[1, 10]]);
      expect(mergeAll([-10, 0], [-5, -2], [-4, -4], [-1, 0])).toEqual([
        [-10, 0],
      ]);
    });

    it("should merge intersecting ranges", () => {
      const { mergeAll } = rangeUtils;
      expect(mergeAll([1, 5], [2, 7])).toEqual([[1, 7]]);
      expect(mergeAll([-10, -5], [-15, -8])).toEqual([[-15, -5]]);
      expect(mergeAll([2, 7], [1, 5])).toEqual([[1, 7]]);
      expect(mergeAll([-10, 0], [-10, 4])).toEqual([[-10, 4]]);
      expect(mergeAll([-10, 4], [-8, 0])).toEqual([[-10, 4]]);
      expect(mergeAll([-15, -8], [-10, -5])).toEqual([[-15, -5]]);
      expect(mergeAll([-5, 5], [0, 10])).toEqual([[-5, 10]]);
      expect(mergeAll([-15, 5], [-8, 0])).toEqual([[-15, 5]]);
    });

    it("should not merge non-intersecting ranges", () => {
      const { mergeAll } = rangeUtils;
      expect(mergeAll([1, 5], [6, 9], [10, 15])).toEqual([
        [1, 5],
        [6, 9],
        [10, 15],
      ]);
      expect(mergeAll([-10, -5], [-2, -1], [0, 5])).toEqual([
        [-10, -5],
        [-2, -1],
        [0, 5],
      ]);
      expect(mergeAll([1, 3], [5, 8], [10, 15])).toEqual([
        [1, 3],
        [5, 8],
        [10, 15],
      ]);
    });
  });

  describe("sort", () => {
    it("should handle edge cases", () => {
      const { sort } = rangeUtils;
      expect(sort()).toEqual([]);
      expect(sort([1, 5])).toEqual([[1, 5]]);
    });

    it("should handle ranges that are equal", () => {
      const { sort } = rangeUtils;
      expect(sort([1, 5], [1, 5])).toEqual([
        [1, 5],
        [1, 5],
      ]);
      expect(sort([-10, -5], [-10, -5])).toEqual([
        [-10, -5],
        [-10, -5],
      ]);
      expect(sort([0, 0], [0, 0], [0, 0], [0, 0])).toEqual([
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ]);
    });

    it("should sort ranges that are subsets or supersets", () => {
      const { sort } = rangeUtils;
      expect(sort([2, 4], [1, 10], [1, 5], [8, 8])).toEqual([
        [1, 5],
        [1, 10],
        [2, 4],
        [8, 8],
      ]);
    });

    it("should sort ranges that have the same starting point", () => {
      const { sort } = rangeUtils;
      expect(sort([1, 5], [1, 2], [1, 8])).toEqual([
        [1, 2],
        [1, 5],
        [1, 8],
      ]);
    });

    it("should sort ranges that intersect", () => {
      const { sort } = rangeUtils;
      expect(sort([1, 5], [4, 10], [3, 8], [0, 2])).toEqual([
        [0, 2],
        [1, 5],
        [3, 8],
        [4, 10],
      ]);
    });

    it("should sort ranges that do not intersect", () => {
      const { sort } = rangeUtils;
      expect(sort([1, 5], [-10, -5], [-8, 2])).toEqual([
        [-10, -5],
        [-8, 2],
        [1, 5],
      ]);
    });
  });

  describe("subtract", () => {
    it("should not subtract exact matches", () => {
      const { subtract } = rangeUtils;
      expect(subtract([1, 5], [1, 5])).toEqual([]);
      expect(subtract([-2, 5], [-2, 5])).toEqual([]);
      expect(subtract([-10, -5], [-10, -5])).toEqual([]);
    });

    it("should not subtract subsets", () => {
      const { subtract } = rangeUtils;
      expect(subtract([1, 5], [2, 4])).toEqual([]);
      expect(subtract([1, 5], [1, 4])).toEqual([]);
      expect(subtract([1, 5], [2, 5])).toEqual([]);
    });

    it("should supersets", () => {
      const { subtract } = rangeUtils;
      expect(subtract([2, 4], [1, 5])).toEqual([
        [1, 2],
        [4, 5],
      ]);
      expect(subtract([1, 4], [1, 5])).toEqual([[4, 5]]);
      expect(subtract([3, 5], [1, 5])).toEqual([[1, 3]]);
    });

    it("should subtract intersecting ranges", () => {
      const { subtract } = rangeUtils;
      expect(subtract([2, 4], [1, 3])).toEqual([[1, 2]]);
      expect(subtract([2, 4], [3, 7])).toEqual([[4, 7]]);
      expect(subtract([-5, -2], [-10, -4])).toEqual([[-10, -5]]);
      expect(subtract([-5, -2], [-3, -1])).toEqual([[-2, -1]]);
    });

    it("should subtract non-intersecting ranges", () => {
      const { subtract } = rangeUtils;
      expect(subtract([1, 3], [5, 10])).toEqual([[5, 10]]);
      expect(subtract([5, 10], [1, 3])).toEqual([[1, 3]]);
    });
  });
});
