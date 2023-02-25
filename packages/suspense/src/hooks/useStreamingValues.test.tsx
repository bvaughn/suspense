/**
 * @jest-environment jsdom
 */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { createStreamingCache } from "../cache/createStreamingCache";
import { STATUS_ABORTED, STATUS_PENDING, STATUS_RESOLVED } from "../constants";
import {
  StreamingCache,
  StreamingCacheLoadOptions,
  StreamingValues,
} from "../types";
import {
  StreamingValuesPartial,
  useStreamingValues,
} from "./useStreamingValues";

describe("useStreamingValue", () => {
  let cache: StreamingCache<[string], string>;
  let optionsMap: Map<string, StreamingCacheLoadOptions<string, any>>;
  let lastRendered: StreamingValuesPartial<string, undefined> | undefined =
    undefined;

  function Component({
    streaming,
    throttleUpdatesBy,
  }: {
    streaming: StreamingValues<string>;
    throttleUpdatesBy?: number;
  }): any {
    lastRendered = useStreamingValues(streaming, {
      throttleUpdatesBy,
    });
    return null;
  }

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    jest.useFakeTimers();

    optionsMap = new Map();

    cache = createStreamingCache((options, key) => {
      optionsMap.set(key, options);
    });
  });

  it("should re-render as values stream in", () => {
    const streaming = cache.stream("test");

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component streaming={streaming} throttleUpdatesBy={0} />);
    });

    expect(lastRendered?.values).toEqual(undefined);

    const options = optionsMap.get("test")!;
    act(() => {
      options.update(["a", "b"], 0.5);
    });
    expect(lastRendered).toEqual({
      complete: false,
      data: undefined,
      progress: 0.5,
      status: STATUS_PENDING,
      values: ["a", "b"],
    });

    act(() => {
      options.update(["c", "d"], 1);
      options.resolve();
    });
    expect(lastRendered).toEqual({
      complete: true,
      data: undefined,
      progress: 1,
      status: STATUS_RESOLVED,
      values: ["a", "b", "c", "d"],
    });
  });

  it("should throttle updates to avoid overwhelming React's scheduler", () => {
    const streaming = cache.stream("test");

    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(
        <Component streaming={streaming} throttleUpdatesBy={1_000} />
      );
    });

    expect(lastRendered?.values).toEqual(undefined);

    const options = optionsMap.get("test")!;
    act(() => {
      options.update(["a"], 0.25);
    });
    expect(lastRendered.values).toEqual(["a"]);

    act(() => {
      options.update(["b"], 0.5);
    });
    expect(lastRendered.values).toEqual(["a"]);

    jest.advanceTimersByTime(500);

    act(() => {
      options.update(["c"], 0.75);
    });
    expect(lastRendered.values).toEqual(["a"]);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(lastRendered.values).toEqual(["a", "b", "c"]);
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
