import { PointUtils } from "../../types";
import { createPointUtils } from "./createPointUtils";

describe("createPointUtils", () => {
  let pointUtils: PointUtils<number>;

  beforeEach(() => {
    pointUtils = createPointUtils<number>((a: number, b: number) => a - b);
  });

  describe("compare", () => {
    it("should work", () => {
      const { compare } = pointUtils;
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
      const { equals } = pointUtils;
      expect(equals(-1, -1)).toBe(true);
      expect(equals(0, 0)).toBe(true);
      expect(equals(1, 1)).toBe(true);
      expect(equals(-1, 0)).toBe(false);
      expect(equals(0, -1)).toBe(false);
      expect(equals(1, -1)).toBe(false);
    });
  });

  describe("greaterThan", () => {
    it("should work", () => {
      const { greaterThan } = pointUtils;
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
      const { greaterThanOrEqualTo } = pointUtils;
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
      const { lessThan } = pointUtils;
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
      const { lessThanOrEqualTo } = pointUtils;
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
