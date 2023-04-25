import { configure } from "./configure";
import { Utilities } from "./types";

describe("array-sorting-utilities", () => {
  let compare: jest.Mock<number, [a: number, b: number]>;
  let utilities: Utilities<number>;

  beforeEach(() => {
    compare = jest.fn();
    compare.mockImplementation((a: number, b: number) => {
      if (a === b) {
        return 0;
      } else {
        return a > b ? 1 : -1;
      }
    });

    utilities = configure<number>((a: number, b: number) => a - b);
  });

  describe("find", () => {
    let find: Utilities<number>["find"];

    beforeEach(() => {
      find = utilities.find;
    });

    it("should return the matching item if found", () => {
      const array = [1, 25, 100, 2500];

      expect(find(array, 1)).toEqual(1);
      expect(find(array, 25)).toEqual(25);
      expect(find(array, 100)).toEqual(100);
      expect(find(array, 2500)).toEqual(2500);
    });

    it("should return null if no matching item found", () => {
      expect(find([], 0)).toBeNull();
      expect(find([0], 1)).toBeNull();
      expect(find([1, 2], 0)).toBeNull();
    });
  });

  describe("findIndex", () => {
    let findIndex: Utilities<number>["findIndex"];

    beforeEach(() => {
      findIndex = utilities.findIndex;
    });

    it("should return -1 if the item is not in the array", () => {
      expect(findIndex([], 0)).toEqual(-1);
      expect(findIndex([0], 1)).toEqual(-1);
      expect(findIndex([1, 2], 0)).toEqual(-1);
    });

    it("should find item index", () => {
      const array = [1, 25, 100, 2500];

      expect(findIndex(array, 1)).toEqual(0);
      expect(findIndex(array, 25)).toEqual(1);
      expect(findIndex(array, 100)).toEqual(2);
      expect(findIndex(array, 2500)).toEqual(3);
    });

    describe("closest match", () => {
      it("should return -1 for empty arrays", () => {
        expect(findIndex([], 0)).toEqual(-1);
      });

      it("should find the closest item index", () => {
        const array = [1, 25, 100, 2500];

        expect(findIndex(array, -1, false)).toEqual(0);
        expect(findIndex(array, 0, false)).toEqual(0);
        expect(findIndex(array, 1, false)).toEqual(0);
        expect(findIndex(array, 2, false)).toEqual(0);

        expect(findIndex(array, 20, false)).toEqual(1);
        expect(findIndex(array, 25, false)).toEqual(1);
        expect(findIndex(array, 50, false)).toEqual(1);

        expect(findIndex(array, 2000, false)).toEqual(3);
        expect(findIndex(array, 2500, false)).toEqual(3);
        expect(findIndex(array, 3000, false)).toEqual(3);
      });

      it("should handle arrays of different parities", () => {
        expect(findIndex([1], 0, false)).toEqual(0);
        expect(findIndex([1], 2, false)).toEqual(0);

        expect(findIndex([1, 2], 0, false)).toEqual(0);
        expect(findIndex([1, 2], 3, false)).toEqual(1);

        // Ambiguous case!
        expect(findIndex([1, 3], 2, false)).toEqual(1);
      });
    });
  });

  describe("findInsertIndex", () => {
    let findInsertIndex: Utilities<number>["findInsertIndex"];

    beforeEach(() => {
      findInsertIndex = utilities.findInsertIndex;
    });

    it("should return the appropriate insertion index", () => {
      const array = [1, 25, 100, 2500];

      expect(findInsertIndex(array, -1)).toEqual(0);
      expect(findInsertIndex(array, 0)).toEqual(0);
      expect(findInsertIndex(array, 1)).toEqual(0);
      expect(findInsertIndex(array, 2)).toEqual(1);

      expect(findInsertIndex(array, 20)).toEqual(1);
      expect(findInsertIndex(array, 25)).toEqual(1);
      expect(findInsertIndex(array, 50)).toEqual(2);

      expect(findInsertIndex(array, 2000)).toEqual(3);
      expect(findInsertIndex(array, 2500)).toEqual(3);
      expect(findInsertIndex(array, 3000)).toEqual(4);
    });
  });

  describe("insert", () => {
    let insert: Utilities<number>["insert"];

    beforeEach(() => {
      insert = utilities.insert;
    });

    it("should maintain an ordered array", () => {
      const array: number[] = [];
      const compare = (a: number, b: number) => a - b;

      expect(insert(array, 4)).toEqual([4]);
      expect(insert(array, 1)).toEqual([1, 4]);
      expect(insert(array, 3)).toEqual([1, 3, 4]);
      expect(insert(array, 0)).toEqual([0, 1, 3, 4]);
      expect(insert(array, 2)).toEqual([0, 1, 2, 3, 4]);
    });
  });
});
