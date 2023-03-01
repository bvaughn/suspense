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
  StreamingValues,
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
  load: (options: StreamingCacheLoadOptions<Value>, ...params: Params) => void;
}): StreamingCache<Params, Value, AdditionalData> {
  const { debugLabel, getKey = defaultGetKey, load } = options;

  const debugLogInDev = (debug: string, params?: Params, ...args: any[]) => {
    if (DEBUG_LOG_IN_DEV && process.env.NODE_ENV === "development") {
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
    StreamingValues<Value, AdditionalData>
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

  function getOrCreateStreamingValues(
    ...params: Params
  ): StreamingValues<Value, AdditionalData> {
    const cacheKey = getKey(...params);

    let cached = streamingValuesMap.get(cacheKey);
    if (cached == null) {
      const resolver = createDeferred<StreamingValues<Value, AdditionalData>>(
        debugLabel ? `${debugLabel}: ${cacheKey}` : cacheKey
      );

      const subscribers: Set<StreamingSubscribeCallback> = new Set();

      const streamingValues: StreamingValues<Value, AdditionalData> = {
        complete: false,
        data: undefined,
        progress: undefined,
        resolver,
        status: STATUS_PENDING,
        subscribe: (callback: StreamingSubscribeCallback) => {
          subscribers.add(callback);
          return () => {
            subscribers.delete(callback);
          };
        },
        values: undefined,
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

        resolver.resolve();
      });

      abortControllerMap.set(cacheKey, abortController);

      const options: StreamingCacheLoadOptions<Value, AdditionalData> = {
        update: (values: Value[], progress?: number, data?: AdditionalData) => {
          assertPending();

          streamingValues.data = data;

          if (streamingValues.values == null) {
            streamingValues.values = [...values];
          } else {
            streamingValues.values = streamingValues.values.concat(...values);
          }

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

          resolver.resolve(streamingValues);
        },
        reject: (error: Error) => {
          assertPending();

          streamingValues.complete = true;
          streamingValues.status = STATUS_REJECTED;

          notifySubscribers();

          resolver.reject(error);
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

    getOrCreateStreamingValues(...params);
  }

  function stream(...params: Params) {
    return getOrCreateStreamingValues(...params);
  }

  async function loadAndCatchErrors(
    cacheKey: string,
    streamingValues: StreamingValues<Value, AdditionalData>,
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
