/**
 * @jest-environment jsdom
 */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "./constants";
import { createCache } from "./createCache";
import { Cache, Status } from "./types";
import { useCacheStatus } from "./useCacheStatus";

describe("useCacheStatus", () => {
  let cache: Cache<[string], string>;
  let fetch: jest.Mock<Promise<string> | string, [string]>;
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

    cache = createCache<[string], string>(getCacheKey, fetch, "cache");

    lastRenderedStatus = undefined;
  });

  it("should return undefined for keys that have not been loaded", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="test" />);
    });

    expect(lastRenderedStatus).toBe(undefined);
  });

  it("should transition from pending to resolved", async () => {
    const promise = cache.fetchAsync("async");

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
    const promise = cache.fetchAsync("error");

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
    const promise = cache.fetchAsync("sync");
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
      await cache.fetchAsync("error");
    } catch (error) {}

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="error" />);
    });
    expect(lastRenderedStatus).toBe(STATUS_REJECTED);
  });
});
