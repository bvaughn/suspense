import {
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { createCache } from "./createCache";
import { Cache, Deferred, CacheLoadOptions } from "../types";
import { isPromiseLike } from "../utils/isPromiseLike";
import { createDeferred } from "../utils/createDeferred";
import { mockWeakRef, SimpleLRUCache, WeakRefArray } from "../utils/test";
import { WeakRefMap } from "../utils/WeakRefMap";

function defaultLoad(
  [key]: [key: string],
  options: CacheLoadOptions
): Promise<string> | string {
  if (key.startsWith("async")) {
    return Promise.resolve(key);
  } else if (key.startsWith("error")) {
    return Promise.reject(key);
  } else {
    return key;
  }
}

describe("createCache", () => {
  let cache: Cache<[string], string>;
  let getCacheKey: jest.Mock<string, [[string]]>;
  let load: jest.Mock<Promise<string> | string, [[string], CacheLoadOptions]>;

  beforeEach(() => {
    load = jest.fn();
    load.mockImplementation(defaultLoad);

    getCacheKey = jest.fn();
    getCacheKey.mockImplementation(([key]) => key.toString());

    cache = createCache<[string], string>({
      debugLabel: "cache",
      getKey: getCacheKey,
      load,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function fakeSuspend(read: () => any) {
    try {
      return read();
    } catch (thenable) {
      expect(isPromiseLike(thenable)).toBe(true);

      await thenable;

      return read();
    }
  }

  it("should supply a working default getCacheKey if none is provided", () => {
    const cache = createCache<[string, number, boolean], string>({
      load: ([string, number, boolean]) => string,
    });
    cache.cache("foo", "string", 123, true);
    cache.cache("bar", "other string", 456, false);

    expect(cache.getValueIfCached("string", 123, true)).toEqual("foo");
    expect(cache.getValueIfCached("other string", 456, false)).toEqual("bar");
  });

  describe("abort", () => {
    it("should abort an active request", () => {
      let abortSignal: AbortSignal | undefined;
      let deferred: Deferred<string> | undefined;
      load.mockImplementation(async (params, options) => {
        abortSignal = options.signal;
        deferred = createDeferred();
        return deferred.promise;
      });

      cache.readAsync("async");
      expect(cache.getStatus("async")).toBe(STATUS_PENDING);

      expect(cache.abort("async")).toBe(true);
      expect(cache.getStatus("async")).toBe(STATUS_NOT_FOUND);

      expect(abortSignal?.aborted).toBe(true);

      deferred!.resolve("async");
      expect(cache.getStatus("async")).toBe(STATUS_NOT_FOUND);
    });

    it("should restart an aborted request on next fetch", async () => {
      let deferred: Deferred<string> | null = null;
      load.mockImplementation(async () => {
        deferred = createDeferred();
        return deferred.promise;
      });

      cache.readAsync("async");
      expect(cache.getStatus("async")).toBe(STATUS_PENDING);

      const initialDeferred = deferred!;

      expect(cache.abort("async")).toBe(true);
      expect(cache.getStatus("async")).toBe(STATUS_NOT_FOUND);

      const fetchTwo = cache.readAsync("async");
      expect(cache.getStatus("async")).toBe(STATUS_PENDING);
      expect(load).toHaveBeenCalled();

      // At this point, even if the first request completes– it should be ignored.
      initialDeferred.resolve("async");
      expect(cache.getStatus("async")).toBe(STATUS_PENDING);

      // But the second request should be processed.
      deferred!.resolve("async");
      await fetchTwo;
      expect(cache.getStatus("async")).toBe(STATUS_RESOLVED);
    });

    it("should gracefully handle an abort request for a completed fetch", () => {
      cache.readAsync("sync");
      expect(cache.getStatus("sync")).toBe(STATUS_RESOLVED);

      expect(cache.abort("sync")).toBe(false);
    });
  });

  describe("cache", () => {
    it("should cache and return pre-fetched values without reloading", () => {
      cache.cache("SYNC", "sync-1");
      cache.cache("ASYNC", "async-1");

      expect(cache.getValueIfCached("sync-1")).toEqual("SYNC");
      expect(cache.getValueIfCached("async-1")).toEqual("ASYNC");

      expect(load).not.toHaveBeenCalled();
    });

    it("should resolve an in-progress read", async () => {
      const wouldReject = cache.readAsync("error");

      expect(cache.getValueIfCached("error")).toBeUndefined();
      expect(cache.getStatus("error")).toBe(STATUS_PENDING);

      cache.cache("VALUE", "error");

      expect(cache.getValueIfCached("error")).toBe("VALUE");
      expect(cache.getStatus("error")).toBe(STATUS_RESOLVED);

      await wouldReject;

      expect(cache.getValueIfCached("error")).toBe("VALUE");
      expect(cache.getStatus("error")).toBe(STATUS_RESOLVED);
    });
  });

  describe("evict", () => {
    it("should event cached items", () => {
      cache.cache("VALUE 1", "sync-1");
      cache.cache("VALUE 2", "sync-2");

      expect(cache.getValueIfCached("sync-1")).toEqual("VALUE 1");
      expect(cache.getValueIfCached("sync-2")).toEqual("VALUE 2");

      expect(load).not.toHaveBeenCalled();

      cache.evict("sync-1");

      expect(cache.getValueIfCached("sync-1")).toEqual(undefined);
      expect(cache.getValueIfCached("sync-2")).toEqual("VALUE 2");
    });

    it("should refetch requested items after eviction", () => {
      cache.cache("VALUE", "sync");
      cache.evict("sync");

      expect(load).not.toHaveBeenCalled();

      cache.readAsync("sync");

      expect(load).toHaveBeenCalled();
    });
  });

  describe("evictAll", () => {
    it("should event cached items", () => {
      cache.cache("VALUE 1", "sync-1");
      cache.cache("VALUE 2", "sync-2");

      expect(cache.getValueIfCached("sync-1")).toEqual("VALUE 1");
      expect(cache.getValueIfCached("sync-2")).toEqual("VALUE 2");

      expect(load).not.toHaveBeenCalled();

      cache.evictAll();

      expect(cache.getValueIfCached("sync-1")).toEqual(undefined);
      expect(cache.getValueIfCached("sync-2")).toEqual(undefined);
    });

    it("should refetch requested items after eviction", () => {
      cache.cache("VALUE 1", "sync-1");
      cache.cache("VALUE 2", "sync-2");

      expect(load).not.toHaveBeenCalled();

      cache.evictAll();

      cache.readAsync("sync-1");
      cache.readAsync("sync-2");

      expect(load).toHaveBeenCalledTimes(2);
    });
  });

  describe("getStatus", () => {
    it("should return not-found for keys that have not been loaded", () => {
      expect(cache.getStatus("nope")).toBe(STATUS_NOT_FOUND);
    });

    it("should transition from pending to resolved", async () => {
      const willResolve = cache.readAsync("async");

      expect(cache.getStatus("async")).toBe(STATUS_PENDING);

      await willResolve;

      expect(cache.getStatus("async")).toBe(STATUS_RESOLVED);
    });

    it("should transition from pending to rejected", async () => {
      load.mockReturnValue(Promise.reject("Expected"));

      const willReject = cache.readAsync("error");

      expect(cache.getStatus("error")).toBe(STATUS_PENDING);

      try {
        await willReject;
      } catch (error) {}

      expect(cache.getStatus("error")).toBe(STATUS_REJECTED);
    });

    it("should return resolved or rejected for keys that have already been loaded", async () => {
      const willResolve = cache.readAsync("sync");
      await willResolve;
      expect(cache.getStatus("sync")).toBe(STATUS_RESOLVED);

      const willReject = cache.readAsync("error");
      try {
        await willReject;
      } catch (error) {}
      expect(cache.getStatus("error")).toBe(STATUS_REJECTED);
    });
  });

  describe("readAsync", () => {
    it("should return async values", async () => {
      const thenable = cache.readAsync("async");

      expect(isPromiseLike(thenable)).toBe(true);

      await expect(await thenable).toBe("async");
    });

    it("should return sync values", () => {
      expect(cache.readAsync("sync")).toBe("sync");
    });

    it("should only load the same value once (per key)", () => {
      expect(cache.readAsync("sync")).toBe("sync");
      expect(cache.readAsync("sync")).toBe("sync");

      expect(load).toHaveBeenCalledTimes(1);
    });
  });

  describe("read", () => {
    it("should suspend on async values", async () => {
      await expect(await fakeSuspend(() => cache.read("async"))).toBe("async");
    });

    it("should not suspend on sync values", () => {
      expect(cache.read("sync")).toBe("sync");
    });

    it("should only fetch the same value once (per key)", () => {
      expect(cache.read("sync")).toBe("sync");
      expect(cache.read("sync")).toBe("sync");

      expect(load).toHaveBeenCalledTimes(1);
    });
  });

  describe("getValue", () => {
    it("it should return a value if cached", () => {
      cache.readAsync("sync");
      expect(cache.getValue("sync")).toEqual("sync");
    });

    it("it should throw if value is not cached", () => {
      expect(() => cache.getValue("sync")).toThrow("No record found");
    });

    it("it should throw if value is pending", () => {
      cache.readAsync("async");
      expect(() => cache.getValue("async")).toThrow(
        'Record found with status "pending"'
      );
    });

    it("it should throw if value was rejected", async () => {
      try {
        await cache.readAsync("error-expected");
      } catch (error) {}
      expect(() => cache.getValue("error-expected")).toThrow("error-expected");
    });
  });

  describe("getValueIfCached", () => {
    it("should return undefined for values not yet loaded", () => {
      expect(cache.getValueIfCached("sync")).toBeUndefined();
      expect(load).not.toHaveBeenCalled();
    });

    it("should return undefined for values that are pending", () => {
      cache.readAsync("async");
      expect(cache.getValueIfCached("async")).toBeUndefined();
    });

    it("should return a cached value for values that have resolved", () => {
      cache.readAsync("sync");
      expect(cache.getValueIfCached("sync")).toEqual("sync");
    });

    it("should return undefined for values that have rejected", async () => {
      try {
        await cache.readAsync("error-expected");
      } catch (error) {}
      expect(cache.getValueIfCached("error-expected")).toBeUndefined();
    });
  });

  describe("prefetch", () => {
    it("should start fetching a resource", async () => {
      cache.prefetch("sync-1");

      load.mockClear();

      // Verify value already loaded
      cache.readAsync("sync-1");
      expect(load).not.toHaveBeenCalled();
      expect(cache.getValue("sync-1")).toEqual("sync-1");

      // Verify other values fetch independently
      load.mockImplementation(defaultLoad);
      cache.readAsync("sync-2");
      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(["sync-2"], expect.anything());
      expect(cache.getValue("sync-2")).toEqual("sync-2");
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
      cache.subscribeToStatus(callbackA, "sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      await Promise.resolve();

      expect(callbackA).toHaveBeenCalledTimes(1);
    });

    it("should notify of the transition from undefined to resolved for synchronous caches", async () => {
      cache.subscribeToStatus(callbackA, "sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      cache.readAsync("sync");

      expect(callbackA).toHaveBeenCalledTimes(3);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should notify of the transition from undefined to pending to resolved for async caches", async () => {
      cache.subscribeToStatus(callbackA, "async");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      const thenable = cache.readAsync("async");

      expect(callbackA).toHaveBeenCalledTimes(2);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);

      await thenable;

      expect(callbackA).toHaveBeenCalledTimes(3);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should only notify each subscriber once", async () => {
      cache.subscribeToStatus(callbackA, "sync");
      cache.subscribeToStatus(callbackB, "sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      expect(callbackB).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      cache.readAsync("sync");

      expect(callbackA).toHaveBeenCalledTimes(3);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);

      expect(callbackB).toHaveBeenCalledTimes(3);
      expect(callbackB).toHaveBeenCalledWith(STATUS_PENDING);
      expect(callbackB).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should not notify after a subscriber unsubscribes", async () => {
      const unsubscribe = cache.subscribeToStatus(callbackA, "sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      unsubscribe();

      cache.readAsync("sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
    });

    it("should track subscribers separately, per key", async () => {
      cache.subscribeToStatus(callbackA, "sync-1");
      cache.subscribeToStatus(callbackB, "sync-2");

      callbackA.mockClear();
      callbackB.mockClear();

      cache.readAsync("sync-2");

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledTimes(2);
    });

    it("should track unsubscriptions separately, per key", async () => {
      const unsubscribeA = cache.subscribeToStatus(callbackA, "sync-1");
      cache.subscribeToStatus(callbackB, "sync-2");

      callbackA.mockClear();
      callbackB.mockClear();

      unsubscribeA();

      cache.readAsync("sync-1");
      cache.readAsync("sync-2");

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledTimes(2);
    });

    it("should return the correct value for keys that have already been resolved or rejected", async () => {
      cache.readAsync("async");
      try {
        await cache.readAsync("error");
      } catch (error) {}

      await Promise.resolve();

      cache.subscribeToStatus(callbackA, "async");
      cache.subscribeToStatus(callbackB, "error");

      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
      expect(callbackB).toHaveBeenCalledWith(STATUS_REJECTED);
    });

    it("should notify subscribers after a value is evicted", async () => {
      cache.readAsync("sync-1");
      cache.readAsync("sync-2");

      await Promise.resolve();

      cache.subscribeToStatus(callbackA, "sync-1");
      cache.subscribeToStatus(callbackB, "sync-2");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
      expect(callbackB).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledWith(STATUS_RESOLVED);

      cache.evict("sync-1");

      expect(callbackA).toHaveBeenCalledTimes(2);
      expect(callbackA).toHaveBeenCalledWith(STATUS_NOT_FOUND);
      expect(callbackB).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should notify subscribers after all values are evicted", async () => {
      cache.readAsync("sync-1");
      cache.readAsync("sync-2");

      await Promise.resolve();

      cache.subscribeToStatus(callbackA, "sync-1");
      cache.subscribeToStatus(callbackB, "sync-2");

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
  });

  describe("getCache: LRU Cache", () => {
    let evictFn: jest.Mock<void, [string]>;
    let loadObject: jest.Mock<
      Promise<Object> | Object,
      [[string], CacheLoadOptions]
    >;
    let lruCache: Cache<[string], Object>;

    beforeEach(() => {
      evictFn = jest.fn();

      loadObject = jest.fn();
      loadObject.mockImplementation(([key]) => {
        if (key.startsWith("async")) {
          return Promise.resolve({ key });
        } else if (key.startsWith("error")) {
          return Promise.reject(key);
        } else {
          return { key };
        }
      });

      lruCache = createCache<[string], Object>({
        load: loadObject,
        config: {
          getCache: (onEvict) =>
            new SimpleLRUCache(1, (key) => {
              onEvict(key);
              evictFn(key);
            }),
        },
      });
    });

    it("getStatus: should return not-found status if value has been evicted by provided cache", async () => {
      lruCache.cache({ key: "test" }, "test");
      expect(lruCache.getValueIfCached("test")).toEqual({ key: "test" });

      lruCache.cache({ key: "test2" }, "test2");

      expect(evictFn).toHaveBeenCalledTimes(1);

      expect(lruCache.getStatus("test")).toBe(STATUS_NOT_FOUND);
    });

    it("getValue: should throw if previously loaded value has been evicted by provided cache", async () => {
      lruCache.cache({ key: "test" }, "test");
      expect(lruCache.getValueIfCached("test")).toEqual({ key: "test" });

      lruCache.cache({ key: "test2" }, "test2");
      expect(evictFn).toHaveBeenCalledTimes(1);

      expect(() => lruCache.getValue("test")).toThrow();
    });

    it("getValueIfCached: should return undefined if previously loaded value has been evicted by provided cache", async () => {
      lruCache.cache({ key: "test" }, "test");
      expect(lruCache.getValueIfCached("test")).toEqual({ key: "test" });

      lruCache.cache({ key: "test2" }, "test2");
      expect(evictFn).toHaveBeenCalledTimes(1);

      expect(lruCache.getValueIfCached("test")).toBeUndefined();
      expect(lruCache.getStatus("test")).toBe(STATUS_NOT_FOUND);
    });

    it("read: should re-suspend if previously loaded value has been evicted by provided cache", async () => {
      lruCache.cache({ key: "test" }, "test");
      expect(lruCache.getValueIfCached("test")).toEqual({ key: "test" });

      lruCache.cache({ key: "test2" }, "test2");
      expect(evictFn).toHaveBeenCalledTimes(1);

      expect(lruCache.getValueIfCached("test")).toBeUndefined();
      expect(lruCache.getStatus("test")).toBe(STATUS_NOT_FOUND);

      await expect(await fakeSuspend(() => lruCache.read("test"))).toEqual({
        key: "test",
      });
    });

    it("readAsync: should re-suspend if previously loaded value has been collected by provided cacher", async () => {
      lruCache.cache({ key: "test" }, "test");
      expect(lruCache.getValueIfCached("test")).toEqual({ key: "test" });

      lruCache.cache({ key: "test2" }, "test2");
      expect(evictFn).toHaveBeenCalledTimes(1);

      expect(lruCache.getValueIfCached("test")).toBeUndefined();
      expect(lruCache.getStatus("test")).toBe(STATUS_NOT_FOUND);

      await expect(await lruCache.readAsync("test")).toEqual({
        key: "test",
      });
    });
  });

  describe("getCache: WeakRefMap", () => {
    type TestValue = { key: string };
    let gcCache: Cache<[string], TestValue>;
    let loadObject: jest.Mock<
      Promise<TestValue> | TestValue,
      [[string], CacheLoadOptions]
    >;
    let weakRefArray: WeakRefArray<any>;

    beforeEach(() => {
      weakRefArray = mockWeakRef();

      loadObject = jest.fn();
      loadObject.mockImplementation(([key]) => {
        if (key.startsWith("async")) {
          return Promise.resolve({ key });
        } else if (key.startsWith("error")) {
          return Promise.reject(key);
        } else {
          return { key };
        }
      });

      gcCache = createCache({
        load: loadObject,
        config: {
          getCache: (onEvict) => new WeakRefMap(onEvict),
        },
      });
    });

    it("getStatus: should return not-found status if value has been collected", async () => {
      gcCache.cache({ key: "test" }, "test");
      expect(gcCache.getValueIfCached("test")).toEqual({ key: "test" });

      // the cache creates two instances of the WeakRefMap
      // collecting the first one is enough to trigger the onEvict callback
      expect(weakRefArray.length).toBe(2);
      weakRefArray[0]!.collect();

      expect(gcCache.getStatus("test")).toBe(STATUS_NOT_FOUND);
    });

    it("getValue: should throw if previously loaded value has been collected", async () => {
      gcCache.cache({ key: "test" }, "test");
      expect(gcCache.getValueIfCached("test")).toEqual({ key: "test" });

      // the cache creates two instances of the WeakRefMap, which in turn make it so we have two weak refs
      // collecting the first one is enough to trigger the onEvict callback
      expect(weakRefArray.length).toBe(2);
      weakRefArray[0]!.collect();

      expect(() => gcCache.getValue("test")).toThrow("No record found");
    });

    it("getValueIfCached: should return undefined if previously loaded value has been collected", async () => {
      gcCache.cache({ key: "test" }, "test");
      expect(gcCache.getValueIfCached("test")).toEqual({ key: "test" });

      // the cache creates two instances of the WeakRefMap, which in turn make it so we have two weak refs
      // collecting the first one is enough to trigger the onEvict callback
      expect(weakRefArray.length).toBe(2);
      weakRefArray[0]!.collect();

      expect(gcCache.getValueIfCached("test")).toBeUndefined();
    });

    it("read: should re-suspend if previously loaded value has been collected", async () => {
      gcCache.cache({ key: "test" }, "test");
      expect(gcCache.getValueIfCached("test")).toEqual({ key: "test" });

      // the cache creates two instances of the WeakRefMap, which in turn make it so we have two weak refs
      // collecting the first one is enough to trigger the onEvict callback
      expect(weakRefArray.length).toBe(2);
      weakRefArray[0]!.collect();

      expect(gcCache.getValueIfCached("test")).toBeUndefined();

      await expect(await fakeSuspend(() => gcCache.read("test"))).toEqual({
        key: "test",
      });
    });

    it("readAsync: should re-suspend if previously loaded value has been collected", async () => {
      gcCache.cache({ key: "test" }, "test");
      expect(gcCache.getValueIfCached("test")).toEqual({ key: "test" });

      // the cache creates two instances of the WeakRefMap, which in turn make it so we have two weak refs
      // collecting the first one is enough to trigger the onEvict callback
      expect(weakRefArray.length).toBe(2);
      weakRefArray[0]!.collect();

      expect(gcCache.getValueIfCached("test")).toBeUndefined();

      await expect(await gcCache.readAsync("test")).toEqual({
        key: "test",
      });
    });
  });

  describe("development mode", () => {
    it("should warn if a key contains a stringified object", async () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});

      getCacheKey.mockImplementation((string) => `${{ string }}`);

      cache.readAsync("one");

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching("contains a stringified object")
      );

      // Only warn once per cache though
      cache.readAsync("two");
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("logs debug messages to console", () => {
      const consoleMock = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      cache = createCache<[string], string>({
        debugLabel: "test-cache",
        debugLogging: true,
        getKey: getCacheKey,
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
      cache.readAsync("one");
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
      cache.readAsync("two");
      expect(consoleMock).not.toHaveBeenCalled();

      consoleMock.mockClear();
      cache.enableDebugLogging();
      cache.readAsync("three");
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
