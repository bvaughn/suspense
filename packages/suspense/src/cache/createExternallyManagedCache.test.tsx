import {
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { ExternallyManagedCache } from "../types";
import { createExternallyManagedCache } from "./createExternallyManagedCache";

describe("createExternallyManagedCache", () => {
  let cache: ExternallyManagedCache<[string], string>;

  beforeEach(() => {
    jest.useFakeTimers();

    cache = createExternallyManagedCache({
      debugLabel: "cache",
      getKey: ([string]) => string,
      timeout: 100,
      timeoutMessage: "Custom timeout message",
    });
  });

  it("should cache values", () => {
    expect(cache.getValueIfCached("test")).toBeUndefined();
    cache.cacheValue("value", "test");
    expect(cache.getStatus("test")).toBe(STATUS_RESOLVED);
    expect(cache.getValue("test")).toBe("value");
  });

  it("should cache errors", () => {
    expect(cache.getValueIfCached("test")).toBeUndefined();
    cache.cacheError("expected error", "test");
    expect(cache.getStatus("test")).toBe(STATUS_REJECTED);
    expect(() => cache.getValue("test")).toThrow("expected error");
  });

  describe("subscribeToStatus", () => {
    let callback: jest.Mock;

    beforeEach(() => {
      callback = jest.fn();
    });

    it("should update when resolved", async () => {
      cache.subscribeToStatus(callback, "test");

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      cache.cacheValue("value", "test");

      await Promise.resolve();

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith(STATUS_PENDING);
      expect(callback).toHaveBeenCalledWith(STATUS_RESOLVED);
    });

    it("should update when rejected", async () => {
      cache.subscribeToStatus(callback, "test");

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(STATUS_NOT_FOUND);

      cache.cacheError("expected error", "test");

      await Promise.resolve();

      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenCalledWith(STATUS_PENDING);
      expect(callback).toHaveBeenCalledWith(STATUS_REJECTED);
    });
  });

  describe("timeout", () => {
    it("should reject after the specified timeout", async () => {
      const promise = cache.readAsync("test");

      jest.advanceTimersByTime(1_000);

      await expect(promise).rejects.toEqual("Custom timeout message");
    });

    it("should reject if an error is cached before the specified timeout", async () => {
      const promise = cache.readAsync("test");

      cache.cacheError("expected error", "test");

      let thrown = null;
      try {
        await promise;
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBe("expected error");
    });

    it("should resolve if an error is cached before the specified timeout", async () => {
      const promise = cache.readAsync("test");

      cache.cacheValue("value", "test");

      await expect(promise).resolves.toEqual("value");
    });

    it("should wait forever if no timeout is specified", async () => {
      cache = createExternallyManagedCache({
        debugLabel: "cache",
        getKey: ([string]) => string,
      });
      cache.readAsync("test");

      jest.advanceTimersByTime(60_000);
    });
  });
});
