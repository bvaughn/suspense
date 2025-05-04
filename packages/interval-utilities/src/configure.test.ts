import { beforeEach, describe, expect, it } from "vitest";
import { configure } from "./configure";
import { Utilities } from "./types";

describe("interval-utilities", () => {
  let utilities: Utilities<number>;

  beforeEach(() => {
    utilities = configure<number>((a: number, b: number) => a - b);
  });

  describe("compare", () => {
    it("should handle intervals with different start points", () => {
      const { compare } = utilities;
      expect(compare([0, 3], [2, 5])).toBe(-1);
      expect(compare([2, 4], [1, 3])).toBe(1);
    });

    it("should handle intervals with the same start points", () => {
      const { compare } = utilities;
      expect(compare([1, 3], [1, 5])).toBe(-1);
      expect(compare([-5, -2], [-5, -4])).toBe(1);
      expect(compare([-3, 5], [-3, 1])).toBe(1);
      expect(compare([-10, 0], [-10, 5])).toBe(-1);
    });

    it("should handle intervals with the same start and end points", () => {
      const { compare } = utilities;
      expect(compare([2, 4], [2, 4])).toBe(0);
      expect(compare([-5, -3], [-5, -3])).toBe(0);
    });
  });

  describe("contains", () => {
    it("should accept exact matches", () => {
      const { contains } = utilities;
      expect(contains([0, 0], [0, 0])).toBe(true);
      expect(contains([1, 4], [1, 4])).toBe(true);
      expect(contains([-5, 2], [-5, 2])).toBe(true);
    });

    it("should accept subsets", () => {
      const { contains } = utilities;
      expect(contains([1, 10], [1, 2])).toBe(true);
      expect(contains([1, 10], [5, 8])).toBe(true);
      expect(contains([1, 10], [10, 10])).toBe(true);
      expect(contains([-10, 10], [-8, -4])).toBe(true);
      expect(contains([-10, 10], [2, 8])).toBe(true);
    });

    it("should reject partial intersections", () => {
      const { contains } = utilities;
      expect(contains([2, 4], [1, 2])).toBe(false);
      expect(contains([2, 4], [1, 3])).toBe(false);
      expect(contains([2, 4], [3, 5])).toBe(false);
      expect(contains([2, 4], [4, 5])).toBe(false);
      expect(contains([-10, -5], [-12, -8])).toBe(false);
      expect(contains([-10, -5], [-8, -2])).toBe(false);
    });

    it("should reject non intersections", () => {
      const { contains } = utilities;
      expect(contains([1, 4], [-5, -2])).toBe(false);
      expect(contains([-5, -10], [1, 4])).toBe(false);
      expect(contains([1, 4], [5, 10])).toBe(false);
      expect(contains([10, 20], [1, 8])).toBe(false);
    });
  });

  describe("equals", () => {
    it("should accept exact intervals", () => {
      const { equals } = utilities;
      expect(equals([1, 5], [1, 5])).toBe(true);
      expect(equals([-1, 5], [-1, 5])).toBe(true);
      expect(equals([-1, -5], [-1, -5])).toBe(true);
    });

    it("should reject supersets and subsets", () => {
      const { equals } = utilities;
      expect(equals([1, 5], [2, 4])).toBe(false);
      expect(equals([1, 5], [1, 4])).toBe(false);
      expect(equals([1, 5], [2, 5])).toBe(false);
      expect(equals([2, 4], [1, 5])).toBe(false);
      expect(equals([1, 4], [1, 5])).toBe(false);
      expect(equals([2, 5], [1, 5])).toBe(false);
    });

    it("should reject intersecting intervals", () => {
      const { equals } = utilities;
      expect(equals([2, 4], [1, 2])).toBe(false);
      expect(equals([2, 4], [1, 3])).toBe(false);
      expect(equals([2, 4], [3, 5])).toBe(false);
      expect(equals([2, 4], [4, 5])).toBe(false);
      expect(equals([-10, -5], [-12, -8])).toBe(false);
      expect(equals([-10, -5], [-8, -2])).toBe(false);
    });

    it("should reject non intersecting intervals", () => {
      const { equals } = utilities;
      expect(equals([1, 4], [-5, -2])).toBe(false);
      expect(equals([-5, -10], [1, 4])).toBe(false);
      expect(equals([1, 4], [5, 10])).toBe(false);
      expect(equals([10, 20], [1, 8])).toBe(false);
    });
  });

  describe("greaterThan", () => {
    it("should handle intervals with different start points", () => {
      const { greaterThan } = utilities;
      expect(greaterThan([0, 3], [2, 5])).toBe(false);
      expect(greaterThan([2, 4], [1, 3])).toBe(true);
    });

    it("should handle intervals with the same start points", () => {
      const { greaterThan } = utilities;
      expect(greaterThan([1, 3], [1, 5])).toBe(false);
      expect(greaterThan([-5, -2], [-5, -4])).toBe(true);
      expect(greaterThan([-3, 5], [-3, 1])).toBe(true);
      expect(greaterThan([-10, 0], [-10, 5])).toBe(false);
    });

    it("should handle intervals with the same start and end points", () => {
      const { greaterThan } = utilities;
      expect(greaterThan([2, 4], [2, 4])).toBe(false);
      expect(greaterThan([-5, -3], [-5, -3])).toBe(false);
    });
  });

  describe("greaterThanOrEqualTo", () => {
    it("should handle intervals with different start points", () => {
      const { greaterThanOrEqualTo } = utilities;
      expect(greaterThanOrEqualTo([0, 3], [2, 5])).toBe(false);
      expect(greaterThanOrEqualTo([2, 4], [1, 3])).toBe(true);
    });

    it("should handle intervals with the same start points", () => {
      const { greaterThanOrEqualTo } = utilities;
      expect(greaterThanOrEqualTo([1, 3], [1, 5])).toBe(false);
      expect(greaterThanOrEqualTo([-5, -2], [-5, -4])).toBe(true);
      expect(greaterThanOrEqualTo([-3, 5], [-3, 1])).toBe(true);
      expect(greaterThanOrEqualTo([-10, 0], [-10, 5])).toBe(false);
    });

    it("should handle intervals with the same start and end points", () => {
      const { greaterThanOrEqualTo } = utilities;
      expect(greaterThanOrEqualTo([2, 4], [2, 4])).toBe(true);
      expect(greaterThanOrEqualTo([-5, -3], [-5, -3])).toBe(true);
    });
  });

  describe("intersects", () => {
    it("should accept exact matches", () => {
      const { intersects } = utilities;
      expect(intersects([0, 0], [0, 0])).toBe(true);
      expect(intersects([1, 4], [1, 4])).toBe(true);
      expect(intersects([-5, 2], [-5, 2])).toBe(true);
    });

    it("should accept subsets", () => {
      const { intersects } = utilities;
      expect(intersects([1, 10], [1, 2])).toBe(true);
      expect(intersects([1, 10], [5, 8])).toBe(true);
      expect(intersects([1, 10], [10, 10])).toBe(true);
      expect(intersects([-10, 10], [-8, -4])).toBe(true);
      expect(intersects([-10, 10], [2, 8])).toBe(true);
    });

    it("should accept partial intersections", () => {
      const { intersects } = utilities;
      expect(intersects([2, 4], [1, 2])).toBe(true);
      expect(intersects([2, 4], [1, 3])).toBe(true);
      expect(intersects([2, 4], [3, 5])).toBe(true);
      expect(intersects([2, 4], [4, 5])).toBe(true);
      expect(intersects([-10, -5], [-12, -8])).toBe(true);
      expect(intersects([-10, -5], [-8, -2])).toBe(true);
    });

    it("should reject non intersections", () => {
      const { intersects } = utilities;
      expect(intersects([1, 4], [-5, -2])).toBe(false);
      expect(intersects([-5, -10], [1, 4])).toBe(false);
      expect(intersects([1, 4], [5, 10])).toBe(false);
      expect(intersects([10, 20], [1, 8])).toBe(false);
    });
  });

  describe("lessThan", () => {
    it("should handle intervals with different start points", () => {
      const { lessThan } = utilities;
      expect(lessThan([0, 3], [2, 5])).toBe(true);
      expect(lessThan([2, 4], [1, 3])).toBe(false);
    });

    it("should handle intervals with the same start points", () => {
      const { lessThan } = utilities;
      expect(lessThan([1, 3], [1, 5])).toBe(true);
      expect(lessThan([-5, -2], [-5, -4])).toBe(false);
      expect(lessThan([-3, 5], [-3, 1])).toBe(false);
      expect(lessThan([-10, 0], [-10, 5])).toBe(true);
    });

    it("should handle intervals with the same start and end points", () => {
      const { lessThan } = utilities;
      expect(lessThan([2, 4], [2, 4])).toBe(false);
      expect(lessThan([-5, -3], [-5, -3])).toBe(false);
    });
  });

  describe("lessThanOrEqualTo", () => {
    it("should handle intervals with different start points", () => {
      const { lessThanOrEqualTo } = utilities;
      expect(lessThanOrEqualTo([0, 3], [2, 5])).toBe(true);
      expect(lessThanOrEqualTo([2, 4], [1, 3])).toBe(false);
    });

    it("should handle intervals with the same start points", () => {
      const { lessThanOrEqualTo } = utilities;
      expect(lessThanOrEqualTo([1, 3], [1, 5])).toBe(true);
      expect(lessThanOrEqualTo([-5, -2], [-5, -4])).toBe(false);
      expect(lessThanOrEqualTo([-3, 5], [-3, 1])).toBe(false);
      expect(lessThanOrEqualTo([-10, 0], [-10, 5])).toBe(true);
    });

    it("should handle intervals with the same start and end points", () => {
      const { lessThanOrEqualTo } = utilities;
      expect(lessThanOrEqualTo([2, 4], [2, 4])).toBe(true);
      expect(lessThanOrEqualTo([-5, -3], [-5, -3])).toBe(true);
    });
  });

  describe("merge", () => {
    it("should return an exact match", () => {
      const { merge } = utilities;
      expect(merge([1, 5], [1, 5])).toEqual([[1, 5]]);
    });

    it("should return the larger interval when one contains the other", () => {
      const { merge } = utilities;
      expect(merge([1, 5], [2, 4])).toEqual([[1, 5]]);
      expect(merge([1, 5], [1, 4])).toEqual([[1, 5]]);
      expect(merge([2, 4], [1, 5])).toEqual([[1, 5]]);
      expect(merge([1, 3], [1, 5])).toEqual([[1, 5]]);
    });

    it("should merge intersecting intervals", () => {
      const { merge } = utilities;
      expect(merge([1, 3], [3, 5])).toEqual([[1, 5]]);
      expect(merge([1, 4], [2, 5])).toEqual([[1, 5]]);
      expect(merge([3, 5], [1, 3])).toEqual([[1, 5]]);
      expect(merge([2, 5], [1, 4])).toEqual([[1, 5]]);
    });

    it("should not merge non-intersecting intervals", () => {
      const { merge } = utilities;
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
      const { mergeAll } = utilities;
      expect(mergeAll()).toEqual([]);
      expect(mergeAll([1, 5])).toEqual([[1, 5]]);
    });

    it("should handle intervals that are equal", () => {
      const { mergeAll } = utilities;
      expect(mergeAll([1, 5], [1, 5], [1, 5])).toEqual([[1, 5]]);
      expect(mergeAll([-10, -5], [-10, -5])).toEqual([[-10, -5]]);
      expect(mergeAll([0, 0], [0, 0], [0, 0], [0, 0])).toEqual([[0, 0]]);
    });

    it("should merge subsets and supersets", () => {
      const { mergeAll } = utilities;
      expect(mergeAll([1, 5], [1, 10], [2, 4], [8, 8])).toEqual([[1, 10]]);
      expect(mergeAll([1, 10], [3, 7], [3, 10])).toEqual([[1, 10]]);
      expect(mergeAll([1, 5], [1, 10], [2, 9])).toEqual([[1, 10]]);
      expect(mergeAll([-10, 0], [-5, -2], [-4, -4], [-1, 0])).toEqual([
        [-10, 0],
      ]);
    });

    it("should merge intersecting intervals", () => {
      const { mergeAll } = utilities;
      expect(mergeAll([1, 5], [2, 7])).toEqual([[1, 7]]);
      expect(mergeAll([-10, -5], [-15, -8])).toEqual([[-15, -5]]);
      expect(mergeAll([2, 7], [1, 5])).toEqual([[1, 7]]);
      expect(mergeAll([-10, 0], [-10, 4])).toEqual([[-10, 4]]);
      expect(mergeAll([-10, 4], [-8, 0])).toEqual([[-10, 4]]);
      expect(mergeAll([-15, -8], [-10, -5])).toEqual([[-15, -5]]);
      expect(mergeAll([-5, 5], [0, 10])).toEqual([[-5, 10]]);
      expect(mergeAll([-15, 5], [-8, 0])).toEqual([[-15, 5]]);
    });

    it("should not merge non-intersecting intervals", () => {
      const { mergeAll } = utilities;
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

  describe("separate", () => {
    it("should support exact matches", () => {
      const { separate } = utilities;
      expect(separate([1, 5], [1, 5])).toEqual({
        a: [],
        b: [],
        ab: [[1, 5]],
      });
      expect(separate([-2, 5], [-2, 5])).toEqual({
        a: [],
        b: [],
        ab: [[-2, 5]],
      });
      expect(separate([-10, -5], [-10, -5])).toEqual({
        a: [],
        b: [],
        ab: [[-10, -5]],
      });
    });

    it("should support subsets", () => {
      const { separate } = utilities;
      expect(separate([1, 10], [1, 5])).toEqual({
        a: [[5, 10]],
        b: [],
        ab: [[1, 5]],
      });
      expect(separate([-10, -2], [-8, -5])).toEqual({
        a: [
          [-10, -8],
          [-5, -2],
        ],
        b: [],
        ab: [[-8, -5]],
      });
      expect(separate([-2, 5], [3, 5])).toEqual({
        a: [[-2, 3]],
        b: [],
        ab: [[3, 5]],
      });
    });

    it("should support supersets", () => {
      const { separate } = utilities;
      expect(separate([2, 4], [1, 10])).toEqual({
        a: [],
        b: [
          [1, 2],
          [4, 10],
        ],
        ab: [[2, 4]],
      });

      expect(separate([-10, -5], [-20, 0])).toEqual({
        a: [],
        b: [
          [-20, -10],
          [-5, 0],
        ],
        ab: [[-10, -5]],
      });

      expect(separate([2, 5], [-10, 5])).toEqual({
        a: [],
        b: [[-10, 2]],
        ab: [[2, 5]],
      });
    });

    it("should support intersecting intervals", () => {
      const { separate } = utilities;
      expect(separate([1, 5], [2, 6])).toEqual({
        a: [[1, 2]],
        b: [[5, 6]],
        ab: [[2, 5]],
      });

      expect(separate([-20, -10], [-15, -5])).toEqual({
        a: [[-20, -15]],
        b: [[-10, -5]],
        ab: [[-15, -10]],
      });
    });

    it("should support non-intersecting intervals", () => {
      const { separate } = utilities;
      expect(separate([-10, -5], [5, 10])).toEqual({
        a: [[-10, -5]],
        b: [[5, 10]],
        ab: [],
      });
    });
  });

  describe("separateAll", () => {
    it("case one (intersecting)", () => {
      const { separateAll } = utilities;
      expect(
        separateAll(
          [
            [0, 0],
            [3, 5],
          ],
          [[2, 4]]
        )
      ).toEqual({
        a: [
          [0, 0],
          [4, 5],
        ],
        b: [[2, 3]],
        ab: [[3, 4]],
      });
    });

    it("case two (intersecting)", () => {
      const { separateAll } = utilities;
      expect(
        separateAll(
          [
            [0, 3],
            [5, 5],
          ],
          [
            [1, 1],
            [3, 3],
          ]
        )
      ).toEqual({
        a: [
          [0, 1],
          [1, 3],
          [5, 5],
        ],
        b: [],
        ab: [
          [1, 1],
          [3, 3],
        ],
      });
    });

    it("case three (non intersecting)", () => {
      const { separateAll } = utilities;
      expect(
        separateAll(
          [
            [0, 0],
            [3, 4],
            [6, 6],
          ],
          [
            [1, 2],
            [5, 5],
          ]
        )
      ).toEqual({
        a: [
          [0, 0],
          [3, 4],
          [6, 6],
        ],
        b: [
          [1, 2],
          [5, 5],
        ],
        ab: [],
      });
    });

    it("case three (non intersecting, sparse)", () => {
      const { separateAll } = utilities;
      expect(
        separateAll(
          [
            [3, 3],
            [5, 6],
          ],
          [
            [0, 1],
            [8, 8],
          ]
        )
      ).toEqual({
        a: [
          [3, 3],
          [5, 6],
        ],
        b: [
          [0, 1],
          [8, 8],
        ],
        ab: [],
      });
    });
  });

  describe("sort", () => {
    it("should handle edge cases", () => {
      const { sort } = utilities;
      expect(sort()).toEqual([]);
      expect(sort([1, 5])).toEqual([[1, 5]]);
    });

    it("should handle intervals that are equal", () => {
      const { sort } = utilities;
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

    it("should sort intervals that are subsets or supersets", () => {
      const { sort } = utilities;
      expect(sort([2, 4], [1, 10], [1, 5], [8, 8])).toEqual([
        [1, 5],
        [1, 10],
        [2, 4],
        [8, 8],
      ]);
    });

    it("should sort intervals that have the same starting point", () => {
      const { sort } = utilities;
      expect(sort([1, 5], [1, 2], [1, 8])).toEqual([
        [1, 2],
        [1, 5],
        [1, 8],
      ]);
    });

    it("should sort intervals that intersect", () => {
      const { sort } = utilities;
      expect(sort([1, 5], [4, 10], [3, 8], [0, 2])).toEqual([
        [0, 2],
        [1, 5],
        [3, 8],
        [4, 10],
      ]);
    });

    it("should sort intervals that do not intersect", () => {
      const { sort } = utilities;
      expect(sort([1, 5], [-10, -5], [-8, 2])).toEqual([
        [-10, -5],
        [-8, 2],
        [1, 5],
      ]);
    });
  });
});
