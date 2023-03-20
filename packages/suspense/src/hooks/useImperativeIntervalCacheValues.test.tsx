/**
 * @jest-environment jsdom
 */

import { Component, PropsWithChildren } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { createCache } from "../cache/createCache";
import { createIntervalCache } from "../cache/createIntervalCache";
import {
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import {
  CacheLoadOptions,
  Deferred,
  IntervalCache,
  IntervalCacheLoadOptions,
  Status,
} from "../types";
import { createDeferred } from "../utils/createDeferred";
import { isPromiseLike } from "../utils/isPromiseLike";
import { SimpleLRUCache } from "../utils/test";

import { useImperativeIntervalCacheValues } from "./useImperativeIntervalCacheValues";

type Value = { key: string };

function createContiguousArray(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getPointForValue(value: number) {
  return value;
}

describe("useImperativeIntervalCacheValues", () => {
  let cache: IntervalCache<number, [id: string], number>;
  let load: jest.Mock<
    number[] | PromiseLike<number[]>,
    [start: number, end: number, id: string, options: IntervalCacheLoadOptions]
  >;

  let container: HTMLDivElement | null = null;
  let lastRenderedError: any = undefined;
  let lastRenderedStatus: Status | undefined = undefined;
  let lastRenderedValue: string | undefined = undefined;

  let pendingDeferred: Deferred<number[]>[] = [];

  function Component({
    cacheKey,
    end,
    start,
  }: {
    cacheKey: string;
    end: number;
    start: number;
  }): any {
    const result = useImperativeIntervalCacheValues(
      cache,
      start,
      end,
      cacheKey
    );

    lastRenderedError = result.error;
    lastRenderedStatus = result.status;
    lastRenderedValue = result.value;

    return null;
  }

  async function mount({ end, start }: { end: number; start: number }) {
    container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <>
          <ErrorBoundary>
            <Component cacheKey="test" end={end} start={start} />
          </ErrorBoundary>
        </>
      );
    });
  }

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    load = jest.fn();
    load.mockImplementation(
      async (start: number, end: number, text: string) => {
        const deferred = createDeferred<number[]>();

        pendingDeferred.push(deferred);

        return deferred.promise;
      }
    );

    cache = createIntervalCache<number, [id: string], number>({
      getPointForValue,
      load,
    });

    lastRenderedStatus = undefined;
    lastRenderedStatus = undefined;
    lastRenderedValue = undefined;

    pendingDeferred = [];
  });

  it("should return values that have already been loaded", async () => {
    load.mockReturnValue(createContiguousArray(2, 4));

    await cache.readAsync(2, 4, "test");
    await mount({ end: 4, start: 2 });

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toEqual(createContiguousArray(2, 4));
  });

  it("should fetch values that have not yet been fetched", async () => {
    expect(cache.getStatus(1, 5, "test")).toBe(STATUS_NOT_FOUND);

    await mount({ end: 5, start: 1 });

    expect(pendingDeferred).toHaveLength(1);
    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () =>
      pendingDeferred[0].resolve(createContiguousArray(1, 5))
    );

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toEqual(createContiguousArray(1, 5));
  });

  it("should handle values that are rejected", async () => {
    expect(cache.getStatus(1, 2, "test")).toBe(STATUS_NOT_FOUND);

    await mount({ end: 2, start: 1 });

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
    cache.readAsync(5, 8, "test");
    expect(pendingDeferred).toHaveLength(1);

    await mount({ end: 8, start: 5 });

    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () =>
      pendingDeferred[0].resolve(createContiguousArray(5, 8))
    );

    expect(lastRenderedError).toBeUndefined();
    expect(lastRenderedStatus).toBe(STATUS_RESOLVED);
    expect(lastRenderedValue).toEqual(createContiguousArray(5, 8));
  });

  it("should wait for values that have already been loaded to be rejected", async () => {
    cache.readAsync(1, 2, "test");

    expect(pendingDeferred).toHaveLength(1);

    await mount({ end: 2, start: 1 });

    expect(lastRenderedStatus).toBe(STATUS_PENDING);

    await act(async () => {
      const deferred = pendingDeferred[0];
      deferred.reject("rejected");
    });

    expect(lastRenderedError).toBe("rejected");
    expect(lastRenderedStatus).toBe(STATUS_REJECTED);
    expect(lastRenderedValue).toBeUndefined();
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
