import { compare as compareBigInt } from "extra-bigint";
import {
  RangeCacheLoadOptions,
  Deferred,
  RangeCache,
  Thenable,
} from "../../types";
import { createDeferred } from "../../utils/createDeferred";
import { isThenable } from "../../utils/isThenable";
import { createRangeCache } from "./createRangeCache";

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

  describe("configuration", () => {
    it("should support bigint points via a custom comparePoints", async () => {
      const comparePoints = jest.fn(compareBigInt);

      const load = jest.fn();
      load.mockImplementation((value) => [value]);

      const bigIntCache = createRangeCache<bigint, [id: string], bigint>({
        comparePoints,
        getPointForValue: (value) => value,
        load,
      });

      await bigIntCache.fetchAsync(BigInt("2"), BigInt("4"), "test");

      expect(comparePoints).toHaveBeenCalled();

      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(
        BigInt("2"),
        BigInt("4"),
        "test",
        expect.any(Object)
      );

      await bigIntCache.fetchAsync(BigInt("3"), BigInt("7"), "test");
      expect(load).toHaveBeenCalledTimes(2);
      expect(load).toHaveBeenCalledWith(
        BigInt("4"),
        BigInt("7"),
        "test",
        expect.any(Object)
      );
    });

    it("should support string points via a custom comparePoints", async () => {
      function compareStrings(a: string, b: string) {
        return a.localeCompare(b);
      }

      const comparePoints = jest.fn(compareStrings);

      const load = jest.fn();
      load.mockImplementation((value) => [value]);

      const bigIntCache = createRangeCache<string, [id: string], string>({
        comparePoints,
        getPointForValue: (value) => value,
        load,
      });

      await bigIntCache.fetchAsync("f", "l", "test");

      expect(comparePoints).toHaveBeenCalled();

      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith("f", "l", "test", expect.any(Object));

      await bigIntCache.fetchAsync("a", "c", "test");
      expect(load).toHaveBeenCalledTimes(2);
      expect(load).toHaveBeenCalledWith("a", "c", "test", expect.any(Object));
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
      await cache.fetchAsync(3, 3, "two");
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
      expect(load.mock.lastCall.slice(0, 3)).toEqual([4, 7, "test"]);
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
