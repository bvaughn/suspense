/**
 * @jest-environment jsdom
 */

import { Component, PropsWithChildren } from "react";
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
import { isPromiseLike } from "../utils/isPromiseLike";
import { mockWeakRef, WeakRefArray } from "../utils/test";
import { useImperativeCacheValue } from "./useImperativeCacheValue";

type Value = { key: string };

describe("useImperativeCacheValue", () => {
  let cache: Cache<[string], Value>;
  let fetch: jest.Mock<Promise<Value> | Value, [[string], CacheLoadOptions]>;

  let container: HTMLDivElement | null = null;
  let lastRenderedError: any = undefined;
  let lastRenderedStatus: Status | undefined = undefined;
  let lastRenderedValue: string | undefined = undefined;

  let pendingDeferred: Deferred<Value>[] = [];

  function Component({ cacheKey }: { cacheKey: string }): any {
    const result = useImperativeCacheValue(cache, cacheKey);

    lastRenderedError = result.error;
    lastRenderedStatus = result.status;
    lastRenderedValue = result.value;

    return null;
  }
  async function mount() {
    container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <>
          <ErrorBoundary>
            <Component cacheKey="test" />
          </ErrorBoundary>
        </>
      );
    });
  }

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    fetch = jest.fn();
    fetch.mockImplementation(async ([key]) => {
      const deferred = createDeferred<Value>();

      pendingDeferred.push(deferred);

      return deferred.promise;
    });

    container = null;

    cache = createCache<[string], Value>({
      load: fetch,
    });

    lastRenderedStatus = undefined;
    lastRenderedStatus = undefined;
    lastRenderedValue = undefined;

    pendingDeferred = [];
  });

  it("should return values that have already been loaded", async () => {
    cache.cache({ key: "cached" }, "test");

    await mount();

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toEqual({ key: "cached" });
  });

  it("should fetch values that have not yet been fetched", async () => {
    expect(cache.getStatus("test")).toBe(STATUS_NOT_FOUND);

    await mount();

    expect(pendingDeferred).toHaveLength(1);
    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => pendingDeferred[0].resolve({ key: "resolved" }));

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toEqual({ key: "resolved" });
  });

  it("should handle values that are rejected", async () => {
    expect(cache.getStatus("test")).toBe(STATUS_NOT_FOUND);

    await mount();

    expect(pendingDeferred).toHaveLength(1);
    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => {
      try {
        const deferred = pendingDeferred[0];
        deferred.reject(new Error("rejected"));

        await deferred.promise;
      } catch (error) {}
    });

    expect(lastRenderedError?.message).toBe("rejected");
    expect(lastRenderedStatus).toBe(STATUS_REJECTED);
    expect(lastRenderedValue).toBeUndefined();
  });

  it("should wait for values that have already been loaded to be resolved", async () => {
    cache.readAsync("test");
    expect(pendingDeferred).toHaveLength(1);

    await mount();

    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => pendingDeferred[0].resolve({ key: "resolved" }));

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toEqual({ key: "resolved" });
  });

  it("should wait for values that have already been loaded to be rejected", async () => {
    const value = cache.readAsync("test");
    if (isPromiseLike(value)) {
      value.then(
        () => {},
        () => {}
      );
    }

    expect(pendingDeferred).toHaveLength(1);

    await mount();

    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => {
      const deferred = pendingDeferred[0];
      deferred.reject("rejected");
    });

    expect(lastRenderedError).toBe("rejected");
    expect(lastRenderedStatus).toBe(STATUS_REJECTED);
    expect(lastRenderedValue).toBeUndefined();
  });

  describe("garbage collection", () => {
    let weakRefArray: WeakRefArray<Object>;

    beforeEach(() => {
      weakRefArray = mockWeakRef();
    });

    it("should re-fetch a value that has been garbage collected", async () => {
      // Pre-cache value
      cache.cache({ key: "test" }, "test");

      // Then garbage collect it
      expect(weakRefArray.length).toBe(1);
      weakRefArray[0].collect();

      // Rendering should trigger a re-fetch
      await mount();

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

type State = { errorMessage: string | null };
class ErrorBoundary extends Component<PropsWithChildren> {
  state: State = { errorMessage: null };
  static getDerivedStateFromError(error: any): State {
    return { errorMessage: typeof error === "string" ? error : error.message };
  }
  render() {
    if (this.state.errorMessage) {
      return this.state.errorMessage;
    }

    return this.props.children;
  }
}
