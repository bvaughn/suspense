import { isDevelopment } from "#is-development";
import {
  STATUS_ABORTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import {
  StreamingCache,
  StreamingCacheLoadOptions,
  StreamingSubscribeCallback,
  StreamingValue,
} from "../types";
import { assert } from "../utils/assert";
import { createDeferred } from "../utils/createDeferred";
import { log } from "../utils/debugging";
import { defaultGetKey } from "../utils/defaultGetKey";

export function createStreamingCache<
  Params extends Array<any>,
  Value,
  AdditionalData = undefined
>(options: {
  debugLabel?: string;
  debugLogging?: boolean;
  getKey?: (...params: Params) => string;
  load: (
    options: StreamingCacheLoadOptions<Value, AdditionalData>,
    ...params: Params
  ) => void;
}): StreamingCache<Params, Value, AdditionalData> {
  let { debugLabel, debugLogging, getKey = defaultGetKey, load } = options;

  if (isDevelopment) {
    let didLogWarning = false;
    let decoratedGetKey = getKey;

    getKey = (...params: Params) => {
      const key = decoratedGetKey(...params);

      if (!didLogWarning) {
        if (key.includes("[object Object]")) {
          didLogWarning = true;
          console.warn(
            `Warning: createCache() key "${key}" contains a stringified object and may not be unique`
          );
        }
      }

      return key;
    };
  }

  const debugLog = (message: string, params?: Params, ...args: any[]) => {
    const cacheKey = params ? `"${getKey(...params)}"` : "";
    const prefix = debugLabel ? `createCache[${debugLabel}]` : "createCache";

    log(debugLogging, [
      `%c${prefix}`,
      "font-weight: bold; color: yellow;",
      message,
      cacheKey,
      ...args,
    ]);
  };

  debugLog("Cache created");

  const abortControllerMap = new Map<string, AbortController>();
  const streamingValuesMap = new Map<
    string,
    StreamingValue<Value, AdditionalData>
  >();

  function abort(...params: Params): boolean {
    debugLog("abort()", params);

    const cacheKey = getKey(...params);
    let abortController = abortControllerMap.get(cacheKey);
    if (abortController != null) {
      abortController.abort();
      return true;
    }

    return false;
  }

  function disableDebugLogging() {
    debugLogging = false;
  }

  function enableDebugLogging() {
    debugLogging = true;
  }

  function evict(...params: Params) {
    debugLog("evict()", params);

    const cacheKey = getKey(...params);

    return streamingValuesMap.delete(cacheKey);
  }

  function evictAll(): boolean {
    debugLog("evictAll()");

    const hadValues = streamingValuesMap.size > 0;

    streamingValuesMap.clear();

    return hadValues;
  }

  function getOrCreateStreamingValue(
    ...params: Params
  ): StreamingValue<Value, AdditionalData> {
    const cacheKey = getKey(...params);

    let cached = streamingValuesMap.get(cacheKey);
    if (cached == null) {
      debugLog("stream() Cache miss", params);

      const deferred = createDeferred<StreamingValue<Value, AdditionalData>>(
        debugLabel ? `${debugLabel}: ${cacheKey}` : cacheKey
      );

      const subscribers: Set<StreamingSubscribeCallback> = new Set();

      const streamingValues: StreamingValue<Value, AdditionalData> = {
        complete: false,
        data: undefined,
        error: undefined,
        progress: undefined,
        resolver: deferred.promise,
        status: STATUS_PENDING,
        subscribe: (callback: StreamingSubscribeCallback) => {
          subscribers.add(callback);
          return () => {
            subscribers.delete(callback);
          };
        },
        value: undefined,
      };

      const notifySubscribers = () => {
        subscribers.forEach((subscriber) => {
          try {
            subscriber();
          } catch (error) {}
        });
      };

      const assertPending = () => {
        if (streamingValues.status !== STATUS_PENDING) {
          throw Error(
            `Stream with status "${streamingValues.status}" cannot be updated`
          );
        }
      };

      const abortController = new AbortController();
      abortController.signal.addEventListener("abort", () => {
        if (streamingValues.complete) {
          return false;
        }

        debugLog(`stream() Pending request aborted`, params);

        streamingValues.status = STATUS_ABORTED;

        streamingValuesMap.delete(cacheKey);

        notifySubscribers();

        deferred.resolve();
      });

      abortControllerMap.set(cacheKey, abortController);

      const options: StreamingCacheLoadOptions<Value, AdditionalData> = {
        update: (value: Value, progress?: number, data?: AdditionalData) => {
          assertPending();

          streamingValues.data =
            data == undefined ? streamingValues.data : data;
          streamingValues.value = value;

          if (progress != null) {
            if (isDevelopment) {
              if (progress < 0 || progress > 1) {
                console.warn(
                  `Invalid progress: ${progress}; value must be between 0-1.`
                );
              }
            }

            streamingValues.progress = progress;
          }

          notifySubscribers();
        },
        resolve: () => {
          debugLog(`stream() Pending request resolved`, params);

          assertPending();

          streamingValues.complete = true;
          streamingValues.progress = 1;
          streamingValues.status = STATUS_RESOLVED;

          notifySubscribers();

          deferred.resolve(streamingValues);
        },
        reject: (error: Error) => {
          debugLog(`stream() Pending request rejected`, params);

          assertPending();

          streamingValues.complete = true;
          streamingValues.error = error;
          streamingValues.status = STATUS_REJECTED;

          notifySubscribers();

          deferred.reject(error);
        },
        signal: abortController.signal,
      };

      streamingValuesMap.set(cacheKey, streamingValues);

      loadAndCatchErrors(cacheKey, streamingValues, options, ...params);

      return streamingValues;
    }

    debugLog("stream() Cache hit", params);

    return cached;
  }

  function prefetch(...params: Params): void {
    debugLog("prefetch()", params);

    getOrCreateStreamingValue(...params);
  }

  function read(...params: Params) {
    const { data, error, status, resolver, value } = stream(...params);
    switch (status) {
      case STATUS_PENDING:
        throw resolver;
      case STATUS_REJECTED:
        throw error;
      case STATUS_RESOLVED:
        assert(value != null);
        return { data, value };
      default:
        throw new Error(`Unexpected cache status "${status}"`);
    }
  }

  async function readAsync(...params: Params) {
    const { resolver } = stream(...params);
    const { data, value } = await resolver;
    return { data, value };
  }

  function stream(...params: Params) {
    // getOrCreateStreamingValue() will call debugLog (cache hit or miss)
    return getOrCreateStreamingValue(...params);
  }

  async function loadAndCatchErrors(
    cacheKey: string,
    streamingValues: StreamingValue<Value, AdditionalData>,
    options: StreamingCacheLoadOptions<Value, AdditionalData>,
    ...params: Params
  ) {
    try {
      await load(options, ...params);
    } catch (error) {
      if (streamingValues.status === STATUS_PENDING) {
        options.reject(error);
      }
    } finally {
      abortControllerMap.delete(cacheKey);
    }
  }

  return {
    abort,
    disableDebugLogging,
    enableDebugLogging,
    evict,
    evictAll,
    prefetch,
    read,
    readAsync,
    stream,
  };
}
