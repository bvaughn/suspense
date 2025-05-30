import { describe, beforeEach, expect, it, vi, Mock } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

import {
  Component,
  PropsWithChildren,
  ReactNode,
  useLayoutEffect,
} from "react";
import { STATUS_PENDING, STATUS_RESOLVED, useImperativeCacheValue } from "..";
import { createCache } from "../cache/createCache";
import {
  Cache,
  CacheLoadOptions,
  Deferred,
  Status,
  SubscriptionData,
} from "../types";
import { createDeferred } from "../utils/createDeferred";
import { MutationApi, useCacheMutation } from "./useCacheMutation";
import { useCacheStatus } from "./useCacheStatus";

type Props = { cacheKey: string };
type Rendered = { status: Status; value: string };

describe("useCacheMutation", () => {
  let cache: Cache<[string], string>;
  let container: HTMLDivElement | null = null;
  let Component: (props: Props) => any;
  let load: Mock<
    (arg: [string], options: CacheLoadOptions) => Promise<string> | string
  >;
  let mostRecentRenders: { [cacheKey: string]: Rendered } = {};
  let mutationApi: { [cacheKey: string]: MutationApi<[string], string> } = {};

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    vi.useFakeTimers();

    container = null;

    load = vi.fn();
    load.mockImplementation(async ([cacheKey]) => Promise.resolve(cacheKey));

    cache = createCache<[string], string>({
      debugLabel: "cache",
      load,
    });

    mostRecentRenders = {};
    mutationApi = {};

    Component = ({ cacheKey }: Props) => {
      mutationApi[cacheKey] = useCacheMutation(cache);

      const status = useCacheStatus(cache, cacheKey);
      const value = cache.read(cacheKey);

      mostRecentRenders[cacheKey] = {
        status,
        value,
      };

      return value;
    };
  });

  async function mount(elements?: ReactNode) {
    if (elements == null) {
      elements = (
        <>
          <ErrorBoundary>
            <Component cacheKey="one" />
          </ErrorBoundary>
          <ErrorBoundary>
            <Component cacheKey="two" />
          </ErrorBoundary>
        </>
      );
    }

    container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(elements);
    });
  }

  describe("immutable caches", () => {
    it("should throw if passed to useCacheMutation hook", async () => {
      const immutableCache = createCache<[string], string>({
        config: {
          immutable: true,
        },
        getKey: ([cacheKey]) => cacheKey,
        load: ([cacheKey]) => cacheKey,
      });

      function Test() {
        useCacheMutation(immutableCache);
        return null;
      }

      // Swallow expected error message
      console.error = () => {};

      let caught: Error | null = null;
      try {
        await act(async () => mount(<Test />));
      } catch (error) {
        caught = error as Error;
      }
      expect(caught).not.toBeNull();
      expect(caught!.message).toBe("Cannot mutate an immutable cache");
    });

    it("should not re-render in response to a mutation", async () => {
      const immutableCache = createCache<[string], string>({
        config: {
          immutable: true,
        },
        getKey: ([cacheKey]) => cacheKey,
        load: ([cacheKey]) => cacheKey,
      });

      const mutableCache = createCache<[string], string>({
        getKey: ([cacheKey]) => cacheKey,
        load: ([cacheKey]) => cacheKey,
      });

      const ReadFromImmutableCache = vi.fn().mockImplementation(() => {
        return immutableCache.read("key");
      });

      const ReadFromMutableCache = vi.fn().mockImplementation(() => {
        return mutableCache.read("key");
      });

      const ReadFromMainCache = vi.fn().mockImplementation(() => {
        mutationApi.key = useCacheMutation(cache);
        return cache.read("key");
      });

      await act(async () =>
        mount(
          <>
            <ReadFromImmutableCache />
            <ReadFromMutableCache />
            <ReadFromMainCache />
          </>
        )
      );

      ReadFromImmutableCache.mockClear();
      ReadFromMutableCache.mockClear();
      ReadFromMainCache.mockClear();

      act(() => {
        mutationApi.key!.mutateSync(["key"], "new key");
      });

      // A mutation in any cache will trigger a re-render for all components that read from mutable caches.
      // This is how React manages cache "subscriptions" (similar to the Context API).
      expect(ReadFromMutableCache).toHaveBeenCalled();
      expect(ReadFromMainCache).toHaveBeenCalled();

      // But the component that read from the immutable should not re-render.
      expect(ReadFromImmutableCache).not.toHaveBeenCalled();
    });
  });

  describe("mutateAsync", () => {
    it("should support mutating a value in a cache", async () => {
      await mount();

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      let pendingDeferred: Deferred<string> | null = null;

      await act(async () => {
        // Don't wait for the mutation API to resolve; we want to test the in-between state too
        mutationApi.two!.mutateAsync(["two"], async () => {
          pendingDeferred = createDeferred<string>();
          return pendingDeferred.promise;
        });
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"pending","value":"two"}}"`
      );

      await act(async () => {
        pendingDeferred!.resolve("mutated-two");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"mutated-two"}}"`
      );
    });

    it("should handle errors that occur while mutating a value in a cache", async () => {
      await mount();

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      // Suppress uncaught error warning
      console.error = () => {};

      await act(async () => {
        await mutationApi.two!.mutateAsync(["two"], async () => {
          throw "errored-two";
        });
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"rejected","value":"two"}}"`
      );

      expect(container!.textContent).toBe("one" + "errored-two");
    });

    it("should support aborting an in-progress mutation", async () => {
      await mount();

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      let pendingDeferred = createDeferred<string>();
      await act(async () => {
        // Don't wait for the mutation API to resolve; we want to test the in-between state too
        mutationApi.two!.mutateAsync(["two"], async () => {
          return pendingDeferred.promise;
        });
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"pending","value":"two"}}"`
      );

      await act(async () => {
        cache.abort("two");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      // Even if the deferred value resolves, it should be ignored
      await act(async () => {
        pendingDeferred.resolve("unexpected");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      expect(container!.textContent).toBe("one" + "two");
    });

    it("should support concurrent mutations", async () => {
      await mount();

      let pendingDeferredOne: Deferred<string> | null = null;
      let pendingDeferredTwo: Deferred<string> | null = null;

      await act(async () => {
        mutationApi.two!.mutateAsync(["two"], async () => {
          pendingDeferredTwo = createDeferred<string>();
          return pendingDeferredTwo.promise;
        });
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"pending","value":"two"}}"`
      );

      await act(async () => {
        mutationApi.one!.mutateAsync(["one"], async () => {
          pendingDeferredOne = createDeferred<string>();
          return pendingDeferredOne.promise;
        });
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"pending","value":"one"},"two":{"status":"pending","value":"two"}}"`
      );

      await act(async () => pendingDeferredTwo!.resolve("mutated-two"));

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"pending","value":"one"},"two":{"status":"resolved","value":"mutated-two"}}"`
      );

      await act(async () => pendingDeferredOne!.resolve("mutated-one"));

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"mutated-one"},"two":{"status":"resolved","value":"mutated-two"}}"`
      );
    });

    it("should support concurrent mutations when one fails", async () => {
      await mount();

      let pendingDeferredOne: Deferred<string> | null = null;
      let pendingDeferredTwo: Deferred<string> | null = null;

      await act(async () => {
        mutationApi.two!.mutateAsync(["two"], async () => {
          pendingDeferredTwo = createDeferred<string>();
          return pendingDeferredTwo.promise;
        });
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"pending","value":"two"}}"`
      );

      await act(async () => {
        mutationApi.one!.mutateAsync(["one"], async () => {
          pendingDeferredOne = createDeferred<string>();
          return pendingDeferredOne.promise;
        });
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"pending","value":"one"},"two":{"status":"pending","value":"two"}}"`
      );

      // Suppress uncaught error warning
      console.error = () => {};

      await act(async () => pendingDeferredTwo!.reject("errored-two"));

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"pending","value":"one"},"two":{"status":"rejected","value":"two"}}"`
      );

      await act(async () => pendingDeferredOne!.resolve("mutated-one"));

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"mutated-one"},"two":{"status":"rejected","value":"two"}}"`
      );

      expect(container!.textContent).toBe("mutated-one" + "errored-two");
    });

    it("should support concurrent mutations on the same cache value", async () => {
      await mount();

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      // Start a few concurrent mutations
      let pendingDeferredA = createDeferred<string>();
      let pendingDeferredB = createDeferred<string>();
      let pendingDeferredC = createDeferred<string>();
      await act(async () => {
        mutationApi.one!.mutateAsync(
          ["one"],
          async () => pendingDeferredA.promise
        );
      });
      await act(async () => {
        mutationApi.one!.mutateAsync(
          ["one"],
          async () => pendingDeferredB.promise
        );
      });
      await act(async () => {
        mutationApi.one!.mutateAsync(
          ["one"],
          async () => pendingDeferredC.promise
        );
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"pending","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      // The first mutation should have been aborted; resolving it should do nothing
      await act(async () => {
        pendingDeferredA.resolve("one-unexpected");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"pending","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      // The last mutation should be the only one still subscribed to
      await act(async () => {
        pendingDeferredC.resolve("one-mutated");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one-mutated"},"two":{"status":"resolved","value":"two"}}"`
      );

      // The second mutation should have been aborted; resolving it should do nothing
      await act(async () => {
        pendingDeferredB.resolve("one-unexpected");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one-mutated"},"two":{"status":"resolved","value":"two"}}"`
      );

      expect(container!.textContent).toBe("one-mutated" + "two");
    });

    it("should ignore errors after an aborted mutation", async () => {
      await mount();

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      let pendingDeferred = createDeferred<string>();
      await act(async () => {
        mutationApi.two!.mutateAsync(["two"], async () => {
          return pendingDeferred.promise;
        });
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"pending","value":"two"}}"`
      );

      await act(async () => {
        cache.abort("two");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      // Even if the deferred value rejects, it should be ignored
      await act(async () => {
        pendingDeferred.reject("unexpected");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      expect(container!.textContent).toBe("one" + "two");
    });
  });

  describe("mutateSync", () => {
    it("should support mutating a value in a cache", async () => {
      await mount();

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      act(() => {
        mutationApi.two!.mutateSync(["two"], "mutated-two");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"mutated-two"}}"`
      );
    });

    it("should support mutating multiple values in a cache", async () => {
      await mount();

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      act(() => {
        mutationApi.one!.mutateSync(["one"], "mutated-one");
        mutationApi.two!.mutateSync(["two"], "mutated-two");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"mutated-one"},"two":{"status":"resolved","value":"mutated-two"}}"`
      );
    });

    it("should abort an in-progress async mutation when a sync one is scheduled", async () => {
      await mount();

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      const pendingDeferred = createDeferred<string>();
      await act(async () => {
        mutationApi.two!.mutateAsync(
          ["two"],
          async () => pendingDeferred.promise
        );
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"pending","value":"two"}}"`
      );

      await act(async () => {
        mutationApi.two!.mutateSync(["two"], "mutated-two");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"mutated-two"}}"`
      );

      // Any response/rejection to the initial async mutation should be ignored now
      await act(async () => {
        pendingDeferred.reject("unexpected");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"mutated-two"}}"`
      );
    });
  });

  describe("useImperativeCacheValue", () => {
    beforeEach(() => {
      Component = ({ cacheKey }: Props) => {
        mutationApi[cacheKey] = useCacheMutation(cache);

        const { status, value } = useImperativeCacheValue(cache, cacheKey);

        mostRecentRenders[cacheKey] = {
          status,
          value,
        };

        return value;
      };
    });

    it("should refetch values after a sync mutation", async () => {
      await mount();

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      act(() => {
        mutationApi.two!.mutateSync(["two"], "mutated-two");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"mutated-two"}}"`
      );
    });

    it("should refetch values after an async mutation", async () => {
      await mount();

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"two"}}"`
      );

      let pendingDeferred: Deferred<string> | null = null;

      await act(async () => {
        // Don't wait for the mutation API to resolve; we want to test the in-between state too
        mutationApi.two!.mutateAsync(["two"], async () => {
          pendingDeferred = createDeferred<string>();
          return pendingDeferred.promise;
        });
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"pending","value":"two"}}"`
      );

      await act(async () => {
        pendingDeferred!.resolve("mutated-two");
      });

      expect(JSON.stringify(mostRecentRenders)).toMatchInlineSnapshot(
        `"{"one":{"status":"resolved","value":"one"},"two":{"status":"resolved","value":"mutated-two"}}"`
      );
    });
  });

  describe("cache subscriptions", () => {
    let subscriptionMocks: {
      [cacheKey: string]: Mock<() => SubscriptionData<string>[]>;
    };

    beforeEach(() => {
      subscriptionMocks = {};

      Component = ({ cacheKey }: Props) => {
        mutationApi[cacheKey] = useCacheMutation(cache);

        useLayoutEffect(() => {
          const mock = vi.fn();
          subscriptionMocks[cacheKey] = mock;
          return cache.subscribe(mock, cacheKey);
        }, [cacheKey]);

        return cache.read(cacheKey);
      };
    });

    it("should be notified after a sync mutation", async () => {
      await mount();

      const mockOne = subscriptionMocks.one!;
      const mockTwo = subscriptionMocks.two!;

      expect(mockOne).toBeCalledTimes(1);
      expect(mockOne).toBeCalledWith({
        status: STATUS_RESOLVED,
        value: "one",
      });
      expect(mockTwo).toBeCalledTimes(1);
      expect(mockTwo).toBeCalledWith({
        status: STATUS_RESOLVED,
        value: "two",
      });

      act(() => {
        mutationApi.two!.mutateSync(["two"], "mutated-two");
      });

      expect(mockOne).toBeCalledTimes(1);
      expect(mockTwo).toBeCalledTimes(2);
      expect(mockTwo).toBeCalledWith({
        status: STATUS_RESOLVED,
        value: "mutated-two",
      });
    });

    it("should be notified after an async mutation", async () => {
      await mount();

      const mockOne = subscriptionMocks.one!;
      const mockTwo = subscriptionMocks.two!;

      expect(mockOne).toBeCalledTimes(1);
      expect(mockOne).toBeCalledWith({
        status: STATUS_RESOLVED,
        value: "one",
      });
      expect(mockTwo).toBeCalledTimes(1);
      expect(mockTwo).toBeCalledWith({
        status: STATUS_RESOLVED,
        value: "two",
      });

      let pendingDeferred: Deferred<string> | null = null;
      await act(async () => {
        // Don't wait for the mutation API to resolve; we want to test the in-between state too
        mutationApi.two!.mutateAsync(["two"], async () => {
          pendingDeferred = createDeferred<string>();
          return pendingDeferred.promise;
        });
      });

      expect(mockOne).toBeCalledTimes(1);
      expect(mockTwo).toBeCalledTimes(2);
      expect(mockTwo).toBeCalledWith({ status: STATUS_PENDING });

      await act(async () => {
        pendingDeferred!.resolve("mutated-two");
      });

      expect(mockOne).toBeCalledTimes(1);
      expect(mockTwo).toBeCalledTimes(3);
      expect(mockTwo).toBeCalledWith({
        status: STATUS_RESOLVED,
        value: "mutated-two",
      });
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
