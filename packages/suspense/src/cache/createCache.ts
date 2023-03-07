import { unstable_getCacheForType as getCacheForType } from "react";
import {
  STATUS_NOT_STARTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { createDeferred } from "../utils/createDeferred";
import {
  Cache,
  CacheLoadOptions,
  PendingRecord,
  Record,
  ResolvedRecord,
  ResolvedRecordData,
  Status,
  StatusCallback,
  UnsubscribeCallback,
} from "../types";
import { assertPendingRecord } from "../utils/assertRecordStatus";
import { isPromiseLike } from "../utils/isPromiseLike";
import {
  isPendingRecord,
  isRejectedRecord,
  isResolvedRecord,
} from "../utils/isRecordStatus";
import { defaultGetKey } from "../utils/defaultGetKey";

export type InternalCache<Params extends Array<any>, Value> = Cache<
  Params,
  Value
> & {
  __backupRecordMap: Map<string, Record<Value>>;
  __createRecordMap: () => Map<string, Record<Value>>;
  __getKey: (...params: Params) => string;
  __mutationAbortControllerMap: Map<string, AbortController>;
  __notifySubscribers: (...params: Params) => void;
  __writeResolvedRecordData: (value: Value) => ResolvedRecordData<Value>;
};

export type CreateCacheOptions<Params extends Array<any>, Value> = {
  config?: {
    useWeakRef?: boolean;
  };
  debugLabel?: string;
  getKey?: (...params: Params) => string;
  load: (
    ...params: [...Params, CacheLoadOptions]
  ) => PromiseLike<Value> | Value;
};

// Enable to help with debugging in dev
const DEBUG_LOG_IN_DEV = false;

export function createCache<Params extends Array<any>, Value>(
  options: CreateCacheOptions<Params, Value>
): Cache<Params, Value> {
  const { config = {}, debugLabel, getKey = defaultGetKey, load } = options;
  const { useWeakRef = true } = config;

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

  // This map enables selective mutations to be scheduled with React
  // (one record can be invalidated without affecting others)
  // Reads will query the map created by createRecordMap first,
  // and fall back to this map if no match is found
  const backupRecordMap = new Map<string, Record<Value>>();

  // Stores status of in-progress mutation
  // If no entry is present here, the Record map will be used instead
  // Storing this information separately enables status to be updated during mutation
  // without modifying the actual record (which may trigger an unintentional update/fallback)
  const mutationAbortControllerMap = new Map<string, AbortController>();

  // Stores a set of callbacks (by key) for status subscribers.
  const subscriberMap = new Map<string, Set<StatusCallback>>();

  function abort(...params: Params): boolean {
    const cacheKey = getKey(...params);
    const recordMap = getCacheForType(createRecordMap);

    // TODO In-progress mutations aren't in the recordMap.
    // We should probably use the mutationAbortControllerMap for this instead.
    const abortController = mutationAbortControllerMap.get(cacheKey);
    if (abortController) {
      debugLogInDev("abort()", params);

      abortController.abort();

      notifySubscribers(...params);

      return true;
    } else {
      const record = recordMap.get(cacheKey) ?? backupRecordMap.get(cacheKey);
      if (record && isPendingRecord(record)) {
        debugLogInDev("abort()", params);

        recordMap.delete(cacheKey);

        // Only delete the backup cache if it's the same record/request
        // Aborting a mutation should not affect the backup cache
        if (backupRecordMap.get(cacheKey) === record) {
          backupRecordMap.delete(cacheKey);
        }

        record.data.abortController.abort();

        notifySubscribers(...params);

        return true;
      }
    }

    return false;
  }

  function cache(value: Value, ...params: Params): void {
    const cacheKey = getKey(...params);
    const recordMap = getCacheForType(createRecordMap);

    const record: ResolvedRecord<Value> = {
      data: writeResolvedRecordData<Value>(value),
    };

    debugLogInDev("cache()", params, value);

    backupRecordMap.set(cacheKey, record);
    recordMap.set(cacheKey, record);
  }

  function createRecordMap(): Map<string, Record<Value>> {
    return new Map();
  }

  function evict(...params: Params): boolean {
    const cacheKey = getKey(...params);
    const recordMap = getCacheForType(createRecordMap);

    debugLogInDev(`evict()`, params);

    const didDelete = backupRecordMap.delete(cacheKey);
    recordMap.delete(cacheKey);

    return didDelete;
  }

  function evictAll(): boolean {
    const recordMap = getCacheForType(createRecordMap);

    debugLogInDev(`evictAll()`, undefined, `${recordMap.size} records`);

    const hadRecords = recordMap.size > 0 || backupRecordMap.size > 0;

    backupRecordMap.clear();
    recordMap.clear();

    return hadRecords;
  }

  function getOrCreateRecord(...params: Params): Record<Value> {
    const cacheKey = getKey(...params);
    const recordMap = getCacheForType(createRecordMap);

    let record = recordMap.get(cacheKey) ?? backupRecordMap.get(cacheKey);
    if (record == null) {
      const abortController = new AbortController();
      const deferred = createDeferred<Value>(
        debugLabel ? `${debugLabel} ${cacheKey}}` : cacheKey
      );

      record = {
        data: {
          abortController,
          deferred,
          status: STATUS_PENDING,
        },
      } as Record<Value>;

      backupRecordMap.set(cacheKey, record);
      recordMap.set(cacheKey, record);

      notifySubscribers(...params);

      processPendingRecord(
        abortController.signal,
        record as PendingRecord<Value>,
        ...params
      );
    }

    return record;
  }

  function getStatus(...params: Params): Status {
    const cacheKey = getKey(...params);

    // Check for pending mutations first
    if (mutationAbortControllerMap.has(cacheKey)) {
      return STATUS_PENDING;
    }

    // Else fall back to Record status
    const record = backupRecordMap.get(cacheKey);
    return record?.data?.status ?? STATUS_NOT_STARTED;
  }

  function getValue(...params: Params): Value {
    const cacheKey = getKey(...params);
    const record = backupRecordMap.get(cacheKey);

    // TODO [GC] Add test for this case
    if (record == null) {
      throw Error("No record found");
    } else if (isRejectedRecord(record)) {
      throw record.data.error;
    } else if (isResolvedRecord(record)) {
      return readRecordValue(record);
    } else {
      throw Error(`Record found with status "${record.data.status}"`);
    }
  }

  function getValueIfCached(...params: Params): Value | undefined {
    const cacheKey = getKey(...params);
    const record = backupRecordMap.get(cacheKey);

    if (record && isResolvedRecord(record)) {
      return readRecordValue(record);
    }
  }

  function prefetch(...params: Params): void {
    debugLogInDev(`prefetch()`, params);

    readAsync(...params);
  }

  function readAsync(...params: Params): PromiseLike<Value> | Value {
    const record = getOrCreateRecord(...params);
    if (isPendingRecord(record)) {
      return record.data.deferred;
    } else if (isResolvedRecord(record)) {
      const { weakRef, value } = record.data;
      if (weakRef) {
        const retainedValue = weakRef.deref();
        if (retainedValue == null) {
          // If the value is null, it has been garbage collected since we last read it.
          // In that case, we should delete the record and try again.
          evict(...params);
          return readAsync(...params);
        } else {
          return retainedValue;
        }
      }
      return value;
    } else {
      throw record.data.error;
    }
  }

  function read(...params: Params): Value {
    const record = getOrCreateRecord(...params);
    if (isPendingRecord(record)) {
      throw record.data.deferred;
    } else if (isResolvedRecord(record)) {
      const { weakRef, value } = record.data;
      if (weakRef) {
        const retainedValue = weakRef.deref();
        if (retainedValue == null) {
          // If the value is null, it has been garbage collected since we last read it.
          // In that case, we should delete the record and try again.
          evict(...params);
          return read(...params);
        } else {
          return retainedValue;
        }
      }
      return value;
    } else {
      throw record.data.error;
    }
  }

  function notifySubscribers(...params: Params): void {
    const cacheKey = getKey(...params);
    const set = subscriberMap.get(cacheKey);
    if (set) {
      const status = getStatus(...params);
      set.forEach((callback) => {
        callback(status);
      });
    }
  }

  async function processPendingRecord(
    abortSignal: AbortSignal,
    record: PendingRecord<Value>,
    ...params: Params
  ) {
    assertPendingRecord(record);

    const { abortController, deferred } = record.data;

    try {
      const valueOrPromiseLike = load(...params, abortController);
      const value = isPromiseLike(valueOrPromiseLike)
        ? await valueOrPromiseLike
        : valueOrPromiseLike;

      if (!abortSignal.aborted) {
        (record as Record<Value>).data = writeResolvedRecordData<Value>(value);

        deferred.resolve(value);
      }
    } catch (error) {
      if (!abortSignal.aborted) {
        (record as Record<Value>).data = {
          error,
          status: STATUS_REJECTED,
        };

        deferred.reject(error);
      }
    } finally {
      if (!abortSignal.aborted) {
        notifySubscribers(...(params as unknown as Params));
      }
    }
  }

  function readRecordValue(record: ResolvedRecord<Value>): Value | undefined {
    const { weakRef, value } = record.data;
    if (weakRef !== null) {
      return weakRef.deref();
    } else {
      return value;
    }
  }

  function subscribeToStatus(
    callback: StatusCallback,
    ...params: Params
  ): UnsubscribeCallback {
    const cacheKey = getKey(...params);
    let set = subscriberMap.get(cacheKey);
    if (set) {
      set.add(callback);
    } else {
      set = new Set([callback]);
      subscriberMap.set(cacheKey, set);
    }

    try {
      const status = getStatus(...params);

      callback(status);
    } finally {
      return () => {
        set!.delete(callback);
        if (set!.size === 0) {
          subscriberMap.delete(cacheKey);
        }
      };
    }
  }

  function writeResolvedRecordData<Value>(
    value: Value
  ): ResolvedRecordData<Value> {
    if (useWeakRef && value != null && typeof value === "object") {
      return {
        status: STATUS_RESOLVED,
        value: null,
        weakRef: new WeakRef(value) as any,
      };
    } else {
      return {
        status: STATUS_RESOLVED,
        value,
        weakRef: null,
      };
    }
  }

  const value: InternalCache<Params, Value> = {
    // Internal API (used by useCacheMutation)
    __backupRecordMap: backupRecordMap,
    __createRecordMap: createRecordMap,
    __getKey: getKey,
    __mutationAbortControllerMap: mutationAbortControllerMap,
    __notifySubscribers: notifySubscribers,
    __writeResolvedRecordData: writeResolvedRecordData,

    // Public API
    abort,
    cache,
    evict,
    evictAll,
    getStatus,
    getValue,
    getValueIfCached,
    readAsync,
    read,
    prefetch,
    subscribeToStatus,
  };

  return value;
}
