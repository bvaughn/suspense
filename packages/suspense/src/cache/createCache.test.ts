import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "../constants";
import { createCache } from "./createCache";
import { Cache } from "../types";
import { isThenable } from "../utils/isThenable";

describe("createCache", () => {
  let cache: Cache<[string], string>;
  let fetch: jest.Mock<Promise<string> | string, [string]>;
  let getCacheKey: jest.Mock<string, [string]>;

  beforeEach(() => {
    fetch = jest.fn();
    fetch.mockImplementation((key: string) => {
      if (key.startsWith("async")) {
        return Promise.resolve(key);
      } else if (key.startsWith("error")) {
        return Promise.reject(key);
      } else {
        return key;
      }
    });

    getCacheKey = jest.fn();
    getCacheKey.mockImplementation((key) => key.toString());

    cache = createCache<[string], string>(fetch, getCacheKey, "cache");
  });

  it("should supply a working default getCacheKey if none is provided", () => {
    const cache = createCache<[string, number, boolean], string>(fetch);
    cache.cache("foo", "string", 123, true);
    cache.cache("bar", "other string", 456, false);

    expect(cache.getValueIfCached("string", 123, true)).toEqual("foo");
    expect(cache.getValueIfCached("other string", 456, false)).toEqual("bar");
  });

  describe("cache", () => {
    it("should cache and return pre-fetched values without reloading", () => {
      cache.cache("SYNC", "sync-1");
      cache.cache("ASYNC", "async-1");

      expect(cache.getValueIfCached("sync-1")).toEqual("SYNC");
      expect(cache.getValueIfCached("async-1")).toEqual("ASYNC");

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("evict", () => {
    it("should event cached items", () => {
      cache.cache("VALUE 1", "sync-1");
      cache.cache("VALUE 2", "sync-2");

      expect(cache.getValueIfCached("sync-1")).toEqual("VALUE 1");
      expect(cache.getValueIfCached("sync-2")).toEqual("VALUE 2");

      expect(fetch).not.toHaveBeenCalled();

      cache.evict("sync-1");

      expect(cache.getValueIfCached("sync-1")).toEqual(undefined);
      expect(cache.getValueIfCached("sync-2")).toEqual("VALUE 2");
    });

    it("should refectch requested items after eviction", () => {
      cache.cache("VALUE", "sync");
      cache.evict("sync");

      expect(fetch).not.toHaveBeenCalled();

      cache.fetchAsync("sync");

      expect(fetch).toHaveBeenCalled();
    });
  });

  describe("getStatus", () => {
    it("should return undefined for keys that have not been loaded", () => {
      expect(cache.getStatus("nope")).toBeUndefined();
    });

    it("should transition from pending to resolved", async () => {
      const willResolve = cache.fetchAsync("async");

      expect(cache.getStatus("async")).toBe(STATUS_PENDING);

      await willResolve;

      expect(cache.getStatus("async")).toBe(STATUS_RESOLVED);
    });

    it("should transition from pending to rejected", async () => {
      fetch.mockReturnValue(Promise.reject("Expected"));

      const willReject = cache.fetchAsync("error");

      expect(cache.getStatus("error")).toBe(STATUS_PENDING);

      try {
        await willReject;
      } catch (error) {}

      expect(cache.getStatus("error")).toBe(STATUS_REJECTED);
    });

    it("should return resolved or rejected for keys that have already been loaded", async () => {
      const willResolve = cache.fetchAsync("sync");
      await willResolve;
      expect(cache.getStatus("sync")).toBe(STATUS_RESOLVED);

      const willReject = cache.fetchAsync("error");
      try {
        await willReject;
      } catch (error) {}
      expect(cache.getStatus("error")).toBe(STATUS_REJECTED);
    });
  });

  describe("fetchAsync", () => {
    it("should return async values", async () => {
      const thenable = cache.fetchAsync("async");

      expect(isThenable(thenable)).toBe(true);

      await expect(await thenable).toBe("async");
    });

    it("should return sync values", () => {
      expect(cache.fetchAsync("sync")).toBe("sync");
    });

    it("should only load the same value once (per key)", () => {
      expect(cache.fetchAsync("sync")).toBe("sync");
      expect(cache.fetchAsync("sync")).toBe("sync");

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("getValue", () => {
    it("it should return a value if cached", () => {
      cache.fetchAsync("sync");
      expect(cache.getValue("sync")).toEqual("sync");
    });

    it("it should throw if value is not cached", () => {
      expect(() => cache.getValue("sync")).toThrow("No record found");
    });

    it("it should throw if value is pending", () => {
      cache.fetchAsync("async");
      expect(() => cache.getValue("async")).toThrow(
        'Record found with status "pending"'
      );
    });

    it("it should throw if value was rejected", async () => {
      cache.fetchAsync("error");
      await Promise.resolve();
      expect(() => cache.getValue("error")).toThrow(
        'Record found with status "rejected"'
      );
    });
  });

  describe("getValueIfCached", () => {
    it("should return undefined for values not yet loaded", () => {
      expect(cache.getValueIfCached("sync")).toBeUndefined();
    });

    it("should not trigger a fetch", () => {
      expect(cache.getValueIfCached("sync")).toBeUndefined();
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should return undefined for values that are pending", () => {
      cache.fetchAsync("async");
      expect(cache.getValueIfCached("async")).toBeUndefined();
    });

    it("should return a cached value for values that have resolved", () => {
      cache.fetchAsync("sync");
      expect(cache.getValueIfCached("sync")).toEqual("sync");
    });

    it("should return undefined for values that have rejected", async () => {
      cache.fetchAsync("error");
      await Promise.resolve();
      expect(cache.getValueIfCached("async")).toBeUndefined();
    });
  });

  describe("fetchSuspense", () => {
    it("should suspend on async values", async () => {
      try {
        cache.fetchSuspense("async");

        throw new Error("should have suspended");
      } catch (thenable) {
        expect(isThenable(thenable)).toBe(true);

        await thenable;

        expect(cache.fetchSuspense("async")).toBe("async");
      }
    });

    it("should not suspend on sync values", () => {
      expect(cache.fetchSuspense("sync")).toBe("sync");
    });

    it("should only fetch the same value once (per key)", () => {
      expect(cache.fetchSuspense("sync")).toBe("sync");
      expect(cache.fetchSuspense("sync")).toBe("sync");

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("prefetch", () => {
    // TODO
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
      expect(callbackA).toHaveBeenCalledWith(undefined);

      await Promise.resolve();

      expect(callbackA).toHaveBeenCalledTimes(1);
    });

    it("should notify of the transition from undefined to resolved for synchronous caches", async () => {
      cache.subscribeToStatus(callbackA, "sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(undefined);

      cache.fetchAsync("sync");

      expect(callbackA).toHaveBeenCalledTimes(3);
      expect(callbackA).toHaveBeenCalledWith(STATUS_PENDING);
      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should notify of the transition from undefined to from pending to resolved for async caches", async () => {
      cache.subscribeToStatus(callbackA, "async");

      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackA).toHaveBeenCalledWith(undefined);

      const thenable = cache.fetchAsync("async");

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
      expect(callbackA).toHaveBeenCalledWith(undefined);

      expect(callbackB).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledWith(undefined);

      cache.fetchAsync("sync");

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
      expect(callbackA).toHaveBeenCalledWith(undefined);

      unsubscribe();

      cache.fetchAsync("sync");

      expect(callbackA).toHaveBeenCalledTimes(1);
    });

    it("should track subscribers separately, per key", async () => {
      cache.subscribeToStatus(callbackA, "sync-1");
      cache.subscribeToStatus(callbackB, "sync-2");

      callbackA.mockReset();
      callbackB.mockReset();

      cache.fetchAsync("sync-2");

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledTimes(2);
    });

    it("should track unsubscriptions separately, per key", async () => {
      const unsubscribeA = cache.subscribeToStatus(callbackA, "sync-1");
      cache.subscribeToStatus(callbackB, "sync-2");

      callbackA.mockReset();
      callbackB.mockReset();

      unsubscribeA();

      cache.fetchAsync("sync-1");
      cache.fetchAsync("sync-2");

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).toHaveBeenCalledTimes(2);
    });

    it("should return the correct value for keys that have already been resolved or rejected", async () => {
      cache.fetchAsync("async");
      cache.fetchAsync("error");

      await Promise.resolve();

      cache.subscribeToStatus(callbackA, "async");
      cache.subscribeToStatus(callbackB, "error");

      expect(callbackA).toHaveBeenCalledWith(STATUS_RESOLVED);
      expect(callbackB).toHaveBeenCalledWith(STATUS_REJECTED);
    });
  });
});
