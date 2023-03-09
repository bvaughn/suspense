/**
 * @jest-environment jsdom
 */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { createCache } from "../cache/createCache";
import {
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { Cache, CacheLoadOptions, Deferred, Status } from "../types";
import { createDeferred } from "../utils/createDeferred";
import { mockWeakRef, SimpleLRUCache, WeakRefArray } from "../utils/test";
import { useImperativeCacheValue } from "./useImperativeCacheValue";

type Value = { key: string };

describe("useImperativeCacheValue", () => {
  let cache: Cache<[string], Value>;
  let fetch: jest.Mock<Promise<Value> | Value, [string, CacheLoadOptions]>;

  let lastRenderedError: any = undefined;
  let lastRenderedStatus: Status | undefined = undefined;
  let lastRenderedValue: string | undefined = undefined;

  let pendingDeferred: Deferred<Value>[] = [];

  function Component({ string }: { string: string }): any {
    const result = useImperativeCacheValue(cache, string);

    lastRenderedError = result.error;
    lastRenderedStatus = result.status;
    lastRenderedValue = result.value;

    return null;
  }

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    fetch = jest.fn();
    fetch.mockImplementation(async (key: string) => {
      const deferred = createDeferred<Value>();

      pendingDeferred.push(deferred);

      return deferred;
    });

    cache = createCache<[string], Value>({
      load: fetch,
      config: {
        getCache: (onEviction) => new SimpleLRUCache(1, onEviction),
      },
    });

    lastRenderedStatus = undefined;
    lastRenderedStatus = undefined;
    lastRenderedValue = undefined;

    pendingDeferred = [];
  });

  it("should return values that have already been loaded", async () => {
    cache.cache({ key: "cached" }, "test");

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Component string="test" />);
    });

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toEqual({ key: "cached" });
  });

  it("should fetch values that have not yet been fetched", async () => {
    expect(cache.getStatus("test")).toBe(STATUS_NOT_FOUND);

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Component string="test" />);
    });

    expect(pendingDeferred).toHaveLength(1);
    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => pendingDeferred[0].resolve({ key: "resolved" }));

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toEqual({ key: "resolved" });
  });

  it("should handle values that are rejected", async () => {
    expect(cache.getStatus("test")).toBe(STATUS_NOT_FOUND);

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Component string="test" />);
    });

    expect(pendingDeferred).toHaveLength(1);
    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => pendingDeferred[0].reject("rejected"));

    expect(lastRenderedError).toBe("rejected");
    expect(lastRenderedStatus).toBe(STATUS_REJECTED);
    expect(lastRenderedValue).toBeUndefined();
  });

  it("should wait for values that have already been loaded to be resolved", async () => {
    cache.readAsync("test");
    expect(pendingDeferred).toHaveLength(1);

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Component string="test" />);
    });

    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => pendingDeferred[0].resolve({ key: "resolved" }));

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toEqual({ key: "resolved" });
  });

  it("should wait for values that have already been loaded to be rejected", async () => {
    cache.readAsync("test");
    expect(pendingDeferred).toHaveLength(1);

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Component string="test" />);
    });

    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => pendingDeferred[0].reject("rejected"));

    expect(lastRenderedError).toBe("rejected");
    expect(lastRenderedStatus).toBe(STATUS_REJECTED);
    expect(lastRenderedValue).toBeUndefined();
  });

  describe("getCache", () => {
    let weakRefArray: WeakRefArray<Object>;

    beforeEach(() => {
      weakRefArray = mockWeakRef();
    });

    it("should re-fetch a value that has been evicted by the provided cache", async () => {
      // Pre-cache value
      cache.cache({ key: "test" }, "test");

      // The LRU cache has a max size of 1, so this should evict the previous
      cache.cache({ key: "test-2" }, "test-2");

      // Rendering should trigger a re-fetch
      const container = document.createElement("div");
      const root = createRoot(container);
      await act(async () => {
        root.render(<Component string="test" />);
      });

      expect(lastRenderedError).toBeUndefined();
      expect(lastRenderedStatus).toBe(STATUS_PENDING);
      expect(lastRenderedValue).toBeUndefined();

      expect(pendingDeferred.length).toBe(1);
      await act(async () => pendingDeferred[0].resolve({ key: "resolved" }));

      expect(lastRenderedError).toBeUndefined();
      expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
      expect(lastRenderedValue).toEqual({ key: "resolved" });
    });
  });
});
