import {
  STATUS_ABORTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { createStreamingCache } from "./createStreamingCache";
import { StreamingCache, StreamingCacheLoadOptions } from "../types";

describe("createStreamingCache", () => {
  type Metadata = { length: number };
  type Value = string;

  describe("single value (string)", () => {
    let cache: StreamingCache<[string], Value, Metadata>;
    let fetch: jest.Mock<
      void,
      [options: StreamingCacheLoadOptions<Value, Metadata>, key: string]
    >;
    let optionsMap: Map<string, StreamingCacheLoadOptions<string, Metadata>>;

    beforeEach(() => {
      optionsMap = new Map();

      fetch = jest.fn();
      fetch.mockImplementation(
        (options: StreamingCacheLoadOptions<Value, Metadata>, key: string) => {
          optionsMap.set(key, options);
        }
      );

      cache = createStreamingCache<[string], string, any>({
        debugLabel: "cache",
        load: fetch,
      });
    });

    it("should update as data streams in", () => {
      const streaming = cache.stream("string");

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(expect.anything(), "string");

      const subscription = jest.fn();
      streaming.subscribe(subscription);

      const options = optionsMap.get("string")!;
      options.update("ab", 0.5, { length: 4 });
      expect(subscription).toHaveBeenCalledTimes(1);
      expect(streaming.complete).toEqual(false);
      expect(streaming.data).toEqual({ length: 4 });
      expect(streaming.progress).toEqual(0.5);
      expect(streaming.status).toEqual(STATUS_PENDING);
      expect(streaming.value).toEqual("ab");

      options.update("abcd", 1);
      expect(subscription).toHaveBeenCalledTimes(2);
      expect(streaming.complete).toEqual(false);
      expect(streaming.data).toEqual({ length: 4 });
      expect(streaming.progress).toEqual(1);
      expect(streaming.status).toEqual(STATUS_PENDING);
      expect(streaming.value).toEqual("abcd");

      options.resolve();
      expect(subscription).toHaveBeenCalledTimes(3);
      expect(streaming.complete).toEqual(true);
      expect(streaming.progress).toEqual(1);
      expect(streaming.status).toEqual(STATUS_RESOLVED);
      expect(streaming.value).toEqual("abcd");
    });
  });

  describe("array of values (number)", () => {
    type Value = number[];

    let cache: StreamingCache<[string], Value>;
    let fetch: jest.Mock<
      void,
      [options: StreamingCacheLoadOptions<Value>, key: string]
    >;
    let optionsMap: Map<string, StreamingCacheLoadOptions<Value, any>>;

    beforeEach(() => {
      optionsMap = new Map();

      fetch = jest.fn();
      fetch.mockImplementation(
        (options: StreamingCacheLoadOptions<Value>, key: string) => {
          optionsMap.set(key, options);
        }
      );

      cache = createStreamingCache<[string], Value, any>({
        debugLabel: "cache",
        load: fetch,
      });
    });

    it("should supply a working default getCacheKey if none is provided", () => {
      const fetch = jest.fn();
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
        options.update([1], 1);

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
        options.update([1], 1);
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
        options.update([1], 1);
        options.resolve();

        // Verify value has been cached
        let streaming = cache.stream("string");
        expect(streaming.value).toEqual([1]);

        fetch.mockClear();

        cache.evict("string");

        // Verify value is no longer cached
        streaming = cache.stream("string");
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(expect.anything(), "string");
        expect(streaming.value).toBeUndefined();
      });
    });

    describe("evictAll", () => {
      it("should remove cached values", async () => {
        cache.stream("string-a");
        cache.stream("string-b");

        const optionsA = optionsMap.get("string-a")!;
        optionsA.update([1], 1);
        optionsA.resolve();

        const optionsB = optionsMap.get("string-b")!;
        optionsB.update([1, 2], 1);
        optionsB.resolve();

        // Verify value has been cached
        let streaming = cache.stream("string-a");
        expect(streaming.value).toEqual([1]);
        streaming = cache.stream("string-b");
        expect(streaming.value).toEqual([1, 2]);

        fetch.mockClear();

        cache.evictAll();

        // Verify value is no longer cached
        const streamingA = cache.stream("string-a");
        const streamingB = cache.stream("string-b");
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(streamingA.value).toBeUndefined();
        expect(streamingB.value).toBeUndefined();
      });
    });

    describe("prefetch", () => {
      it("should start fetching a resource", async () => {
        cache.prefetch("string-1");

        const options = optionsMap.get("string-1")!;
        options.update([1], 1);
        options.resolve();

        fetch.mockClear();

        // Verify value already loaded
        let streaming = cache.stream("string-1");
        expect(fetch).not.toHaveBeenCalled();
        expect(streaming.value).toEqual([1]);

        // Verify other values fetch independently
        streaming = cache.stream("string-2");
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(expect.anything(), "string-2");
        expect(streaming.value).toBeUndefined();
      });
    });

    describe("stream", () => {
      it("notifies subscriber(s) of progress and completion", async () => {
        const streaming = cache.stream("string");

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(expect.anything(), "string");

        const subscription = jest.fn();
        streaming.subscribe(subscription);

        const options = optionsMap.get("string")!;
        options.update([1, 2], 0.66);
        expect(subscription).toHaveBeenCalledTimes(1);
        expect(streaming.complete).toEqual(false);
        expect(streaming.progress).toEqual(0.66);
        expect(streaming.status).toEqual(STATUS_PENDING);
        expect(streaming.value).toEqual([1, 2]);

        options.update([1, 2, 3, 4], 1);
        expect(subscription).toHaveBeenCalledTimes(2);
        expect(streaming.complete).toEqual(false);
        expect(streaming.progress).toEqual(1);
        expect(streaming.status).toEqual(STATUS_PENDING);
        expect(streaming.value).toEqual([1, 2, 3, 4]);

        options.resolve();
        expect(subscription).toHaveBeenCalledTimes(3);
        expect(streaming.complete).toEqual(true);
        expect(streaming.progress).toEqual(1);
        expect(streaming.status).toEqual(STATUS_RESOLVED);
        expect(streaming.value).toEqual([1, 2, 3, 4]);
      });

      it("notifies subscriber(s) of progress and rejection", async () => {
        const streaming = cache.stream("string");

        // Prevent Jest from failing due to unhandled promise rejection
        streaming.resolver.then(
          () => {},
          () => {}
        );

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(expect.anything(), "string");

        const subscription = jest.fn();
        streaming.subscribe(subscription);

        const options = optionsMap.get("string")!;
        options.update([1]);
        expect(subscription).toHaveBeenCalledTimes(1);
        expect(streaming.complete).toEqual(false);
        expect(streaming.progress).toBeUndefined();
        expect(streaming.status).toEqual(STATUS_PENDING);
        expect(streaming.value).toEqual([1]);

        options.reject("Expected");

        expect(subscription).toHaveBeenCalledTimes(2);
        expect(streaming.complete).toEqual(true);
        expect(streaming.progress).toBeUndefined();
        expect(streaming.status).toEqual(STATUS_REJECTED);
        expect(streaming.value).toEqual([1]);

        expect(() => options.update([1])).toThrow();
        expect(subscription).toHaveBeenCalledTimes(2);

        expect(options.resolve).toThrow();
        expect(subscription).toHaveBeenCalledTimes(2);
      });

      it("automatically reject the stream if the loading function throws", async () => {
        fetch.mockImplementation(() => {
          throw Error("Expected");
        });

        const streaming = cache.stream("string");

        // Prevent Jest from failing due to unhandled promise rejection
        streaming.resolver.then(
          () => {},
          () => {}
        );

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(expect.anything(), "string");

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
        options.update([1, 2], -1);
        options.resolve();

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(expect.anything(), "string");

        const streaming = cache.stream("string");

        expect(streaming.complete).toBe(true);
        expect(streaming.value).toEqual([1, 2]);
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

        optionsA.update([1, 2], 0.5);

        expect(subscriptionA).toHaveBeenCalledTimes(1);
        expect(subscriptionB).not.toHaveBeenCalled();

        optionsB.update([1, 2], 0.5);
        optionsB.update([1, 2, 3, 4], 1);

        expect(subscriptionA).toHaveBeenCalledTimes(1);
        expect(subscriptionB).toHaveBeenCalledTimes(2);

        expect(streamingA.complete).toEqual(false);
        expect(streamingA.progress).toEqual(0.5);
        expect(streamingA.status).toEqual(STATUS_PENDING);
        expect(streamingA.value).toEqual([1, 2]);

        expect(streamingB.complete).toEqual(false);
        expect(streamingB.progress).toEqual(1);
        expect(streamingB.status).toEqual(STATUS_PENDING);
        expect(streamingB.value).toEqual([1, 2, 3, 4]);
      });

      it("does not notify of updates after a subscriber unsubscribes", () => {
        const streaming = cache.stream("string");

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(expect.anything(), "string");

        const subscription = jest.fn();
        const unsubscribe = streaming.subscribe(subscription);

        const options = optionsMap.get("string")!;
        options.update([1]);
        expect(subscription).toHaveBeenCalledTimes(1);

        unsubscribe();

        options.update([1]);
        options.resolve();

        expect(subscription).toHaveBeenCalledTimes(1);
      });

      it("should support additional data passed by the fetcher", () => {
        const streaming = cache.stream("string");
        const options = optionsMap.get("string")!;

        options.update([1], 0.5, { data: 1 });
        expect(streaming.data).toEqual({ data: 1 });

        options.update([1], 1, { data: 2 });
        expect(streaming.data).toEqual({ data: 2 });
      });
    });
  });

  describe("development warnings", () => {
    it("should warn if a key contains a stringified object", async () => {
      const cache = createStreamingCache<[Object, string], boolean, any>({
        debugLabel: "cache",
        getKey: (object, id) => `${object}-${id}`,
        load: () => true,
      });

      jest.spyOn(console, "warn").mockImplementation(() => {});

      cache.stream({}, "one");

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching("contains a stringified object")
      );

      // Only warn once per cache though
      cache.stream({}, "two");
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });
});
