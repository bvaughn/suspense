import { describe, beforeEach, expect, it, vi, Mock } from "vitest";
import { createSingleEntryCache } from "./createSingleEntryCache";
import { Cache, CacheLoadOptions } from "../types";
import { isPromiseLike } from "../utils/isPromiseLike";

// Minimal testing of this cache is okay since it's just a wrapper around createCache.
describe("createSingleEntryCache", () => {
  let cache: Cache<[], string>;
  let load: Mock<
    (_: [], options: CacheLoadOptions) => Promise<string> | string
  >;

  beforeEach(() => {
    load = vi.fn();
    load.mockImplementation(() => Promise.resolve("value"));

    cache = createSingleEntryCache<[], string>({ load });
  });

  it("should throw if a getKey function is provided", () => {
    expect(() => {
      const options = {
        load,
        getKey: () => "test",
      };
      createSingleEntryCache(options);
    }).toThrowError();
  });

  describe("cache", () => {
    it("should cache and return pre-fetched value without reloading", () => {
      cache.cache("cached value");

      expect(cache.getValueIfCached()).toEqual("cached value");

      expect(load).not.toHaveBeenCalled();
    });
  });

  describe("evict", () => {
    it("should event cached items", () => {
      cache.cache("cached value");

      expect(cache.getValueIfCached()).toEqual("cached value");

      expect(load).not.toHaveBeenCalled();

      cache.evict();

      expect(cache.getValueIfCached()).toEqual(undefined);
    });
  });

  describe("readAsync", () => {
    it("should return async values", async () => {
      const thenable = cache.readAsync();

      expect(isPromiseLike(thenable)).toBe(true);

      await expect(await thenable).toBe("value");
    });

    it("should return sync values", () => {
      load.mockReturnValue("sync");

      expect(cache.readAsync()).toBe("sync");
    });

    it("should only load the value once", () => {
      load.mockReturnValue("sync");

      expect(cache.readAsync()).toBe("sync");
      expect(cache.readAsync()).toBe("sync");

      expect(load).toHaveBeenCalledTimes(1);
    });
  });
});
