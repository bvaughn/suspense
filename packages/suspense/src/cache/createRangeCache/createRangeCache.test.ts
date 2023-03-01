import { Iterator } from "typescript";
import {
  RangeCacheLoadOptions,
  Deferred,
  RangeCache,
  Thenable,
} from "../../types";
import { createDeferred } from "../../utils/createDeferred";
import { isThenable } from "../../utils/isThenable";
import { createRangeCache } from "./createRangeCache";
import { defaultGetRangeIterator } from "./defaultGetRangeIterator";

function createContiguousArray(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getPointForValue(value: number) {
  return value;
}

describe("createRangeCache", () => {
  let cache: RangeCache<number, [id: string], number>;
  let load: jest.Mock<
    Thenable<number[]>,
    [start: number, end: number, id: string, options: RangeCacheLoadOptions]
  >;

  beforeEach(() => {
    load = jest.fn();
    load.mockImplementation(
      async (
        start: number,
        end: number,
        id: string,
        options: RangeCacheLoadOptions
      ) => createContiguousArray(start, end)
    );

    cache = createRangeCache<number, [id: string], number>({
      getPointForValue,
      load,
    });
  });

  describe("abort", () => {
    let abortSignals: AbortSignal[] = [];
    let deferreds: Deferred<number[]>[] = [];

    beforeEach(() => {
      abortSignals = [];
      deferreds = [];

      load.mockImplementation(
        async (
          start: number,
          end: number,
          id: string,
          options: RangeCacheLoadOptions
        ) => {
          abortSignals.push(options.signal);

          const deferred = createDeferred<number[]>();

          deferreds.push(deferred);

          return deferred;
        }
      );
    });

    it("should abort all in-flight requests", async () => {
      cache.fetchAsync(1, 5, "test");
      cache.fetchAsync(6, 10, "test");

      abortSignals.forEach((signal) => {
        expect(signal.aborted).toBe(false);
      });

      expect(cache.abort("test")).toBe(true);

      abortSignals.forEach((signal) => {
        expect(signal.aborted).toBe(true);
      });
    });

    it("should report if there are no in-flight requests", async () => {
      expect(cache.abort("test")).toBe(false);
    });

    it("should only abort in-flight requests for the requested parameters", async () => {
      cache.fetchAsync(1, 5, "one");
      cache.fetchAsync(6, 10, "two");

      abortSignals.forEach((signal) => {
        expect(signal.aborted).toBe(false);
      });

      expect(cache.abort("one")).toBe(true);

      expect(abortSignals[0].aborted).toBe(true);
      expect(abortSignals[1].aborted).toBe(false);
    });
  });

  describe("evict", () => {
    it("should evict all values for the requested parameters", async () => {
      await cache.fetchAsync(1, 5, "one");
      await cache.fetchAsync(6, 10, "one");

      const numCalls = load.mock.calls.length;

      // Verify values have been cached
      await cache.fetchAsync(1, 5, "one");
      await cache.fetchAsync(6, 10, "one");
      expect(load).toHaveBeenCalledTimes(numCalls);

      cache.evict("one");

      // Verify values in cache "one" have been evicted
      await cache.fetchAsync(1, 10, "one");
      expect(load).toHaveBeenCalledTimes(numCalls + 1);
      expect(load.mock.lastCall.slice(0, 3)).toEqual([1, 10, "one"]);
    });

    it("should only evict values for the requested parameters", async () => {
      await cache.fetchAsync(1, 10, "one");
      await cache.fetchAsync(2, 4, "two");

      const numCalls = load.mock.calls.length;

      // Verify values have been cached
      await cache.fetchAsync(1, 1, "one");
      await cache.fetchAsync(2, 2, "two");
      expect(load).toHaveBeenCalledTimes(numCalls);

      cache.evict("one");

      // Verify values in cache "one" have been evicted
      await cache.fetchAsync(1, 1, "one");
      expect(load).toHaveBeenCalledTimes(numCalls + 1);

      // Verify values in cache "two" are still cached
      await cache.fetchAsync(2, 2, "two");
      expect(load).toHaveBeenCalledTimes(numCalls + 1);
    });
  });

  describe("evictAll", () => {
    it("should evict all values", async () => {
      await cache.fetchAsync(1, 10, "one");
      await cache.fetchAsync(2, 4, "two");

      const numCalls = load.mock.calls.length;

      // Verify values have been cached
      await cache.fetchAsync(1, 1, "one");
      await cache.fetchAsync(2, 2, "two");
      expect(load).toHaveBeenCalledTimes(numCalls);

      cache.evictAll();

      // Verify values are re-requested after being evicted
      await cache.fetchAsync(1, 1, "one");
      await cache.fetchAsync(2, 2, "two");
      expect(load).toHaveBeenCalledTimes(numCalls + 2);
    });
  });

  describe("fetchAsync", () => {
    it("should progressively fetch and fill-in values for missing ranges", async () => {
      let values = await cache.fetchAsync(2, 4, "test");
      expect(values).toEqual(createContiguousArray(2, 4));
      expect(load).toHaveBeenCalledTimes(1);
      expect(load.mock.lastCall.slice(0, 3)).toEqual([2, 4, "test"]);

      values = await cache.fetchAsync(7, 8, "test");
      expect(values).toEqual(createContiguousArray(7, 8));
      expect(load).toHaveBeenCalledTimes(2);
      expect(load.mock.lastCall.slice(0, 3)).toEqual([7, 8, "test"]);

      values = await cache.fetchAsync(3, 8, "test");
      expect(values).toEqual(createContiguousArray(3, 8));
      expect(load).toHaveBeenCalledTimes(3);
      expect(load.mock.lastCall.slice(0, 3)).toEqual([5, 6, "test"]);
    });

    it("should cache ranges separately based on parameters", async () => {
      await cache.fetchAsync(1, 10, "one");
      expect(load).toHaveBeenCalledTimes(1);
      expect(load.mock.lastCall.slice(0, 3)).toEqual([1, 10, "one"]);

      // These ranges have already been loaded for key "one",
      await cache.fetchAsync(2, 4, "one");
      await cache.fetchAsync(6, 9, "one");
      expect(load).toHaveBeenCalledTimes(1);

      // But key "two" needs to load them for the first time
      await cache.fetchAsync(2, 4, "two");
      expect(load).toHaveBeenCalledTimes(2);
      expect(load.mock.lastCall.slice(0, 3)).toEqual([2, 4, "two"]);
      await cache.fetchAsync(6, 9, "two");
      expect(load).toHaveBeenCalledTimes(3);
      expect(load.mock.lastCall.slice(0, 3)).toEqual([6, 9, "two"]);
    });

    it("should use the supplied iterator to determine which range(s) to load", async () => {
      const getRangeIterator = jest.fn();
      getRangeIterator.mockImplementation(defaultGetRangeIterator);

      cache = createRangeCache<number, [id: string], number>({
        getPointForValue,
        getRangeIterator,
        load,
      });

      // Prime the cache with some initial values
      for (let index = 1; index < 10; index += 2) {
        await cache.fetchAsync(index, index, "test");
      }

      const numCalls = load.mock.calls.length;

      // Configure our iterator to report no gaps between 3–5 and 7–9
      getRangeIterator.mockImplementation((start: number, end: number) => {
        const values = [1, 2, 3, 5, 6, 7, 9, 10];
        let index = 0;

        const iterator: Iterator<number> = {
          next() {
            if (index < values.length) {
              const value = values[index];

              index++;

              return { done: false, value };
            }

            return { done: true, value: null };
          },
        };

        return iterator;
      });

      await cache.fetchAsync(1, 10, "test");
      expect(load).toHaveBeenCalledTimes(numCalls + 3);
      expect(load.mock.calls[numCalls].slice(0, 3)).toEqual([2, 2, "test"]);
      expect(load.mock.calls[numCalls + 1].slice(0, 3)).toEqual([6, 6, "test"]);
      expect(load.mock.calls[numCalls + 2].slice(0, 3)).toEqual([
        10,
        10,
        "test",
      ]);
    });
  });

  // Most tests are written for fetchAsync
  // Since they use the same code paths, we just lightly test fetchSuspense
  describe("fetchSuspense", () => {
    it("should suspend and resolve", async () => {
      try {
        cache.fetchSuspense(1, 3, "test");

        throw new Error("should have suspended");
      } catch (thenable) {
        expect(isThenable(thenable)).toBe(true);

        await thenable;

        expect(cache.fetchSuspense(1, 3, "test")).toEqual(
          createContiguousArray(1, 3)
        );
      }
    });
  });
});
