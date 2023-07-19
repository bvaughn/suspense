/**
 * @jest-environment jsdom
 */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { createStreamingCache } from "../cache/createStreamingCache";
import {
  STATUS_ABORTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import {
  StreamingCache,
  StreamingCacheLoadOptions,
  StreamingValue,
} from "../types";
import { StreamingValuePartial, useStreamingValue } from "./useStreamingValue";

describe("useStreamingValue", () => {
  let lastRendered: StreamingValuePartial<any, any> | undefined = undefined;

  function Component({
    simulateRenderDuration = 0,
    streaming,
    throttleUpdatesBy,
  }: {
    simulateRenderDuration?: number;
    streaming: StreamingValue<any, any>;
    throttleUpdatesBy?: number;
  }): any {
    lastRendered = useStreamingValue(streaming, {
      throttleUpdatesBy,
    });

    if (simulateRenderDuration > 0) {
      jest.advanceTimersByTime(simulateRenderDuration);
    }

    return null;
  }

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    jest.useFakeTimers();
  });

  describe("single value (string)", () => {
    type Metadata = { length: number };
    type Value = string;

    let cache: StreamingCache<[string], Value, Metadata>;
    let optionsMap: Map<string, StreamingCacheLoadOptions<Value, Metadata>>;

    beforeEach(() => {
      optionsMap = new Map();

      cache = createStreamingCache({
        load: (options, key) => {
          optionsMap.set(key, options);
        },
      });
    });

    it("should re-render as data streams in", () => {
      const streaming = cache.stream("test");

      const container = document.createElement("div");
      const root = createRoot(container);
      act(() => {
        root.render(<Component streaming={streaming} throttleUpdatesBy={10} />);
      });

      expect(lastRendered?.value).toEqual(undefined);

      const options = optionsMap.get("test")!;
      act(() => {
        options.update("ab", 0.5, { length: 4 });
      });
      expect(lastRendered).toEqual({
        complete: false,
        data: { length: 4 },
        progress: 0.5,
        status: STATUS_PENDING,
        value: "ab",
      });

      act(() => {
        options.update("abcd", 1);
        options.resolve();

        jest.advanceTimersByTime(10);
      });

      expect(lastRendered).toEqual({
        complete: true,
        data: { length: 4 },
        progress: 1,
        status: STATUS_RESOLVED,
        value: "abcd",
      });
    });
  });

  describe("array of values (number)", () => {
    let cache: StreamingCache<[string], number[]>;
    let optionsMap: Map<string, StreamingCacheLoadOptions<number[], any>>;

    beforeEach(() => {
      optionsMap = new Map();

      cache = createStreamingCache({
        load: (options, key) => {
          optionsMap.set(key, options);
        },
      });
    });

    it("should re-render as values stream in", () => {
      const streaming = cache.stream("test");

      const container = document.createElement("div");
      const root = createRoot(container);
      act(() => {
        root.render(<Component streaming={streaming} throttleUpdatesBy={10} />);
      });

      expect(lastRendered?.value).toEqual(undefined);

      const options = optionsMap.get("test")!;
      act(() => {
        options.update([1, 2], 0.5);
      });
      expect(lastRendered).toEqual({
        complete: false,
        data: undefined,
        progress: 0.5,
        status: STATUS_PENDING,
        value: [1, 2],
      });

      act(() => {
        options.update([1, 2, 3, 4], 1);
        options.resolve();

        jest.advanceTimersByTime(10);
      });

      expect(lastRendered).toEqual({
        complete: true,
        data: undefined,
        progress: 1,
        status: STATUS_RESOLVED,
        value: [1, 2, 3, 4],
      });
    });

    it("should throttle updates to avoid overwhelming React's scheduler", () => {
      const streaming = cache.stream("test");

      const container = document.createElement("div");
      const root = createRoot(container);

      // Simulate a render that takes longer than the throttle-by duration.
      // This ensures that the throttling respects commit boundaries
      // to avoid overwhelming the scheduler.
      act(() => {
        root.render(
          <Component
            simulateRenderDuration={500}
            streaming={streaming}
            throttleUpdatesBy={100}
          />
        );
      });

      expect(lastRendered?.value).toEqual(undefined);

      const options = optionsMap.get("test")!;
      act(() => {
        options.update([1], 0.25);
      });
      expect(lastRendered?.value).toEqual([1]);

      act(() => {
        options.update([1, 2], 0.5);
      });
      expect(lastRendered?.value).toEqual([1]);

      jest.advanceTimersByTime(50);

      act(() => {
        options.update([1, 2, 3], 0.75);
      });
      expect(lastRendered?.value).toEqual([1]);

      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(lastRendered?.value).toEqual([1, 2, 3]);
    });

    it("should update in response to an aborted request", async () => {
      const streaming = cache.stream("test");

      const container = document.createElement("div");
      const root = createRoot(container);
      act(() => {
        root.render(<Component streaming={streaming} />);
      });
      expect(lastRendered?.status).toEqual(STATUS_PENDING);

      act(() => {
        cache.abort("test");
      });

      jest.runAllTimers();

      expect(lastRendered?.status).toEqual(STATUS_ABORTED);
    });
  });

  it("should return an error if the underlying cache is rejected", async () => {
    let options: StreamingCacheLoadOptions<string> | null = null;
    const cache = createStreamingCache<[string], string>({
      load: (...args) => {
        options = args[0];
      },
    });

    const streaming = cache.stream("test");

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component streaming={streaming} />);
    });
    expect(lastRendered?.status).toEqual(STATUS_PENDING);

    act(() => options?.reject("failure"));

    expect(lastRendered?.error).toEqual("failure");
    expect(lastRendered?.status).toEqual(STATUS_REJECTED);
  });
});
