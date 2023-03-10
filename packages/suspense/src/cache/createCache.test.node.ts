import { createCache } from "./createCache";
import { Cache, CacheLoadOptions } from "../types";
import { requestGC, waitForGC } from "../utils/test";

describe("createCache", () => {
  let cache: Cache<[string], Object>;
  let fetch: jest.Mock<Promise<Object> | Object, [[string], CacheLoadOptions]>;

  beforeEach(() => {
    fetch = jest.fn();
    fetch.mockImplementation(([key]) => {
      if (key.startsWith("async")) {
        return Promise.resolve(createObject(key));
      } else if (key.startsWith("error")) {
        return Promise.reject(key);
      } else {
        return createObject(key);
      }
    });
  });

  it("should use WeakRefs if requested", async () => {
    cache = createCache<[string], Object>({
      config: { useWeakRef: true },
      load: fetch,
    });

    const retainedObject = createObject();

    cache.cache(createObject(), "one");
    cache.cache(retainedObject, "two");
    cache.cache(createObject(), "three");

    expect(cache.getValueIfCached("one")).not.toBeUndefined();
    expect(cache.getValueIfCached("two")).not.toBeUndefined();
    expect(cache.getValueIfCached("three")).not.toBeUndefined();

    await requestGC();
    await waitForGC();

    expect(cache.getValueIfCached("one")).toBeUndefined();
    expect(cache.getValueIfCached("two")).not.toBeUndefined();
    expect(cache.getValueIfCached("three")).toBeUndefined();
  });

  it("should not use WeakRefs if requested", async () => {
    cache = createCache<[string], Object>({
      config: { useWeakRef: false },
      load: fetch,
    });

    cache.cache(createObject(), "one");
    cache.cache(createObject(), "two");

    expect(cache.getValueIfCached("one")).not.toBeUndefined();
    expect(cache.getValueIfCached("two")).not.toBeUndefined();

    await requestGC();
    await waitForGC();

    expect(cache.getValueIfCached("one")).not.toBeUndefined();
    expect(cache.getValueIfCached("two")).not.toBeUndefined();
  });

  it("should re-suspend if read after GK", async () => {
    cache = createCache<[string], Object>({
      config: { useWeakRef: true },
      load: fetch,
    });

    cache.cache(createObject("one"), "one");
    expect(cache.getValueIfCached("one")).toEqual({ label: "one" });

    await requestGC();
    await waitForGC();

    expect(cache.getValueIfCached("one")).toBeUndefined();

    let value = await cache.readAsync("one");
    expect(value).toEqual({ label: "one" });
  });
});

function createObject(label: string = "object"): Object {
  return { label };
}
