import { CacheLoadOptions, ExternallyManagedCache } from "../types";
import {
  updateRecordToRejected,
  updateRecordToResolved,
} from "../utils/Record";
import { isPendingRecord } from "../utils/isRecordStatus";
import { createCache, CreateCacheOptions, InternalCache } from "./createCache";

export function createExternallyManagedCache<Params extends Array<any>, Value>(
  options: Omit<CreateCacheOptions<Params, Value>, "load"> & {
    timeout?: number;
    timeoutMessage?: string;
  }
): ExternallyManagedCache<Params, Value> {
  const { timeout, timeoutMessage = "Timed out", ...rest } = options;

  const decoratedCache = createCache<Params, Value>({
    ...rest,
    load: async (params: Params, loadOptions: CacheLoadOptions) =>
      new Promise((resolve, reject) => {
        if (timeout != null) {
          setTimeout(() => {
            if (!loadOptions.signal.aborted) {
              reject(timeoutMessage);
            }
          }, timeout);
        }
      }),
  });

  const { __getKey, __getOrCreateRecord, __notifySubscribers, __recordMap } =
    decoratedCache as InternalCache<Params, Value>;

  const { cache, ...api } = decoratedCache;

  return {
    ...api,
    cacheError(error, ...params) {
      const key = __getKey(params);
      const record = __getOrCreateRecord(...params);
      if (isPendingRecord(record)) {
        const { abortController, deferred } = record.data;

        abortController.abort();

        updateRecordToRejected(record, error);

        // Don't leave any pending request hanging
        deferred.reject(error);
      }

      __recordMap.set(key, record);
      __notifySubscribers(params);
    },
    cacheValue(value, ...params) {
      const key = __getKey(params);
      const record = __getOrCreateRecord(...params);
      if (isPendingRecord(record)) {
        const { abortController, deferred } = record.data;

        abortController.abort();

        updateRecordToResolved(record, value);

        // Don't leave any pending request hanging
        deferred.resolve(value);
      }

      __recordMap.set(key, record);
      __notifySubscribers(params);
    },
  };
}
