import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "./constants";
import { createWakeable } from "./createWakeable";
import {
  StreamingCache,
  StreamingProgressNotifier,
  StreamingSubscribeCallback,
  StreamingValues,
} from "./types";
import { warnInDev } from "./utils";

// TODO Support debouncing updates

export function createStreamingCache<
  Params extends Array<any>,
  Value,
  AdditionalData = undefined
>(
  getKey: (...params: Params) => string,
  load: (notifier: StreamingProgressNotifier<Value>, ...params: Params) => void,
  debugLabel?: string
): StreamingCache<Params, Value, AdditionalData> {
  const streamingValuesMap = new Map<
    string,
    StreamingValues<Value, AdditionalData>
  >();

  function evict(...params: Params) {
    const cacheKey = getKey(...params);

    return streamingValuesMap.delete(cacheKey);
  }

  function getOrCreateStreamingValues(
    ...params: Params
  ): StreamingValues<Value, AdditionalData> {
    const cacheKey = getKey(...params);

    let cached = streamingValuesMap.get(cacheKey);
    if (cached == null) {
      const resolver = createWakeable<StreamingValues<Value, AdditionalData>>(
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

      const assertIncomplete = () => {
        if (streamingValues.complete) {
          throw Error(`Stream has already been ${streamingValues.status}`);
        }
      };

      const notifier: StreamingProgressNotifier<Value, AdditionalData> = {
        update: (values: Value[], progress?: number, data?: AdditionalData) => {
          assertIncomplete();

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
          assertIncomplete();

          streamingValues.complete = true;
          streamingValues.progress = 1;
          streamingValues.status = STATUS_RESOLVED;

          notifySubscribers();

          resolver.resolve(streamingValues);
        },
        reject: (error: Error) => {
          assertIncomplete();

          streamingValues.complete = true;
          streamingValues.status = STATUS_REJECTED;

          notifySubscribers();

          resolver.reject(error);
        },
      };

      streamingValuesMap.set(cacheKey, streamingValues);

      load(notifier, ...params);

      return streamingValues;
    }

    return cached;
  }

  function prefetch(...params: Params): void {
    getOrCreateStreamingValues(...params);
  }

  function stream(...params: Params) {
    return getOrCreateStreamingValues(...params);
  }

  return {
    evict,
    prefetch,
    stream,
  };
}
