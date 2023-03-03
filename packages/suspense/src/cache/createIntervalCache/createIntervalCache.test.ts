import { compare as compareBigInt } from "extra-bigint";

import {
  IntervalCacheLoadOptions,
  Deferred,
  IntervalCache,
  Thenable,
} from "../../types";
import { createDeferred } from "../../utils/createDeferred";
import { isThenable } from "../../utils/isThenable";
import { createIntervalCache } from "./createIntervalCache";

function createContiguousArray(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getPointForValue(value: number) {
  return value;
}

describe("createIntervalCache", () => {
  let cache: IntervalCache<number, [id: string], number>;
  let load: jest.Mock<
    Thenable<number[]>,
    [start: number, end: number, id: string, options: IntervalCacheLoadOptions]
  >;

  beforeEach(() => {
    load = jest.fn();
    load.mockImplementation(
      async (
        start: number,
        end: number,
        id: string,
        options: IntervalCacheLoadOptions
      ) => createContiguousArray(start, end)
    );

    cache = createIntervalCache<number, [id: string], number>({
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
          options: IntervalCacheLoadOptions
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

      const bigIntCache = createIntervalCache<bigint, [id: string], bigint>({
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

      const bigIntCache = createIntervalCache<string, [id: string], string>({
        comparePoints,
        getPointForValue: (value) => value,
        load,
      });

      await bigIntCache.fetchAsync("f", "l", "test");

      expect(comparePoints).toHaveBeenCalled();

      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith("f", "l", "test", expect.any(Object));

      await bigIntCache.fetchAsync("a", "g", "test");
      expect(load).toHaveBeenCalledTimes(2);
      expect(load).toHaveBeenCalledWith("a", "f", "test", expect.any(Object));
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

    // TODO
    xit("should retry the same interval after a failed attempt has been evicted", async () => {
      jest.useFakeTimers();

      // Prime the cache
      cache.fetchAsync(1, 4, "test");
      cache.fetchAsync(6, 8, "test");

      let pending: Deferred<number[]>[] = [];
      load.mockImplementation(async () => {
        const deferred = createDeferred<number[]>();
        pending.push(deferred);
        return deferred;
      });

      // Request an interval that will result in two requests: 5,6 and 8,9
      let promise = cache.fetchAsync(5, 9, "test");
      expect(pending).toHaveLength(2);

      pending[0].resolve([5, 6]);
      pending[1].reject(new Error("Expected"));

      // The failed interval will fail future requests that contain it
      await expect(cache.fetchAsync(5, 9, "test")).toThrow("Expected");
      await expect(cache.fetchAsync(9, 9, "test")).toThrow("Expected");

      // Evicting the failed interval will allow it to be requested again
      cache.evictAll();

      await expect(await cache.fetchAsync(7, 8, "test")).toEqual([7, 8]);
      await expect(await cache.fetchAsync(5, 9, "test")).toEqual([
        5, 6, 7, 8, 9,
      ]);
    });
  });

  describe("fetchAsync", () => {
    it("should progressively fetch and fill-in values for missing intervals", async () => {
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

    it("should cache intervals separately based on parameters", async () => {
      await cache.fetchAsync(1, 10, "one");
      expect(load).toHaveBeenCalledTimes(1);
      expect(load.mock.lastCall.slice(0, 3)).toEqual([1, 10, "one"]);

      // These intervals have already been loaded for key "one",
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

    describe("concurrent requests", () => {
      beforeEach(() => {
        load.mockImplementation(
          async (
            start: number,
            end: number,
            id: string,
            options: IntervalCacheLoadOptions
          ) => Promise.resolve(createContiguousArray(start, end))
        );
      });

      it("should wait for pending requests rather than load the same interval twice", async () => {
        const promiseA = cache.fetchAsync(1, 5, "test");
        const promiseB = cache.fetchAsync(1, 5, "test");

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(1, 5, "test", expect.any(Object));

        await expect(promiseA).resolves.toEqual(createContiguousArray(1, 5));
        await expect(promiseB).resolves.toEqual(createContiguousArray(1, 5));
      });

      it("should request new intervals when pending requests only cover part of the requested interval", async () => {
        const promiseA = cache.fetchAsync(1, 4, "test");
        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(1, 4, "test", expect.any(Object));

        const promiseB = cache.fetchAsync(2, 5, "test");
        expect(load).toHaveBeenCalledTimes(2);
        expect(load).toHaveBeenCalledWith(4, 5, "test", expect.any(Object));

        // Given the above requests, this interval is already pending
        const promiseC = cache.fetchAsync(3, 5, "test");
        expect(load).toHaveBeenCalledTimes(2);

        // All of the above requests should resolve to the correct values
        await expect(promiseA).resolves.toEqual(createContiguousArray(1, 4));
        await expect(promiseB).resolves.toEqual(createContiguousArray(2, 5));
        await expect(promiseC).resolves.toEqual(createContiguousArray(3, 5));

        // The above requests would have returned some duplicate values (e.g. 1,2,3,4 + 4,5)
        // These should have been filtered (e.g. 1,2,3,4,5)const promiseC = cache.fetchAsync(3, 5, "test");
        const promiseD = cache.fetchAsync(1, 5, "test");
        expect(load).toHaveBeenCalledTimes(2);
        await expect(promiseD).resolves.toEqual(createContiguousArray(1, 5));
      });
    });

    it("should properly cleanup after an aborted request", async () => {
      cache.fetchAsync(1, 5, "test");

      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(1, 5, "test", expect.any(Object));

      cache.abort("test");

      // Finalize the abort
      await Promise.resolve();

      const promise = cache.fetchAsync(1, 5, "test");

      expect(load).toHaveBeenCalledTimes(2);
      expect(load).toHaveBeenCalledWith(1, 5, "test", expect.any(Object));

      await expect(promise).resolves.toEqual(createContiguousArray(1, 5));
    });

    it("should properly cleanup after a pending abort", async () => {
      cache.fetchAsync(1, 5, "test");

      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(1, 5, "test", expect.any(Object));

      cache.abort("test");

      const promise = cache.fetchAsync(1, 5, "test");

      expect(load).toHaveBeenCalledTimes(2);
      expect(load).toHaveBeenCalledWith(1, 5, "test", expect.any(Object));

      await expect(promise).resolves.toEqual(createContiguousArray(1, 5));
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
