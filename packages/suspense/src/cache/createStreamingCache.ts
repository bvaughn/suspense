import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "../constants";
import { createDeferred } from "../utils/createDeferred";
import {
  StreamingCache,
  StreamingProgressNotifier,
  StreamingSubscribeCallback,
  StreamingValues,
} from "../types";
import { warnInDev } from "../utils/warnInDev";

export function createStreamingCache<
  Params extends Array<any>,
  Value,
  AdditionalData = undefined
>(
  load: (notifier: StreamingProgressNotifier<Value>, ...params: Params) => void,
  getKey: (...params: Params) => string = defaultGetKey,
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

      loadAndCatchErrors(streamingValues, notifier, ...params);

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

  async function loadAndCatchErrors(
    streamingValues: StreamingValues<Value, AdditionalData>,
    notifier: StreamingProgressNotifier<Value, AdditionalData>,
    ...params: Params
  ) {
    try {
      await load(notifier, ...params);
    } catch (error) {
      if (streamingValues.status === STATUS_PENDING) {
        notifier.reject(error);
      }
    }
  }

  return {
    evict,
    prefetch,
    stream,
  };
}

function defaultGetKey(...params: any[]): string {
  return params.join(",");
}
