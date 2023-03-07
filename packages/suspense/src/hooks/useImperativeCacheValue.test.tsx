/**
 * @jest-environment jsdom
 */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { createCache } from "../cache/createCache";
import {
  STATUS_NOT_STARTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { Cache, CacheLoadOptions, Deferred, Status } from "../types";
import { createDeferred } from "../utils/createDeferred";
import { useImperativeCacheValue } from "./useImperativeCacheValue";

describe("useImperativeCacheValue", () => {
  let cache: Cache<[string], string>;
  let fetch: jest.Mock<Promise<string> | string, [string, CacheLoadOptions]>;
  let getCacheKey: jest.Mock<string, [string]>;
  let lastRenderedError: any = undefined;
  let lastRenderedStatus: Status | undefined = undefined;
  let lastRenderedValue: string | undefined = undefined;
  let pendingDeferred: Deferred<string>[] = [];

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
      const deferred = createDeferred<string>();

      pendingDeferred.push(deferred);

      return deferred;
    });

    getCacheKey = jest.fn();
    getCacheKey.mockImplementation((key) => key.toString());

    cache = createCache<[string], string>({
      debugLabel: "cache",
      getKey: getCacheKey,
      load: fetch,
    });

    lastRenderedStatus = undefined;
    lastRenderedStatus = undefined;
    lastRenderedValue = undefined;
    pendingDeferred = [];
  });

  it("should return values that have already been loaded", async () => {
    cache.cache("cached", "test");

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Component string="test" />);
    });

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toBe("cached");
  });

  it("should fetch values that have not yet been fetched", async () => {
    expect(cache.getStatus("test")).toBe(STATUS_NOT_STARTED);

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(<Component string="test" />);
    });

    expect(pendingDeferred).toHaveLength(1);
    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => pendingDeferred[0].resolve("resolved"));

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toBe("resolved");
  });

  it("should handle values that are rejected", async () => {
    expect(cache.getStatus("test")).toBe(STATUS_NOT_STARTED);

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

    await act(async () => pendingDeferred[0].resolve("resolved"));

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toBe("resolved");
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
});
