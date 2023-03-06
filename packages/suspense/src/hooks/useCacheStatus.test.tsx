/**
 * @jest-environment jsdom
 */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

import {
  STATUS_NOT_STARTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { createCache } from "../cache/createCache";
import { Cache, CacheLoadOptions, Deferred, Status } from "../types";
import { useCacheStatus } from "./useCacheStatus";
import { createDeferred } from "../utils/createDeferred";

describe("useCacheStatus", () => {
  let cache: Cache<[string], string>;
  let fetch: jest.Mock<Promise<string> | string, [string, CacheLoadOptions]>;
  let getCacheKey: jest.Mock<string, [string]>;
  let lastRenderedStatus: Status | undefined = undefined;

  function Component({ string }: { string: string }): any {
    lastRenderedStatus = useCacheStatus(cache, string);
    return lastRenderedStatus as any;
  }

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    fetch = jest.fn();
    fetch.mockImplementation(async (key: string) => {
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

    cache = createCache<[string], string>({
      debugLabel: "cache",
      getKey: getCacheKey,
      load: fetch,
    });

    lastRenderedStatus = undefined;
  });

  it("should return not-started for keys that have not been loaded", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="test" />);
    });

    expect(lastRenderedStatus).toBe(STATUS_NOT_STARTED);
  });

  it("should transition from pending to resolved", async () => {
    const promise = cache.readAsync("async");

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="async" />);
    });
    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => await promise);

    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
  });

  it("should transition from pending to rejected", async () => {
    const promise = cache.readAsync("error");

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="error" />);
    });
    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => {
      try {
        await promise;
      } catch (error) {}
    });

    expect(lastRenderedStatus).toBe(STATUS_REJECTED);
  });

  it("should return resolved for keys that have already been loaded", async () => {
    const promise = cache.readAsync("sync");
    await promise;

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="sync" />);
    });
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
  });

  it("should return rejected for keys that have already failed", async () => {
    try {
      await cache.readAsync("error");
    } catch (error) {}

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="error" />);
    });
    expect(lastRenderedStatus).toBe(STATUS_REJECTED);
  });

  it("should update in response to an aborted request", async () => {
    let abortSignal: AbortSignal | null = null;
    let deferred: Deferred<string> | null = null;
    fetch.mockImplementation(async (...args) => {
      abortSignal = args[1].signal;
      deferred = createDeferred();
      return deferred;
    });

    cache.readAsync("async");
    expect(cache.getStatus("async")).toBe(STATUS_PENDING);

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="async" />);
    });

    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    act(() => {
      expect(cache.abort("async")).toBe(true);
    });
    expect(abortSignal.aborted).toBe(true);

    await Promise.resolve();

    expect(lastRenderedStatus).toBe(STATUS_NOT_STARTED);
  });
});
