import { describe, beforeEach, expect, it, afterEach, vi, Mock } from "vitest";
import {
  STATUS_ABORTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { StreamingCache, StreamingCacheLoadOptions } from "../types";
import { createStreamingCache } from "./createStreamingCache";

describe("createStreamingCache", () => {
  type Metadata = { length: number };
  type Value = string;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("single value (string)", () => {
    let cache: StreamingCache<[string], Value, Metadata>;
    let load: Mock<
      (options: StreamingCacheLoadOptions<Value, Metadata>, key: string) => void
    >;
    let optionsMap: Map<string, StreamingCacheLoadOptions<string, Metadata>>;

    beforeEach(() => {
      optionsMap = new Map();

      load = vi.fn();
      load.mockImplementation(
        (options: StreamingCacheLoadOptions<Value, Metadata>, key: string) => {
          optionsMap.set(key, options);
        }
      );

      cache = createStreamingCache<[string], string, any>({
        debugLabel: "cache",
        load,
      });
    });

    it("should update as data streams in", () => {
      const streaming = cache.stream("string");

      expect(load).toHaveBeenCalledTimes(1);
      expect(load).toHaveBeenCalledWith(expect.anything(), "string");

      const subscription = vi.fn();
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
    let load: Mock<
      (options: StreamingCacheLoadOptions<Value>, key: string) => void
    >;
    let optionsMap: Map<string, StreamingCacheLoadOptions<Value, any>>;

    beforeEach(() => {
      optionsMap = new Map();

      load = vi.fn();
      load.mockImplementation(
        (options: StreamingCacheLoadOptions<Value>, key: string) => {
          optionsMap.set(key, options);
        }
      );

      cache = createStreamingCache<[string], Value, any>({
        debugLabel: "cache",
        load,
      });
    });

    it("should supply a working default getCacheKey if none is provided", () => {
      const load = vi.fn();
      const cache = createStreamingCache<[string, number, boolean], string>({
        load,
      });

      cache.stream("string", 123, true);
      expect(load).toHaveBeenCalledTimes(1);

      cache.stream("other string", 456, false);
      expect(load).toHaveBeenCalledTimes(2);

      cache.stream("string", 123, true);
      cache.stream("other string", 456, false);
      expect(load).toHaveBeenCalledTimes(2);
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
        expect(load).toHaveBeenCalled();
      });

      it("should gracefully handle an abort request for a completed load", async () => {
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

        load.mockClear();

        cache.evict("string");

        // Verify value is no longer cached
        streaming = cache.stream("string");
        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string");
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

        load.mockClear();

        cache.evictAll();

        // Verify value is no longer cached
        const streamingA = cache.stream("string-a");
        const streamingB = cache.stream("string-b");
        expect(load).toHaveBeenCalledTimes(2);
        expect(streamingA.value).toBeUndefined();
        expect(streamingB.value).toBeUndefined();
      });
    });

    describe("prefetch", () => {
      it("should start loading a resource", async () => {
        cache.prefetch("string-1");

        const options = optionsMap.get("string-1")!;
        options.update([1], 1);
        options.resolve();

        load.mockClear();

        // Verify value already loaded
        let streaming = cache.stream("string-1");
        expect(load).not.toHaveBeenCalled();
        expect(streaming.value).toEqual([1]);

        // Verify other values load independently
        streaming = cache.stream("string-2");
        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string-2");
        expect(streaming.value).toBeUndefined();
      });
    });

    describe("read", () => {
      it("should resolve once the underlying cache resolves", async () => {
        let promise = null;
        try {
          cache.read("string");
        } catch (thrown) {
          promise = thrown;
        }
        expect(promise).not.toBe(null);

        let resolved: any;
        (promise as PromiseLike<any>).then((data) => {
          resolved = data;
        });

        const options = optionsMap.get("string")!;
        options.update([1, 2], 0.66);
        options.update([1, 2, 3, 4], 1);
        options.resolve();

        await promise;

        expect(resolved?.data).toBeUndefined();
        expect(resolved?.value).toEqual([1, 2, 3, 4]);
      });

      it("should throw if the underlying cache errors", async () => {
        let promise = null;
        try {
          cache.read("string");
        } catch (thrown) {
          promise = thrown;
        }
        expect(promise).not.toBe(null);

        let errorMessage: any;
        let status: any;
        (promise as PromiseLike<any>).then(
          () => {
            status = "resolved";
          },
          (error) => {
            status = "rejected";
            errorMessage = error;
          }
        );

        const options = optionsMap.get("string")!;
        options.reject("failure");

        try {
          await promise;
        } catch (error) {}

        expect(status).toBe("rejected");
        expect(errorMessage).toBe("failure");
      });

      it("should not suspend for resolved caches", async () => {
        load.mockImplementation((options) => {
          options.update([1, 2, 3], 1);
          options.resolve();
        });

        const { data, value } = cache.read("string");
        expect(data).toBeUndefined();
        expect(value).toEqual([1, 2, 3]);
      });
    });

    describe("readAsync", () => {
      it("notifies subscriber(s) of progress and completion", async () => {
        const promise = cache.readAsync("string");

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string");

        const options = optionsMap.get("string")!;
        options.update([1, 2], 0.66);
        options.update([1, 2, 3, 4], 1);
        options.resolve();

        const { value } = await promise;

        expect(value).toEqual([1, 2, 3, 4]);
      });

      it("notifies subscriber(s) of progress and rejection", async () => {
        const promise = cache.readAsync("string");

        // Prevent test from failing due to unhandled promise rejection
        promise.then(
          () => {},
          () => {}
        );

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string");

        const options = optionsMap.get("string")!;
        options.update([1]);
        options.reject("Expected");

        let didCatch = false;
        try {
          await promise;
        } catch (error) {
          didCatch = true;
        }

        expect(didCatch).toBe(true);
      });

      it("automatically reject the stream if the loading function throws", async () => {
        load.mockImplementation(() => {
          throw Error("Expected");
        });

        const promise = cache.readAsync("string");

        // Prevent test from failing due to unhandled promise rejection
        promise.then(
          () => {},
          () => {}
        );

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string");

        let didCatch = false;
        try {
          await promise;
        } catch (error) {
          didCatch = true;
        }

        expect(didCatch).toBe(true);
      });

      it("caches values so they are only streamed once", async () => {
        const promise = cache.readAsync("string");

        const options = optionsMap.get("string")!;
        options.update([1, 2], 1);
        options.resolve();

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string");

        await promise;
        await cache.readAsync("string");

        expect(load).toHaveBeenCalledTimes(1);
      });

      it("should support additional data passed by the loader", () => {
        const streaming = cache.stream("string");
        const options = optionsMap.get("string")!;

        options.update([1], 0.5, { data: 1 });
        expect(streaming.data).toEqual({ data: 1 });

        options.update([1], 1, { data: 2 });
        expect(streaming.data).toEqual({ data: 2 });
      });
    });

    describe("stream", () => {
      it("notifies subscriber(s) of progress and completion", async () => {
        const streaming = cache.stream("string");

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string");

        const subscription = vi.fn();
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

        // Prevent test from failing due to unhandled promise rejection
        streaming.resolver.then(
          () => {},
          () => {}
        );

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string");

        const subscription = vi.fn();
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
        load.mockImplementation(() => {
          throw Error("Expected");
        });

        const streaming = cache.stream("string");

        // Prevent test from failing due to unhandled promise rejection
        streaming.resolver.then(
          () => {},
          () => {}
        );

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string");

        expect(streaming.status).toBe(STATUS_REJECTED);
      });

      it("caches values so they are only streamed once", () => {
        cache.stream("string");

        const options = optionsMap.get("string")!;
        options.update([1, 2], 1);
        options.resolve();

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string");

        const streaming = cache.stream("string");

        expect(streaming.complete).toBe(true);
        expect(streaming.value).toEqual([1, 2]);
        expect(load).toHaveBeenCalledTimes(1);
      });

      it("manages streams and subscriptions independently", () => {
        const streamingA = cache.stream("a");
        const streamingB = cache.stream("b");

        const optionsA = optionsMap.get("a")!;
        const optionsB = optionsMap.get("b")!;

        const subscriptionA = vi.fn();
        const subscriptionB = vi.fn();

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

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(expect.anything(), "string");

        const subscription = vi.fn();
        const unsubscribe = streaming.subscribe(subscription);

        const options = optionsMap.get("string")!;
        options.update([1]);
        expect(subscription).toHaveBeenCalledTimes(1);

        unsubscribe();

        options.update([1]);
        options.resolve();

        expect(subscription).toHaveBeenCalledTimes(1);
      });

      it("should support additional data passed by the loader", () => {
        const streaming = cache.stream("string");
        const options = optionsMap.get("string")!;

        options.update([1], 0.5, { data: 1 });
        expect(streaming.data).toEqual({ data: 1 });

        options.update([1], 1, { data: 2 });
        expect(streaming.data).toEqual({ data: 2 });
      });
    });
  });

  describe("development mode", () => {
    type Value = number[];

    let cache: StreamingCache<[string], Value>;
    let load: Mock<
      (options: StreamingCacheLoadOptions<Value>, key: string) => void
    >;
    let getKey: Mock<(arg: string) => string>;
    let optionsMap: Map<string, StreamingCacheLoadOptions<Value, any>>;

    beforeEach(() => {
      optionsMap = new Map();

      getKey = vi.fn();
      getKey.mockImplementation((string) => string);

      load = vi.fn();
      load.mockImplementation(
        (options: StreamingCacheLoadOptions<Value>, key: string) => {
          optionsMap.set(key, options);
        }
      );

      cache = createStreamingCache<[string], Value, any>({
        debugLabel: "cache",
        getKey,
        load,
      });
    });

    it("should warn if a key contains a stringified object", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});

      getKey.mockImplementation((string) => `${{ string }}`);

      cache.stream("one");

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching("contains a stringified object")
      );

      // Only warn once per cache though
      cache.stream("two");
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it("warns about invalid progress values", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});

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

    it("logs debug messages to console", () => {
      const consoleMock = vi.spyOn(console, "log").mockImplementation(() => {});

      cache = createStreamingCache<[string], Value, any>({
        debugLabel: "test-cache",
        debugLogging: true,
        getKey,
        load,
      });
      expect(consoleMock).toHaveBeenCalled();
      expect(consoleMock.mock.calls[0]).toEqual(
        expect.arrayContaining([
          expect.stringContaining("test-cache"),
          expect.stringContaining("Cache created"),
        ])
      );

      consoleMock.mockClear();
      cache.stream("one");
      expect(consoleMock).toHaveBeenCalled();
      expect(consoleMock.mock.calls[0]).toEqual(
        expect.arrayContaining([
          expect.stringContaining("test-cache"),
          expect.stringContaining("stream"),
          expect.stringContaining("one"),
        ])
      );

      consoleMock.mockClear();
      cache.disableDebugLogging();
      cache.stream("two");
      expect(consoleMock).not.toHaveBeenCalled();

      consoleMock.mockClear();
      cache.enableDebugLogging();
      cache.stream("three");
      expect(consoleMock).toHaveBeenCalled();
      expect(consoleMock.mock.calls[0]).toEqual(
        expect.arrayContaining([
          expect.stringContaining("test-cache"),
          expect.stringContaining("stream"),
          expect.stringContaining("three"),
        ])
      );
    });
  });
});
