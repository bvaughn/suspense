/**
 * @jest-environment jsdom
 */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { createStreamingCache } from "../cache/createStreamingCache";
import { StreamingCache, StreamingProgressNotifier } from "../types";
import {
  StreamingValuesPartial,
  useStreamingValues,
} from "./useStreamingValues";

describe("useStreamingValue", () => {
  let cache: StreamingCache<[string], string>;
  let notifiers: Map<string, StreamingProgressNotifier<string, any>>;
  let lastRendered: StreamingValuesPartial<string, undefined> | undefined =
    undefined;

  function Component({
    string,
    throttleUpdatesBy,
  }: {
    string: string;
    throttleUpdatesBy?: number;
  }): any {
    lastRendered = useStreamingValues(cache.stream(string), {
      throttleUpdatesBy,
    });
    return null;
  }

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    jest.useFakeTimers();

    notifiers = new Map();

    cache = createStreamingCache((notifier, key) => {
      notifiers.set(key, notifier);
    });
  });

  it("should re-render as values stream in", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="test" throttleUpdatesBy={0} />);
    });

    expect(lastRendered?.values).toEqual(undefined);

    const notifier = notifiers.get("test")!;
    act(() => {
      notifier.update(["a", "b"], 0.5);
    });
    expect(lastRendered).toEqual({
      complete: false,
      data: undefined,
      progress: 0.5,
      values: ["a", "b"],
    });

    act(() => {
      notifier.update(["c", "d"], 1);
      notifier.resolve();
    });
    expect(lastRendered).toEqual({
      complete: true,
      data: undefined,
      progress: 1,
      values: ["a", "b", "c", "d"],
    });
  });

  it("should throttle updates to avoid overwhelming React's scheduler", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="test" throttleUpdatesBy={1_000} />);
    });

    expect(lastRendered?.values).toEqual(undefined);

    const notifier = notifiers.get("test")!;
    act(() => {
      notifier.update(["a"], 0.25);
    });
    expect(lastRendered.values).toEqual(["a"]);

    act(() => {
      notifier.update(["b"], 0.5);
    });
    expect(lastRendered.values).toEqual(["a"]);

    jest.advanceTimersByTime(500);

    act(() => {
      notifier.update(["c"], 0.75);
    });
    expect(lastRendered.values).toEqual(["a"]);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(lastRendered.values).toEqual(["a", "b", "c"]);
  });
});
