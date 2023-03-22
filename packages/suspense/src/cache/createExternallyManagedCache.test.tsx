import { createExternallyManagedCache } from "./createExternallyManagedCache";

describe("createExternallyManagedCache", () => {
  it("should create a cache with a no-op load method", () => {
    const cache = createExternallyManagedCache<[string], string>({
      debugLabel: "cache",
      getKey: ([string]) => string,
    });

    expect(cache.getValueIfCached("test")).toBeUndefined();
    cache.cache("value", "test");
    expect(cache.getValueIfCached("test")).toBe("value");
  });

  describe("timeout", () => {
    it("should reject after the specified timeout", async () => {
      const cache = createExternallyManagedCache<[string], string>({
        debugLabel: "cache",
        getKey: ([string]) => string,
        timeout: 100,
        timeoutMessage: "Custom timeout message",
      });

      const promise = cache.readAsync("test");
      await expect(promise).rejects.toEqual("Custom timeout message");
    });

    it("should resolve if cached before the specified timeout", async () => {
      const cache = createExternallyManagedCache<[string], string>({
        debugLabel: "cache",
        getKey: ([string]) => string,
        timeout: 100,
        timeoutMessage: "Custom timeout message",
      });

      const promise = cache.readAsync("test");

      cache.cache("value", "test");

      await expect(promise).resolves.toEqual("value");
    });
  });
});
