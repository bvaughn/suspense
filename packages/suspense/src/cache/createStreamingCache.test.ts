import {
  STATUS_ABORTED,
  STATUS_NOT_STARTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { createStreamingCache } from "./createStreamingCache";
import { StreamingCache, StreamingCacheLoadOptions } from "../types";

describe("createStreamingCache", () => {
  let cache: StreamingCache<[string], string>;
  let getCacheKey: jest.Mock<string, [string]>;
  let fetch: jest.Mock<
    void,
    [options: StreamingCacheLoadOptions<string>, key: string]
  >;
  let optionsMap: Map<string, StreamingCacheLoadOptions<string, any>>;

  beforeEach(() => {
    optionsMap = new Map();

    getCacheKey = jest.fn();
    getCacheKey.mockImplementation((key: string) => key);

    fetch = jest.fn();
    fetch.mockImplementation(
      (options: StreamingCacheLoadOptions<string>, key: string) => {
        optionsMap.set(key, options);
      }
    );

    cache = createStreamingCache<[string], string, any>({
      debugLabel: "cache",
      getKey: getCacheKey,
      load: fetch,
    });
  });

  it("should supply a working default getCacheKey if none is provided", () => {
    const cache = createStreamingCache<[string, number, boolean], string>({
      load: fetch,
    });
    cache.stream("string", 123, true);

    expect(fetch).toHaveBeenCalledTimes(1);

    cache.stream("other string", 456, false);

    expect(fetch).toHaveBeenCalledTimes(2);

    cache.stream("string", 123, true);
    cache.stream("other string", 456, false);

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  describe("abort", () => {
    it("should abort an active request", async () => {
      const streaming = cache.stream("string");
      expect(streaming.status).toBe(STATUS_PENDING);

      const options = optionsMap.get("string")!;
      options.update(["a"], 1);

      expect(cache.abort("string")).toBe(true);
      expect(streaming.status).toBe(STATUS_ABORTED);
      expect(options.signal.aborted).toBe(true);

      expect(options.resolve).toThrow();
      await Promise.resolve();
      expect(streaming.status).toBe(STATUS_ABORTED);
    });

    it("should restart an aborted request on next stream request", async () => {
      const streamingA = cache.stream("string");
      expect(streamingA.status).toBe(STATUS_PENDING);

      const optionsA = optionsMap.get("string")!;
      expect(cache.abort("string")).toBe(true);
      expect(streamingA.status).toBe(STATUS_ABORTED);
      expect(optionsA.signal.aborted).toBe(true);

      expect(optionsA.resolve).toThrow();
      await Promise.resolve();
      expect(streamingA.status).toBe(STATUS_ABORTED);

      const streamingB = cache.stream("string");
      expect(streamingB.status).toBe(STATUS_PENDING);
      expect(fetch).toHaveBeenCalled();
    });

    it("should gracefully handle an abort request for a completed fetch", async () => {
      const streaming = cache.stream("string");

      const options = optionsMap.get("string")!;
      options.update(["a"], 1);
      options.resolve();

      await Promise.resolve();

      expect(streaming.status).toBe(STATUS_RESOLVED);

      expect(cache.abort("string")).toBe(false);
    });
  });

  describe("evict", () => {
    it("should remove cached values", async () => {
      cache.stream("string");

      const options = optionsMap.get("string")!;
      options.update(["a"], 1);
      options.resolve();

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

  describe("evictAll", () => {
    it("should remove cached values", async () => {
      cache.stream("string-a");
      cache.stream("string-b");

      const optionsA = optionsMap.get("string-a")!;
      optionsA.update(["a"], 1);
      optionsA.resolve();

      const optionsB = optionsMap.get("string-b")!;
      optionsB.update(["b"], 1);
      optionsB.resolve();

      // Verify value has been cached
      let streaming = cache.stream("string-a");
      expect(streaming.values).toEqual(["a"]);
      streaming = cache.stream("string-b");
      expect(streaming.values).toEqual(["b"]);

      fetch.mockReset();

      cache.evictAll();

      // Verify value is no longer cached
      const streamingA = cache.stream("string-a");
      const streamingB = cache.stream("string-b");
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(streamingA.values).toBeUndefined();
      expect(streamingB.values).toBeUndefined();
    });
  });

  describe("prefetch", () => {
    it("should start fetching a resource", async () => {
      cache.prefetch("string-1");

      const options = optionsMap.get("string-1")!;
      options.update(["a"], 1);
      options.resolve();

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

      const options = optionsMap.get("string")!;
      options.update(["a", "b"], 0.66);
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(streaming.complete).toEqual(false);
      expect(streaming.progress).toEqual(0.66);
      expect(streaming.status).toEqual(STATUS_PENDING);
      expect(streaming.values).toEqual(["a", "b"]);

      options.update(["c"], 1);
      expect(subscription).toHaveBeenCalledTimes(2);
      expect(streaming.complete).toEqual(false);
      expect(streaming.progress).toEqual(1);
      expect(streaming.status).toEqual(STATUS_PENDING);
      expect(streaming.values).toEqual(["a", "b", "c"]);

      options.resolve();
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

      const options = optionsMap.get("string")!;
      options.update(["a"]);
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(streaming.complete).toEqual(false);
      expect(streaming.progress).toBeUndefined();
      expect(streaming.status).toEqual(STATUS_PENDING);
      expect(streaming.values).toEqual(["a"]);

      options.reject("Expected");
      expect(subscription).toHaveBeenCalledTimes(2);
      expect(streaming.complete).toEqual(true);
      expect(streaming.progress).toBeUndefined();
      expect(streaming.status).toEqual(STATUS_REJECTED);
      expect(streaming.values).toEqual(["a"]);

      expect(() => options.update(["a"])).toThrow();
      expect(subscription).toHaveBeenCalledTimes(2);

      expect(options.resolve).toThrow();
      expect(subscription).toHaveBeenCalledTimes(2);
    });

    it("automatically reject the stream if the loading function throws", async () => {
      fetch.mockImplementation(() => {
        throw Error("Expected");
      });

      const streaming = cache.stream("string");

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.lastCall[1]).toEqual("string");

      expect(streaming.status).toBe(STATUS_REJECTED);
    });

    it("warns about invalid progress values", () => {
      jest.spyOn(console, "warn").mockImplementation(() => {});

      cache.stream("string");

      const options = optionsMap.get("string")!;
      options.update([], -1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        "Invalid progress: -1; value must be between 0-1."
      );

      options.update([], 2);
      expect(console.warn).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith(
        "Invalid progress: 2; value must be between 0-1."
      );
    });

    it("caches values so they are only streamed once", () => {
      cache.stream("string");

      const options = optionsMap.get("string")!;
      options.update(["a", "b"], -1);
      options.resolve();

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

      const optionsA = optionsMap.get("a")!;
      const optionsB = optionsMap.get("b")!;

      const subscriptionA = jest.fn();
      const subscriptionB = jest.fn();

      streamingA.subscribe(subscriptionA);
      streamingB.subscribe(subscriptionB);

      expect(subscriptionA).not.toHaveBeenCalled();
      expect(subscriptionB).not.toHaveBeenCalled();

      optionsA.update(["a", "b"], 0.5);

      expect(subscriptionA).toHaveBeenCalledTimes(1);
      expect(subscriptionB).not.toHaveBeenCalled();

      optionsB.update(["a", "b"], 0.5);
      optionsB.update(["c", "d"], 1);

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

      const options = optionsMap.get("string")!;
      options.update(["a"]);
      expect(subscription).toHaveBeenCalledTimes(1);

      unsubscribe();

      options.update(["b"]);
      options.resolve();

      expect(subscription).toHaveBeenCalledTimes(1);
    });

    it("should support additional data passed by the fetcher", () => {
      const streaming = cache.stream("string");
      const options = optionsMap.get("string")!;

      options.update(["a"], 0.5, { data: 1 });
      expect(streaming.data).toEqual({ data: 1 });

      options.update(["b"], 1, { data: 2 });
      expect(streaming.data).toEqual({ data: 2 });
    });
  });
});
