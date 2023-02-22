import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "../constants";
import { createStreamingCache } from "./createStreamingCache";
import { StreamingCache, StreamingProgressNotifier } from "../types";

describe("createStreamingCache", () => {
  let cache: StreamingCache<[string], string>;
  let getCacheKey: jest.Mock<string, [string]>;
  let fetch: jest.Mock<
    void,
    [notifier: StreamingProgressNotifier<string>, key: string]
  >;
  let notifiers: Map<string, StreamingProgressNotifier<string, any>>;

  beforeEach(() => {
    notifiers = new Map();

    getCacheKey = jest.fn();
    getCacheKey.mockImplementation((key: string) => key);

    fetch = jest.fn();
    fetch.mockImplementation(
      (notifier: StreamingProgressNotifier<string>, key: string) => {
        notifiers.set(key, notifier);
      }
    );

    cache = createStreamingCache<[string], string, any>(
      getCacheKey,
      fetch,
      "cache"
    );
  });

  describe("evict", () => {
    it("should remove cached values", async () => {
      cache.stream("string");

      const notifier = notifiers.get("string")!;
      notifier.update(["a"], 1);
      notifier.resolve();

      // Verify value has been cached
      let streaming = cache.stream("string");
      expect(streaming.values).toEqual(["a"]);

      fetch.mockReset();

      cache.evict("string");

      // Verify value is no longer cached
      streaming = cache.stream("string");
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.lastCall[1]).toEqual("string");
      expect(streaming.values).toBeUndefined();
    });
  });

  describe("prefetch", () => {
    it("test", async () => {
      cache.prefetch("string-1");

      const notifier = notifiers.get("string-1")!;
      notifier.update(["a"], 1);
      notifier.resolve();

      fetch.mockReset();

      // Verify value already loaded
      let streaming = cache.stream("string-1");
      expect(fetch).not.toHaveBeenCalled();
      expect(streaming.values).toEqual(["a"]);

      // Verify other values fetch independently
      streaming = cache.stream("string-2");
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.lastCall[1]).toEqual("string-2");
      expect(streaming.values).toBeUndefined();
    });
  });

  describe("stream", () => {
    it("notifies subscriber(s) of progress and completion", async () => {
      const streaming = cache.stream("string");

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.lastCall[1]).toEqual("string");

      const subscription = jest.fn();
      streaming.subscribe(subscription);

      const notifier = notifiers.get("string")!;
      notifier.update(["a", "b"], 0.66);
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(streaming.complete).toEqual(false);
      expect(streaming.progress).toEqual(0.66);
      expect(streaming.status).toEqual(STATUS_PENDING);
      expect(streaming.values).toEqual(["a", "b"]);

      notifier.update(["c"], 1);
      expect(subscription).toHaveBeenCalledTimes(2);
      expect(streaming.complete).toEqual(false);
      expect(streaming.progress).toEqual(1);
      expect(streaming.status).toEqual(STATUS_PENDING);
      expect(streaming.values).toEqual(["a", "b", "c"]);

      notifier.resolve();
      expect(subscription).toHaveBeenCalledTimes(3);
      expect(streaming.complete).toEqual(true);
      expect(streaming.progress).toEqual(1);
      expect(streaming.status).toEqual(STATUS_RESOLVED);
      expect(streaming.values).toEqual(["a", "b", "c"]);
    });

    it("notifies subscriber(s) of progress and rejection", async () => {
      const streaming = cache.stream("string");

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.lastCall[1]).toEqual("string");

      const subscription = jest.fn();
      streaming.subscribe(subscription);

      const notifier = notifiers.get("string")!;
      notifier.update(["a"]);
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(streaming.complete).toEqual(false);
      expect(streaming.progress).toBeUndefined();
      expect(streaming.status).toEqual(STATUS_PENDING);
      expect(streaming.values).toEqual(["a"]);

      notifier.reject("Expected");
      expect(subscription).toHaveBeenCalledTimes(2);
      expect(streaming.complete).toEqual(true);
      expect(streaming.progress).toBeUndefined();
      expect(streaming.status).toEqual(STATUS_REJECTED);
      expect(streaming.values).toEqual(["a"]);

      expect(() => {
        notifier.update(["a"]);
      }).toThrow("already been rejected");
      expect(subscription).toHaveBeenCalledTimes(2);

      expect(() => {
        notifier.resolve();
      }).toThrow("already been rejected");
      expect(subscription).toHaveBeenCalledTimes(2);
    });

    it("warns about invalid progress values", () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});

      cache.stream("string");

      const notifier = notifiers.get("string")!;
      notifier.update([], -1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        "Invalid progress: -1; value must be between 0-1."
      );

      notifier.update([], 2);
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith(
        "Invalid progress: 2; value must be between 0-1."
      );
    });

    it("caches values so they are only streamed once", () => {
      cache.stream("string");

      const notifier = notifiers.get("string")!;
      notifier.update(["a", "b"], -1);
      notifier.resolve();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.lastCall[1]).toEqual("string");

      const streaming = cache.stream("string");

      expect(streaming.complete).toBe(true);
      expect(streaming.values).toEqual(["a", "b"]);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("manages streams and subscriptions independently", () => {
      const streamingA = cache.stream("a");
      const streamingB = cache.stream("b");

      const notifierA = notifiers.get("a")!;
      const notifierB = notifiers.get("b")!;

      const subscriptionA = jest.fn();
      const subscriptionB = jest.fn();

      streamingA.subscribe(subscriptionA);
      streamingB.subscribe(subscriptionB);

      expect(subscriptionA).not.toHaveBeenCalled();
      expect(subscriptionB).not.toHaveBeenCalled();

      notifierA.update(["a", "b"], 0.5);

      expect(subscriptionA).toHaveBeenCalledTimes(1);
      expect(subscriptionB).not.toHaveBeenCalled();

      notifierB.update(["a", "b"], 0.5);
      notifierB.update(["c", "d"], 1);

      expect(subscriptionA).toHaveBeenCalledTimes(1);
      expect(subscriptionB).toHaveBeenCalledTimes(2);

      expect(streamingA.complete).toEqual(false);
      expect(streamingA.progress).toEqual(0.5);
      expect(streamingA.status).toEqual(STATUS_PENDING);
      expect(streamingA.values).toEqual(["a", "b"]);

      expect(streamingB.complete).toEqual(false);
      expect(streamingB.progress).toEqual(1);
      expect(streamingB.status).toEqual(STATUS_PENDING);
      expect(streamingB.values).toEqual(["a", "b", "c", "d"]);
    });

    it("does not notify of updates after a subscriber unsubscribes", () => {
      const streaming = cache.stream("string");

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.lastCall[1]).toEqual("string");

      const subscription = jest.fn();
      const unsubscribe = streaming.subscribe(subscription);

      const notifier = notifiers.get("string")!;
      notifier.update(["a"]);
      expect(subscription).toHaveBeenCalledTimes(1);

      unsubscribe();

      notifier.update(["b"]);
      notifier.resolve();

      expect(subscription).toHaveBeenCalledTimes(1);
    });

    it("should support additional data passed by the fetcher", () => {
      const streaming = cache.stream("string");
      const notifier = notifiers.get("string")!;

      notifier.update(["a"], 0.5, { data: 1 });
      expect(streaming.data).toEqual({ data: 1 });

      notifier.update(["b"], 1, { data: 2 });
      expect(streaming.data).toEqual({ data: 2 });
    });
  });
});
