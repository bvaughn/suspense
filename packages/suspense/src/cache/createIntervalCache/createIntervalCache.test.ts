import {
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../../constants";

import { IntervalCacheLoadOptions, Deferred, IntervalCache } from "../../types";
import { createDeferred } from "../../utils/createDeferred";
import { isPromiseLike } from "../../utils/isPromiseLike";
import { PartialArray, createIntervalCache } from "./createIntervalCache";

function createConditionalLoad(maxResultsLength: number) {
  return async (
    start: number,
    end: number,
    id: string,
    options: IntervalCacheLoadOptions<number>
  ) => {
    if (end - start >= maxResultsLength) {
      return options.returnAsPartial(
        createContiguousArray(start, end, maxResultsLength)
      );
    } else {
      return createContiguousArray(start, end);
    }
  };
}

function createContiguousArray(
  start: number,
  end: number,
  max: number = Number.MAX_SAFE_INTEGER
) {
  const length = Math.min(end - start + 1, max);
  return Array.from({ length }, (_, index) => start + index);
}

function getPointForValue(value: number) {
  return value;
}

describe("createIntervalCache", () => {
  let cache: IntervalCache<number, [id: string], number>;
  let getCacheKey: jest.Mock<string, [string]>;
  let load: jest.Mock<
    PromiseLike<Array<number> | PartialArray<number>>,
    [
      start: number,
      end: number,
      id: string,
      options: IntervalCacheLoadOptions<number>
    ]
  >;

  beforeEach(() => {
    getCacheKey = jest.fn();
    getCacheKey.mockImplementation((key) => key);

    load = jest.fn();
    load.mockImplementation(async (start: number, end: number, id: string) =>
      createContiguousArray(start, end)
    );

    cache = createIntervalCache<number, [id: string], number>({
      getKey: getCacheKey,
      getPointForValue,
      load,
    });
  });

  describe("abort", () => {
    let abortSignals: AbortSignal[] = [];
    let deferredArray: Deferred<number[]>[] = [];

    beforeEach(() => {
      abortSignals = [];
      deferredArray = [];

      load.mockImplementation(
        async (
          start: number,
          end: number,
          id: string,
          options: IntervalCacheLoadOptions<number>
        ) => {
          abortSignals.push(options.signal);

          const deferred = createDeferred<number[]>();

          deferredArray.push(deferred);

          return deferred.promise;
        }
      );
    });

    it("should abort all in-flight requests", async () => {
      cache.readAsync(1, 5, "test");
      cache.readAsync(6, 10, "test");

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
      cache.readAsync(1, 5, "one");
      cache.readAsync(6, 10, "two");

      abortSignals.forEach((signal) => {
        expect(signal.aborted).toBe(false);
      });

      expect(cache.abort("one")).toBe(true);

      expect(abortSignals[0]!.aborted).toBe(true);
      expect(abortSignals[1]!.aborted).toBe(false);
    });
  });

  describe("configuration", () => {
    it("should support bigint points", async () => {
      const load = jest.fn();
      load.mockImplementation((start: number, end: number, id: string) => [
        start,
      ]);

      const bigIntCache = createIntervalCache<bigint, [id: string], bigint>({
        getPointForValue: (value) => value,
        load,
      });

      await bigIntCache.readAsync(
        BigInt("10000000000000000000000000000000002"),
        BigInt("10000000000000000000000000000000004"),
        "test"
      );

      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(
        BigInt("10000000000000000000000000000000002"),
        BigInt("10000000000000000000000000000000004"),
        "test",
        expect.anything()
      );

      await bigIntCache.readAsync(
        BigInt("10000000000000000000000000000000003"),
        BigInt("10000000000000000000000000000000007"),
        "test"
      );
      expect(load).toHaveBeenCalledTimes(2);
      expect(load).toHaveBeenCalledWith(
        BigInt("10000000000000000000000000000000004"),
        BigInt("10000000000000000000000000000000007"),
        "test",
        expect.anything()
      );
    });
  });

  describe("evict", () => {
    it("should evict all values for the requested parameters", async () => {
      await cache.readAsync(1, 5, "one");
      await cache.readAsync(6, 10, "one");

      // Verify values have been cached
      await cache.readAsync(1, 5, "one");
      await cache.readAsync(6, 10, "one");
      expect(load).toHaveBeenCalled();

      load.mockClear();

      cache.evict("one");

      // Verify values in cache "one" have been evicted
      await cache.readAsync(1, 10, "one");
      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(1, 10, "one", expect.anything());
    });

    it("should only evict values for the requested parameters", async () => {
      await cache.readAsync(1, 10, "one");
      await cache.readAsync(2, 4, "two");

      const numCalls = load.mock.calls.length;

      // Verify values have been cached
      await cache.readAsync(1, 1, "one");
      await cache.readAsync(3, 3, "two");
      expect(load).toHaveBeenCalledTimes(numCalls);

      cache.evict("one");

      // Verify values in cache "one" have been evicted
      await cache.readAsync(1, 1, "one");
      expect(load).toHaveBeenCalledTimes(numCalls + 1);

      // Verify values in cache "two" are still cached
      await cache.readAsync(2, 2, "two");
      expect(load).toHaveBeenCalledTimes(numCalls + 1);
    });

    it("should also evict partial results for the requested parameters", async () => {
      load.mockImplementation(createConditionalLoad(4));

      await cache.readAsync(1, 10, "test");

      load.mockClear();

      // Verify values have been cached
      await cache.readAsync(1, 10, "test");
      expect(load).not.toHaveBeenCalled();

      cache.evict("test");

      // Verify values in cache "one" have been evicted
      await cache.readAsync(1, 10, "test");
      expect(load).toHaveBeenCalledTimes(1);
    });
  });

  describe("evictAll", () => {
    it("should evict all values", async () => {
      await cache.readAsync(1, 10, "one");
      await cache.readAsync(2, 4, "two");

      const numCalls = load.mock.calls.length;

      // Verify values have been cached
      await cache.readAsync(1, 1, "one");
      await cache.readAsync(2, 2, "two");
      expect(load).toHaveBeenCalledTimes(numCalls);

      cache.evictAll();

      // Verify values are re-requested after being evicted
      await cache.readAsync(1, 1, "one");
      await cache.readAsync(2, 2, "two");
      expect(load).toHaveBeenCalledTimes(numCalls + 2);
    });
  });

  describe("getStatus", () => {
    it("should return not-found for keys that have not been loaded", () => {
      expect(cache.getStatus(1, 5, "nope")).toBe(STATUS_NOT_FOUND);
    });

    it("should transition from pending to resolved", async () => {
      const willResolve = cache.readAsync(1, 5, "test");

      expect(cache.getStatus(1, 5, "test")).toBe(STATUS_PENDING);

      await willResolve;

      expect(cache.getStatus(1, 5, "test")).toBe(STATUS_RESOLVED);
    });

    it("should transition from pending to rejected", async () => {
      const deferred = createDeferred<number[]>();
      load.mockReturnValueOnce(deferred.promise);

      const willReject = cache.readAsync(1, 5, "test");

      expect(cache.getStatus(1, 5, "test")).toBe(STATUS_PENDING);

      try {
        deferred.reject("expected");
        await willReject;
      } catch (error) {}

      expect(cache.getStatus(1, 5, "test")).toBe(STATUS_REJECTED);
    });

    it("should return resolved or rejected for keys that have already been loaded", async () => {
      const willResolve = cache.readAsync(1, 5, "will-resolve");
      await willResolve;
      expect(cache.getStatus(1, 5, "will-resolve")).toBe(STATUS_RESOLVED);

      const deferred = createDeferred<number[]>();
      load.mockReturnValueOnce(deferred.promise);
      const willReject = cache.readAsync(6, 10, "will-reject");
      try {
        deferred.reject("expected");
        await willReject;
      } catch (error) {}
      expect(cache.getStatus(6, 10, "will-reject")).toBe(STATUS_REJECTED);
    });

    it("should identify intervals contained by loaded intervals as pending or resolved", async () => {
      await cache.readAsync(1, 5, "will-resolve");

      expect(cache.getStatus(2, 4, "will-resolve")).toBe(STATUS_RESOLVED);
    });

    it("should identify intervals contained by failed intervals as pending or resolved", async () => {
      const deferred = createDeferred<number[]>();
      load.mockReturnValueOnce(deferred.promise);

      const willReject = cache.readAsync(1, 5, "will-reject");

      try {
        deferred.reject("expected");
        await willReject;
      } catch (error) {}

      expect(cache.getStatus(2, 4, "will-reject")).toBe(STATUS_REJECTED);

      // Retrying a failed range should change this status though
      cache.readAsync(2, 4, "will-reject");
      expect(cache.getStatus(2, 4, "will-reject")).toBe(STATUS_PENDING);
    });

    it("should identify intervals contained by partially loaded intervals as not-found", async () => {
      load.mockImplementation(createConditionalLoad(4));

      await cache.readAsync(1, 10, "will-resolve-partial");

      expect(cache.getStatus(2, 4, "will-resolve-partial")).toBe(
        STATUS_NOT_FOUND
      );
    });
  });

  describe("getValue", () => {
    it("it should return a value if cached", async () => {
      await cache.readAsync(2, 4, "test");
      expect(cache.getValue(2, 4, "test")).toEqual(createContiguousArray(2, 4));
    });

    it("it should throw if value is not cached", async () => {
      expect(() => cache.getValue(2, 4, "test")).toThrow("No record found");
    });

    it("it should throw if value is pending", async () => {
      cache.readAsync(2, 4, "test");
      expect(() => cache.getValue(2, 4, "test")).toThrow(
        'Record found with status "pending"'
      );
    });

    it("it should throw if value was rejected", async () => {
      const deferred = createDeferred<number[]>();
      load.mockReturnValueOnce(deferred.promise);
      const willReject = cache.readAsync(6, 10, "will-reject");
      try {
        deferred.reject("expected");
        await willReject;
      } catch (error) {}

      expect(() => cache.getValue(6, 10, "will-reject")).toThrow("expected");
    });

    it("should return values for intervals contained by loaded intervals as resolved", async () => {
      await cache.readAsync(1, 5, "will-resolve");

      expect(cache.getValue(2, 4, "will-resolve")).toEqual(
        createContiguousArray(2, 4)
      );
    });

    it("should throw for intervals contained by partially loaded intervals", async () => {
      load.mockImplementation(createConditionalLoad(4));

      await cache.readAsync(1, 10, "will-resolve-partial");

      expect(() => cache.getValue(6, 8, "test")).toThrow("No record found");
    });
  });

  describe("getValueIfCached", () => {
    it("should return undefined for values not yet loaded", async () => {
      expect(cache.getValueIfCached(2, 4, "test")).toBeUndefined();
      expect(load).not.toHaveBeenCalled();
    });

    it("should return undefined for values that are pending", async () => {
      cache.readAsync(2, 4, "test");
      expect(cache.getValueIfCached(2, 4, "test")).toBeUndefined();
    });

    it("should return a cached value for values that have resolved", async () => {
      await cache.readAsync(2, 4, "test");
      expect(cache.getValueIfCached(2, 4, "test")).toEqual(
        createContiguousArray(2, 4)
      );
    });

    it("should return undefined for values that have rejected", async () => {
      const deferred = createDeferred<number[]>();
      load.mockReturnValueOnce(deferred.promise);
      const willReject = cache.readAsync(6, 10, "will-reject");
      try {
        deferred.reject("expected");
        await willReject;
      } catch (error) {}

      expect(cache.getValueIfCached(6, 10, "will-reject")).toBeUndefined();
    });

    it("should return values for intervals contained by loaded intervals as resolved", async () => {
      await cache.readAsync(1, 5, "will-resolve");

      expect(cache.getValueIfCached(2, 4, "will-resolve")).toEqual(
        createContiguousArray(2, 4)
      );
    });

    it("should return a partial value for intervals contained by partially loaded intervals", async () => {
      load.mockImplementation(createConditionalLoad(4));

      await cache.readAsync(1, 10, "will-resolve-partial");

      expect(cache.getValueIfCached(6, 8, "test")).toBe(undefined);
    });
  });

  describe("readAsync", () => {
    it("should progressively fetch and fill-in values for missing intervals", async () => {
      let values = await cache.readAsync(2, 4, "test");
      expect(values).toEqual(createContiguousArray(2, 4));
      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(2, 4, "test", expect.anything());

      load.mockClear();

      values = await cache.readAsync(7, 8, "test");
      expect(values).toEqual(createContiguousArray(7, 8));
      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(7, 8, "test", expect.anything());

      load.mockClear();

      values = await cache.readAsync(3, 8, "test");
      expect(values).toEqual(createContiguousArray(3, 8));
      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(4, 7, "test", expect.anything());

      load.mockClear();

      values = await cache.readAsync(2, 8, "test");
      expect(values).toEqual(createContiguousArray(2, 8));
      expect(load).not.toHaveBeenCalled();
    });

    it("should cache intervals separately based on parameters", async () => {
      await cache.readAsync(1, 10, "one");
      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(1, 10, "one", expect.anything());

      load.mockClear();

      // These intervals have already been loaded for key "one",
      await cache.readAsync(2, 4, "one");
      await cache.readAsync(6, 9, "one");
      expect(load).not.toHaveBeenCalled();

      // But key "two" needs to load them for the first time
      await cache.readAsync(2, 4, "two");
      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(2, 4, "two", expect.anything());

      load.mockClear();

      await cache.readAsync(6, 9, "two");
      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(6, 9, "two", expect.anything());
    });

    describe("concurrent requests", () => {
      beforeEach(() => {
        load.mockImplementation(
          async (
            start: number,
            end: number,
            id: string,
            options: IntervalCacheLoadOptions<number>
          ) => Promise.resolve(createContiguousArray(start, end))
        );
      });

      it("should wait for pending requests rather than load the same interval twice", async () => {
        const promiseA = cache.readAsync(1, 5, "test");
        const promiseB = cache.readAsync(1, 5, "test");

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(1, 5, "test", expect.anything());

        await expect(promiseA).resolves.toEqual(createContiguousArray(1, 5));
        await expect(promiseB).resolves.toEqual(createContiguousArray(1, 5));
      });

      it("should request new intervals when pending requests only cover part of the requested interval", async () => {
        const promiseA = cache.readAsync(1, 4, "test");
        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(1, 4, "test", expect.anything());

        const promiseB = cache.readAsync(2, 5, "test");
        expect(load).toHaveBeenCalledTimes(2);
        expect(load).toHaveBeenCalledWith(4, 5, "test", expect.anything());

        // Given the above requests, this interval is already pending
        const promiseC = cache.readAsync(3, 5, "test");
        expect(load).toHaveBeenCalledTimes(2);

        // All of the above requests should resolve to the correct values
        await expect(promiseA).resolves.toEqual(createContiguousArray(1, 4));
        await expect(promiseB).resolves.toEqual(createContiguousArray(2, 5));
        await expect(promiseC).resolves.toEqual(createContiguousArray(3, 5));

        // The above requests would have returned some duplicate values (e.g. 1,2,3,4 + 4,5)
        // These should have been filtered (e.g. 1,2,3,4,5)const promiseC = cache.readAsync(3, 5, "test");
        const promiseD = cache.readAsync(1, 5, "test");
        expect(load).toHaveBeenCalledTimes(2);
        await expect(promiseD).resolves.toEqual(createContiguousArray(1, 5));
      });
    });

    describe("aborted requests", () => {
      it("should properly cleanup after an aborted request", async () => {
        cache.readAsync(1, 5, "test");

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(1, 5, "test", expect.anything());

        cache.abort("test");

        // Finalize the abort
        await Promise.resolve();

        const promise = cache.readAsync(1, 5, "test");

        expect(load).toHaveBeenCalledTimes(2);
        expect(load).toHaveBeenCalledWith(1, 5, "test", expect.anything());

        await expect(promise).resolves.toEqual(createContiguousArray(1, 5));
      });

      it("should properly cleanup after a pending abort", async () => {
        cache.readAsync(1, 5, "test");

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(1, 5, "test", expect.anything());

        cache.abort("test");

        const promise = cache.readAsync(1, 5, "test");

        expect(load).toHaveBeenCalledTimes(2);
        expect(load).toHaveBeenCalledWith(1, 5, "test", expect.anything());

        await expect(promise).resolves.toEqual(createContiguousArray(1, 5));
      });
    });

    describe("failed requests", () => {
      beforeEach(() => {
        load.mockImplementation(async (start: number, end: number) =>
          Promise.resolve(createContiguousArray(start, end))
        );
      });

      it("should not load an interval that contains a previously failed interval", async () => {
        const deferred = createDeferred<number[]>();
        load.mockReturnValueOnce(deferred.promise);

        const promise = cache.readAsync(2, 4, "test");
        expect(load).toHaveBeenCalledTimes(1);
        deferred.reject(new Error("Expected"));
        await expect(() => promise).rejects.toThrow("Expected");

        expect(() => cache.readAsync(1, 5, "test")).toThrow(
          "Cannot load interval"
        );
      });

      it("should load an interval that is pert of (contained) by one that failed previously", async () => {
        const deferred = createDeferred<number[]>();
        load.mockReturnValueOnce(deferred.promise);

        const promise = cache.readAsync(1, 5, "test");
        expect(load).toHaveBeenCalledTimes(1);
        deferred.reject(new Error("Expected"));
        await expect(() => promise).rejects.toThrow("Expected");

        // Wait for promise rejection to finish
        await Promise.resolve();

        const result = await cache.readAsync(2, 4, "test");
        expect(load).toHaveBeenCalledTimes(2);
        expect(load).toHaveBeenCalledWith(2, 4, "test", expect.anything());
        expect(result).toEqual(createContiguousArray(2, 4));
      });

      it("should merge loaded values that intersect with a previously failed interval", async () => {
        const deferred = createDeferred<number[]>();
        load.mockReturnValueOnce(deferred.promise);

        const promise = cache.readAsync(4, 8, "test");
        expect(load).toHaveBeenCalledTimes(1);
        deferred.reject(new Error("Expected"));
        await expect(() => promise).rejects.toThrow("Expected");

        // Wait for promise rejection to finish
        await Promise.resolve();

        const result = await cache.readAsync(2, 6, "test");
        expect(load).toHaveBeenCalledTimes(2);
        expect(load).toHaveBeenCalledWith(2, 6, "test", expect.anything());
        expect(result).toEqual(createContiguousArray(2, 6));
      });

      it("should retry an interval if the record has been evicted", async () => {
        // Prime the cache
        cache.readAsync(1, 4, "test");
        cache.readAsync(6, 8, "test");

        // Request an interval that will result in two requests: 5,6 and 8,9
        const deferredResolves = createDeferred<number[]>();
        const deferredRejects = createDeferred<number[]>();
        load.mockImplementation(async (start: number, end: number) => {
          if (start === 5) {
            return deferredResolves.promise;
          } else {
            return deferredRejects.promise;
          }
        });
        cache.readAsync(5, 9, "test");
        deferredResolves.resolve([5, 6]);

        deferredRejects.reject(new Error("Expected"));

        // The failed interval will fail future requests that contain it
        await expect(() => cache.readAsync(5, 9, "test")).rejects.toThrow(
          "Expected"
        );
        await expect(() => cache.readAsync(9, 9, "test")).rejects.toThrow(
          "Expected"
        );

        // Evicting the failed interval will allow it to be requested again
        cache.evictAll();

        // Reset mock so any future fetches will succeed
        load.mockImplementation(async (start: number, end: number) =>
          createContiguousArray(start, end)
        );

        let values = await cache.readAsync(7, 8, "test");
        await expect(values).toEqual(createContiguousArray(7, 8));

        values = await cache.readAsync(5, 9, "test");
        await expect(values).toEqual(createContiguousArray(5, 9));
      });
    });

    describe("partial results", () => {
      const MAX_RESULTS_LENGTH = 4;

      beforeEach(() => {
        load.mockImplementation(createConditionalLoad(MAX_RESULTS_LENGTH));
      });

      it("should be cached", async () => {
        const partialValuesA = await cache.readAsync(1, 10, "test");
        expect(cache.isPartialResult(partialValuesA)).toBe(true);
        expect([...partialValuesA]).toEqual(
          createContiguousArray(1, 6, MAX_RESULTS_LENGTH)
        );
        expect(load).toHaveBeenCalledTimes(1);

        load.mockClear();

        const partialValuesB = await cache.readAsync(1, 10, "test");
        expect(cache.isPartialResult(partialValuesB)).toBe(true);
        expect(partialValuesA).toBe(partialValuesB);
        expect(load).not.toHaveBeenCalled();
      });

      it("should only be cached for the exact range specified", async () => {
        const partialValues = await cache.readAsync(1, 6, "test");
        expect(cache.isPartialResult(partialValues)).toBe(true);
        expect(load).toHaveBeenCalledTimes(1);

        load.mockClear();

        // Smaller ranges should generate completely new load requests
        // because there's no way of knowing where the partial results were truncated
        let values = await cache.readAsync(1, 3, "test");
        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(1, 3, "test", expect.anything());
        expect(cache.isPartialResult(values)).toBe(false);
        expect(values).toEqual(createContiguousArray(1, 3));

        load.mockClear();

        // Overlapping ranges should generate completely new load requests
        // because there's no way of knowing where the partial results were truncated
        values = await cache.readAsync(5, 8, "test");
        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(5, 8, "test", expect.anything());
        expect(cache.isPartialResult(values)).toBe(false);
        expect(values).toEqual(createContiguousArray(5, 8));
      });

      it("should be replaced by smaller intervals when appropriate", async () => {
        let values = await cache.readAsync(1, 10, "test");
        expect(values).toEqual(createContiguousArray(1, 4));
        expect(cache.isPartialResult(values)).toBe(true);

        load.mockClear();

        // Partial sub-ranges should be fetched and cached like normal
        // but the overall partial range should remained cached
        values = await cache.readAsync(1, 3, "test");
        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(1, 3, "test", expect.anything());
        expect(values).toEqual(createContiguousArray(1, 3));
        expect(cache.isPartialResult(values)).toBe(false);

        load.mockClear();

        // At this point, the range 1-3 has been fully loaded
        // and the previous partial range 1-10 has been reset,
        // so the remaining range (3-10) can be attempted
        values = await cache.readAsync(1, 10, "test");
        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(3, 10, "test", expect.anything());
        expect(values).toEqual(createContiguousArray(1, 6));
        expect(cache.isPartialResult(values)).toBe(true);

        load.mockClear();

        // At this point, the range 1-6 contains a mix of fully and partially loaded data
        values = await cache.readAsync(1, 6, "test");
        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(3, 6, "test", expect.anything());
        expect(values).toEqual(createContiguousArray(1, 6));
        expect(cache.isPartialResult(values)).toBe(false);

        load.mockClear();

        // Since it's fully loaded, it should not be requested again
        values = await cache.readAsync(1, 6, "test");
        expect(load).not.toHaveBeenCalled();
        expect(cache.isPartialResult(values)).toBe(false);
        expect(values).toEqual(createContiguousArray(1, 6));
      });

      it("should flag intervals containing partial sub-results as partial", async () => {
        let values = await cache.readAsync(2, 4, "test");
        expect(values).toEqual(createContiguousArray(2, 4));
        expect(cache.isPartialResult(values)).toBe(false);

        load.mockClear();

        // If we load a range that's larger than what we have already loaded,
        // and it contains a partial sub-range, the entire result should be flagged as partial
        values = await cache.readAsync(1, 10, "test");
        expect(load).toHaveBeenCalledTimes(2);
        expect(load).toHaveBeenCalledWith(1, 2, "test", expect.anything());
        expect(load).toHaveBeenCalledWith(4, 10, "test", expect.anything());
        expect(values).toEqual(createContiguousArray(1, 7));
        expect(cache.isPartialResult(values)).toBe(true);
      });
    });

    it("should return a stable value for a given range", async () => {
      const initialValue = await cache.readAsync(1, 3, "test");
      expect(initialValue).toBe(cache.getValue(1, 3, "test"));
      expect(initialValue).toBe(cache.read(1, 3, "test"));
    });
  });

  // Most tests are written for readAsync
  // Since they use the same code paths, we just lightly test read
  describe("read", () => {
    it("should suspend and resolve", async () => {
      try {
        cache.read(1, 3, "test");

        throw new Error("should have suspended");
      } catch (thenable) {
        expect(isPromiseLike(thenable)).toBe(true);

        await thenable;

        expect(cache.read(1, 3, "test")).toEqual(createContiguousArray(1, 3));
      }
    });
  });

  describe("subscribeToStatus", () => {
    let callbackA: jest.Mock;
    let callbackB: jest.Mock;

    beforeEach(() => {
      callbackA = jest.fn();
      callbackB = jest.fn();
    });

    it("should subscribe to keys that have not been loaded", async () => {
      cache.subscribeToStatus(callbackA, 1, 5, "text");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      await Promise.resolve();

      expect(callbackA).toHaveBeenCalledTimes(1);
    });

    it("should notify of the transition from undefined to pending to resolved", async () => {
      cache.subscribeToStatus(callbackA, 1, 5, "text");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      const promise = cache.readAsync(1, 5, "text");

      expect(callbackA).toHaveBeenCalledTimes(2);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);

      await promise;

      expect(callbackA).toHaveBeenCalledTimes(3);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should only notify each subscriber once", async () => {
      cache.subscribeToStatus(callbackA, 1, 5, "text");
      cache.subscribeToStatus(callbackB, 1, 5, "text");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      expect(callbackB).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      const promise = cache.readAsync(1, 5, "text");

      expect(callbackA).toHaveBeenCalledTimes(2);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);

      expect(callbackB).toHaveBeenCalledTimes(2);
      expect(callbackB).toHaveBeenCalledWith(STATUS_PENDING);

      await promise;

      expect(callbackA).toHaveBeenCalledTimes(3);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);

      expect(callbackB).toHaveBeenCalledTimes(3);
      expect(callbackB).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should not notify after a subscriber unsubscribes", async () => {
      const unsubscribe = cache.subscribeToStatus(callbackA, 1, 5, "test");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      unsubscribe();

      await cache.readAsync(1, 5, "test");

      expect(callbackA).toHaveBeenCalledTimes(1);
    });

    it("should track subscribers separately, per key", async () => {
      cache.subscribeToStatus(callbackA, 1, 5, "test-1");
      cache.subscribeToStatus(callbackB, 1, 5, "test-2");

      callbackA.mockClear();
      callbackB.mockClear();

      await cache.readAsync(1, 5, "test-2");

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledTimes(2);
    });

    it("should track unsubscriptions separately, per key", async () => {
      const unsubscribeA = cache.subscribeToStatus(callbackA, 1, 5, "test-1");
      cache.subscribeToStatus(callbackB, 1, 5, "test-2");

      callbackA.mockClear();
      callbackB.mockClear();

      unsubscribeA();

      await cache.readAsync(1, 5, "test-1");
      await cache.readAsync(1, 5, "test-2");

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledTimes(2);
    });

    it("should return the correct value for keys that have already been resolved or rejected", async () => {
      await cache.readAsync(1, 5, "will-resolve");

      const deferred = createDeferred<number[]>();
      load.mockReturnValueOnce(deferred.promise);
      const willReject = cache.readAsync(1, 5, "will-error");

      try {
        deferred.reject("expected");
        await willReject;
      } catch (error) {}

      cache.subscribeToStatus(callbackA, 1, 5, "will-resolve");
      cache.subscribeToStatus(callbackB, 1, 5, "will-error");

      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
      expect(callbackB).toHaveBeenCalledWith(STATUS_REJECTED);
    });

    it("should notify subscribers after a value is evicted", async () => {
      await cache.readAsync(1, 5, "test-1");
      await cache.readAsync(1, 5, "test-2");

      cache.subscribeToStatus(callbackA, 1, 5, "test-1");
      cache.subscribeToStatus(callbackB, 1, 5, "test-2");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
      expect(callbackB).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledWith(STATUS_RESOLVED);

      cache.evict("test-1");

      expect(callbackA).toHaveBeenCalledTimes(2);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);
      expect(callbackB).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should notify subscribers after all values are evicted", async () => {
      await cache.readAsync(1, 5, "test-1");
      await cache.readAsync(1, 5, "test-2");

      cache.subscribeToStatus(callbackA, 1, 5, "test-1");
      cache.subscribeToStatus(callbackB, 1, 5, "test-2");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
      expect(callbackB).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledWith(STATUS_RESOLVED);

      cache.evictAll();

      expect(callbackA).toHaveBeenCalledTimes(2);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);
      expect(callbackB).toHaveBeenCalledTimes(2);
      expect(callbackB).toHaveBeenCalledWith(STATUS_NOT_FOUND);
    });

    it("should notify of in-progress request when an interval is refined", async () => {
      const deferred = createDeferred<number[]>();
      load.mockReturnValueOnce(deferred.promise);

      const willReject = cache.readAsync(1, 5, "test");
      expect(load).toHaveBeenCalledTimes(1);
      deferred.reject(new Error("Expected"));
      await expect(() => willReject).rejects.toThrow("Expected");

      // Wait for promise rejection to finish
      await Promise.resolve();

      const willResolve = cache.readAsync(2, 4, "test");

      cache.subscribeToStatus(callbackA, 2, 4, "test");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);
      expect(cache.getStatus(2, 4, "test")).toBe(STATUS_PENDING);

      await willResolve;

      expect(callbackA).toHaveBeenCalledTimes(2);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
      expect(cache.getStatus(2, 4, "test")).toBe(STATUS_RESOLVED);
    });
  });

  describe("development mode", () => {
    it("should warn if a key contains a stringified object", async () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});

      getCacheKey.mockImplementation((string) => `${{ string }}`);

      cache.readAsync(0, 10, "one");

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching("contains a stringified object")
      );

      // Only warn once per cache though
      cache.readAsync(0, 10, "two");
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("logs debug messages to console", () => {
      const consoleMock = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      cache = createIntervalCache<number, [id: string], number>({
        debugLabel: "test-cache",
        debugLogging: true,
        getPointForValue,
        load,
      });
      console.log(consoleMock.mock.calls);
      expect(consoleMock).toHaveBeenCalled();
      expect(consoleMock.mock.calls[0]).toEqual(
        expect.arrayContaining([
          expect.stringContaining("test-cache"),
          expect.stringContaining("Creating cache"),
        ])
      );

      consoleMock.mockClear();
      cache.readAsync(0, 10, "one");
      expect(consoleMock).toHaveBeenCalled();
      expect(consoleMock.mock.calls[0]).toEqual(
        expect.arrayContaining([
          expect.stringContaining("test-cache"),
          expect.stringContaining("readAsync"),
          expect.stringContaining("one"),
        ])
      );

      consoleMock.mockClear();
      cache.disableDebugLogging();
      cache.readAsync(0, 10, "two");
      expect(consoleMock).not.toHaveBeenCalled();

      consoleMock.mockClear();
      cache.enableDebugLogging();
      cache.readAsync(0, 10, "three");
      expect(consoleMock).toHaveBeenCalled();
      expect(consoleMock.mock.calls[0]).toEqual(
        expect.arrayContaining([
          expect.stringContaining("test-cache"),
          expect.stringContaining("readAsync"),
          expect.stringContaining("three"),
        ])
      );
    });
  });
});
