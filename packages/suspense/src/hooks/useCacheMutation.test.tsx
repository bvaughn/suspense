/**
 * @jest-environment jsdom
 */

import { flushSync, render } from "react-dom";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

import { createCache } from "../cache/createCache";
import { Cache, CacheLoadOptions, Deferred, Status } from "../types";
import { createDeferred } from "../utils/createDeferred";
import { useCacheStatus } from "./useCacheStatus";
import { MutationApi, useCacheMutation } from "./useCacheMutation";
import { Component, PropsWithChildren } from "react";

type Props = { cacheKey: string };
type Rendered = { status: Status; value: string };

describe("useCacheMutation", () => {
  let cache: Cache<[string], string>;
  let Component: (props: Props) => any;
  let load: jest.Mock<Promise<string> | string, [string, CacheLoadOptions]>;
  let mostRecentRenders: { [cacheKey: string]: Rendered } = {};
  let mutationApi: { [cacheKey: string]: MutationApi<[string], string> } = {};

  beforeEach(() => {
    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true;

    jest.useFakeTimers();

    load = jest.fn();
    load.mockImplementation(async (cacheKey: string) =>
      Promise.resolve(cacheKey)
    );

    cache = createCache<[string], string>({
      debugLabel: "cache",
      load,
    });

    mostRecentRenders = {};
    mutationApi = {};

    Component = ({ cacheKey }: Props) => {
      mutationApi[cacheKey] = useCacheMutation(cache);

      const status = useCacheStatus(cache, cacheKey);
      const value = cache.fetchSuspense(cacheKey);

      mostRecentRenders[cacheKey] = {
        status,
        value,
      };

      return value;
    };
  });

  describe("mutateAsync", () => {
    it("should support editing a value in a cache", async () => {
      const container = document.createElement("div");
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <>
            <Component cacheKey="one" />
            <Component cacheKey="two" />
          </>
        );
      });

      expect(mostRecentRenders).toMatchInlineSnapshot(`
        {
          "one": {
            "status": "resolved",
            "value": "one",
          },
          "two": {
            "status": "resolved",
            "value": "two",
          },
        }
      `);

      let pendingDeferred: Deferred<string> | null = null;

      await act(async () => {
        // Don't wait for the mutation API to resolve
        // We want to test the in-between state too
        mutationApi.two.mutateAsync(["two"], async () => {
          pendingDeferred = createDeferred<string>();
          return pendingDeferred;
        });
      });

      expect(mostRecentRenders).toMatchInlineSnapshot(`
        {
          "one": {
            "status": "resolved",
            "value": "one",
          },
          "two": {
            "status": "pending",
            "value": "two",
          },
        }
      `);

      await act(async () => {
        pendingDeferred.resolve("mutated-two");
      });

      expect(mostRecentRenders).toMatchInlineSnapshot(`
        {
          "one": {
            "status": "resolved",
            "value": "one",
          },
          "two": {
            "status": "resolved",
            "value": "mutated-two",
          },
        }
      `);
    });

    it("should handle errors that occur while editing a value in a cache", async () => {
      const container = document.createElement("div");
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <ErrorBoundary>
            <Component cacheKey="one" />
            <Component cacheKey="two" />
          </ErrorBoundary>
        );
      });

      expect(mostRecentRenders).toMatchInlineSnapshot(`
        {
          "one": {
            "status": "resolved",
            "value": "one",
          },
          "two": {
            "status": "resolved",
            "value": "two",
          },
        }
      `);

      // Suppress uncaught error warning
      console.error = () => {};

      await act(async () => {
        mutationApi.two.mutateAsync(["two"], async () => {
          throw "Expected error";
        });
      });

      expect(mostRecentRenders).toMatchInlineSnapshot(`
        {
          "one": {
            "status": "resolved",
            "value": "one",
          },
          "two": {
            "status": "rejected",
            "value": "two",
          },
        }
      `);

      expect(container.textContent).toBe("Expected error");
    });

    it("should support aborting an in-progress mutation", async () => {
      const container = document.createElement("div");
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <>
            <Component cacheKey="one" />
            <Component cacheKey="two" />
          </>
        );
      });

      expect(mostRecentRenders).toMatchInlineSnapshot(`
        {
          "one": {
            "status": "resolved",
            "value": "one",
          },
          "two": {
            "status": "resolved",
            "value": "two",
          },
        }
      `);

      await act(async () => {
        // Don't wait for the mutation API to resolve
        // We want to test the in-between state too
        mutationApi.two.mutateAsync(["two"], async () => {
          return createDeferred<string>();
        });
      });

      expect(mostRecentRenders).toMatchInlineSnapshot(`
        {
          "one": {
            "status": "resolved",
            "value": "one",
          },
          "two": {
            "status": "pending",
            "value": "two",
          },
        }
      `);

      await act(async () => {
        cache.abort("two");
      });

      expect(mostRecentRenders).toMatchInlineSnapshot(`
        {
          "one": {
            "status": "resolved",
            "value": "one",
          },
          "two": {
            "status": "resolved",
            "value": "two",
          },
        }
      `);

      expect(container.textContent).toBe("onetwo");
    });
  });

  describe("mutateSync", () => {
    it("should support editing a value in a cache", async () => {
      const container = document.createElement("div");
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <>
            <Component cacheKey="one" />
            <Component cacheKey="two" />
          </>
        );
      });

      expect(mostRecentRenders).toMatchInlineSnapshot(`
        {
          "one": {
            "status": "resolved",
            "value": "one",
          },
          "two": {
            "status": "resolved",
            "value": "two",
          },
        }
      `);

      act(() => {
        mutationApi.two.mutateSync(["two"], "mutated-two");
      });

      expect(mostRecentRenders).toMatchInlineSnapshot(`
        {
          "one": {
            "status": "resolved",
            "value": "one",
          },
          "two": {
            "status": "resolved",
            "value": "mutated-two",
          },
        }
      `);
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
