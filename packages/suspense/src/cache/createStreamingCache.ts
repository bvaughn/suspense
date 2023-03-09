import {
  STATUS_ABORTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { createDeferred } from "../utils/createDeferred";
import {
  StreamingCache,
  StreamingCacheLoadOptions,
  StreamingSubscribeCallback,
  StreamingValue,
} from "../types";
import { warnInDev } from "../utils/warnInDev";
import { defaultGetKey } from "../utils/defaultGetKey";

// Enable to help with debugging in dev
const DEBUG_LOG_IN_DEV = false;

export function createStreamingCache<
  Params extends Array<any>,
  Value,
  AdditionalData = undefined
>(options: {
  debugLabel?: string;
  getKey?: (...params: Params) => string;
  load: (
    options: StreamingCacheLoadOptions<Value, AdditionalData>,
    ...params: Params
  ) => void;
}): StreamingCache<Params, Value, AdditionalData> {
  const { debugLabel, getKey = defaultGetKey, load } = options;

  const debugLogInDev = (debug: string, params?: Params, ...args: any[]) => {
    if (DEBUG_LOG_IN_DEV && process.env.NODE_ENV !== "production") {
      const cacheKey = params ? `"${getKey(...params)}"` : "";
      const prefix = debugLabel ? `createCache[${debugLabel}]` : "createCache";

      console.log(
        `%c${prefix}`,
        "font-weight: bold; color: yellow;",
        debug,
        cacheKey,
        ...args
      );
    }
  };

  debugLogInDev("Creating cache ...");

  const abortControllerMap = new Map<string, AbortController>();
  const streamingValuesMap = new Map<
    string,
    StreamingValue<Value, AdditionalData>
  >();

  function abort(...params: Params): boolean {
    debugLogInDev("abort()", params);

    const cacheKey = getKey(...params);
    let abortController = abortControllerMap.get(cacheKey);
    if (abortController != null) {
      abortController.abort();
      return true;
    }

    return false;
  }

  function evict(...params: Params) {
    debugLogInDev("evict()", params);

    const cacheKey = getKey(...params);

    return streamingValuesMap.delete(cacheKey);
  }

  function evictAll(): boolean {
    debugLogInDev(
      `evictAll()`,
      undefined,
      `${streamingValuesMap.size} records`
    );

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
      const deferred = createDeferred<StreamingValue<Value, AdditionalData>>(
        debugLabel ? `${debugLabel}: ${cacheKey}` : cacheKey
      );

      const subscribers: Set<StreamingSubscribeCallback> = new Set();

      const streamingValues: StreamingValue<Value, AdditionalData> = {
        complete: false,
        data: undefined,
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
            warnInDev(
              progress >= 0 && progress <= 1,
              `Invalid progress: ${progress}; value must be between 0-1.`
            );

            streamingValues.progress = progress;
          }

          notifySubscribers();
        },
        resolve: () => {
          assertPending();

          streamingValues.complete = true;
          streamingValues.progress = 1;
          streamingValues.status = STATUS_RESOLVED;

          notifySubscribers();

          deferred.resolve(streamingValues);
        },
        reject: (error: Error) => {
          assertPending();

          streamingValues.complete = true;
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

    return cached;
  }

  function prefetch(...params: Params): void {
    debugLogInDev(`prefetch()`, params);

    getOrCreateStreamingValue(...params);
  }

  function stream(...params: Params) {
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
    evict,
    evictAll,
    prefetch,
    stream,
  };
}
