/**
 * @jest-environment jsdom
 */

import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { createStreamingCache } from "./createStreamingCache";
import { StreamingCache, StreamingProgressNotifier } from "./types";
import { ReturnType, useStreamingValues } from "./useStreamingValues";

describe("useStreamingValue", () => {
  let cache: StreamingCache<[string], string>;
  let notifiers: Map<string, StreamingProgressNotifier<string, any>>;
  let lastRendered: ReturnType<string, undefined> | undefined = undefined;

  function Component({ string }: { string: string }): any {
    lastRendered = useStreamingValues(cache.stream(string));
    return null;
  }

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    notifiers = new Map();

    cache = createStreamingCache(
      (key) => key,
      (notifier, key) => {
        notifiers.set(key, notifier);
      }
    );
  });

  it("should re-render as values stream in", () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<Component string="test" />);
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

  // TODO Error case
});
