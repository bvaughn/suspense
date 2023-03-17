/**
 * @jest-environment jsdom
 */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

import {
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { createDeferred } from "../utils/createDeferred";
import { createIntervalCache } from "../cache/createIntervalCache";
import {
  Deferred,
  IntervalCache,
  IntervalCacheLoadOptions,
  Status,
} from "../types";
import { useIntervalCacheStatus } from "./useIntervalCacheStatus";

function createContiguousArray(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getPointForValue(value: number) {
  return value;
}

describe("useIntervalCacheStatus", () => {
  let cache: IntervalCache<number, [id: string], number>;
  let load: jest.Mock<
    PromiseLike<number[]>,
    [start: number, end: number, id: string, options: IntervalCacheLoadOptions]
  >;
  let lastRenderedStatus: Status | undefined = undefined;

  function Component({
    end,
    start,
    string,
  }: {
    end: number;
    start: number;
    string: string;
  }): any {
    lastRenderedStatus = useIntervalCacheStatus(cache, start, end, string);

    return lastRenderedStatus as any;
  }

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    load = jest.fn();
    load.mockImplementation(async (start: number, end: number) => {
      return createContiguousArray(start, end);
    });

    cache = createIntervalCache<number, [id: string], number>({
      getPointForValue,
      load,
    });

    lastRenderedStatus = undefined;
  });

  it("should return not-found for keys that have not been loaded", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component start={1} end={10} string="test" />);
    });

    expect(lastRenderedStatus).toBe(STATUS_NOT_FOUND);
  });

  it("should transition from pending to resolved", async () => {
    const promise = cache.readAsync(1, 5, "test");

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component start={1} end={5} string="test" />);
    });

    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => await promise);

    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
  });

  it("should transition from pending to rejected", async () => {
    const deferred = createDeferred<number[]>();
    load.mockReturnValueOnce(deferred.promise);

    const promise = cache.readAsync(1, 5, "test");

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component start={1} end={5} string="test" />);
    });

    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => deferred.reject(new Error("Expected")));
    await expect(() => promise).rejects.toThrow("Expected");

    expect(lastRenderedStatus).toBe(STATUS_REJECTED);
  });

  it("should return resolved for keys that have already been loaded", async () => {
    await cache.readAsync(1, 5, "test");

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component start={1} end={5} string="test" />);
    });

    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
  });

  it("should return rejected for keys that have already failed", async () => {
    const deferred = createDeferred<number[]>();
    load.mockReturnValueOnce(deferred.promise);

    const promise = cache.readAsync(1, 5, "error");

    deferred.reject(new Error("Expected"));
    await expect(() => promise).rejects.toThrow("Expected");

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component start={1} end={5} string="error" />);
    });

    expect(lastRenderedStatus).toBe(STATUS_REJECTED);
  });

  it("should update in response to an aborted request", async () => {
    let abortSignal: AbortSignal | undefined;
    let deferred: Deferred<number[]> | undefined;
    load.mockImplementation(async (start, end, id, options) => {
      abortSignal = options.signal;
      deferred = createDeferred();
      return deferred.promise;
    });

    cache.readAsync(1, 5, "async");
    expect(cache.getStatus(1, 5, "async")).toBe(STATUS_PENDING);

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component start={1} end={5} string="async" />);
    });

    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    act(() => {
      expect(cache.abort("async")).toBe(true);
    });

    expect(abortSignal?.aborted).toBe(true);
    await Promise.resolve();
    expect(lastRenderedStatus).toBe(STATUS_NOT_FOUND);
  });
});
