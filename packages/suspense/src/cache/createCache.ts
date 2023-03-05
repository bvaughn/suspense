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
  Record,
  Status,
  StatusCallback,
  Thenable,
  UnsubscribeCallback,
} from "../types";
import { assertPendingRecord } from "../utils/assertPendingRecord";
import { isThenable } from "../utils/isThenable";
import { isPendingRecord } from "../utils/isPendingRecord";
import { defaultGetKey } from "../utils/defaultGetKey";

export type InternalCache<Params extends Array<any>, Value> = Cache<
  Params,
  Value
> & {
  __backupRecordMap: Map<string, Record<Value>>;
  __createRecordMap: () => Map<string, Record<Value>>;
  __getKey: (...params: Params) => string;
  __mutationStatusMap: Map<string, Status>;
  __notifySubscribers: (...params: Params) => void;
};

export type CreateCacheOptions<Params extends Array<any>, Value> = {
  config?: {
    useWeakRef?: boolean;
  };
  debugLabel?: string;
  getKey?: (...params: Params) => string;
  load: (...params: [...Params, CacheLoadOptions]) => Thenable<Value> | Value;
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
  const mutationStatusMap = new Map<string, Status>();

  // Stores a set of callbacks (by key) for status subscribers.
  const subscriberMap = new Map<string, Set<StatusCallback>>();

  function abort(...params: Params): boolean {
    const cacheKey = getKey(...params);
    const recordMap = getCacheForType(createRecordMap);
    const record = recordMap.get(cacheKey) ?? backupRecordMap.get(cacheKey);
    if (record && isPendingRecord(record)) {
      debugLogInDev("abort()", params);

      recordMap.delete(cacheKey);

      // Only delete the backup cache if it's the same record/request
      // Aborting a mutation should not affect the backup cache
      if (backupRecordMap.get(cacheKey) === record) {
        backupRecordMap.delete(cacheKey);
      }

      record.value.abortController.abort();

      notifySubscribers(...params);

      return true;
    }

    return false;
  }

  function cache(value: Value, ...params: Params): void {
    const cacheKey = getKey(...params);
    const recordMap = getCacheForType(createRecordMap);

    const record: Record<Value> = {
      status: STATUS_RESOLVED,
      value: null,
    };

    writeRecordValue(record, value);

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
        status: STATUS_PENDING,
        value: {
          abortController,
          deferred,
        },
      } as Record<Value>;

      backupRecordMap.set(cacheKey, record);
      recordMap.set(cacheKey, record);

      notifySubscribers(...params);

      processPendingRecord(abortController.signal, record, ...params);
    }

    return record;
  }

  function getStatus(...params: Params): Status {
    const cacheKey = getKey(...params);

    // Check for pending mutations first
    const mutationStatus = mutationStatusMap.get(cacheKey);
    if (mutationStatus != null) {
      return mutationStatus;
    }

    // Else fall back to Record status
    const record = backupRecordMap.get(cacheKey);
    return record?.status ?? STATUS_NOT_STARTED;
  }

  function getValue(...params: Params): Value {
    const cacheKey = getKey(...params);
    const record = backupRecordMap.get(cacheKey);

    if (record == null) {
      throw Error("No record found");
    } else if (record.status !== STATUS_RESOLVED) {
      throw Error(`Record found with status "${record.status}"`);
    } else {
      return readRecordValue(record);
    }
  }

  function getValueIfCached(...params: Params): Value | undefined {
    const cacheKey = getKey(...params);
    const record = backupRecordMap.get(cacheKey);

    if (record?.status === STATUS_RESOLVED) {
      return readRecordValue(record);
    }
  }

  function prefetch(...params: Params): void {
    debugLogInDev(`prefetch()`, params);

    fetchAsync(...params);
  }

  function fetchAsync(...params: Params): Thenable<Value> | Value {
    const record = getOrCreateRecord(...params);
    switch (record.status) {
      case STATUS_PENDING:
        return record.value.deferred;
      case STATUS_RESOLVED:
        return readRecordValue(record);
      case STATUS_REJECTED:
        throw record.value;
    }
  }

  function fetchSuspense(...params: Params): Value {
    const record = getOrCreateRecord(...params);
    if (record.status === STATUS_RESOLVED) {
      return readRecordValue(record);
    } else if (isPendingRecord(record)) {
      throw record.value.deferred;
    } else {
      throw record.value;
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
    record: Record<Value>,
    ...params: Params
  ) {
    assertPendingRecord(record);

    const { abortController, deferred } = record.value;

    try {
      const valueOrThenable = load(...params, abortController);
      const value = isThenable(valueOrThenable)
        ? await valueOrThenable
        : valueOrThenable;

      if (!abortSignal.aborted) {
        record.status = STATUS_RESOLVED;

        writeRecordValue(record, value);

        deferred.resolve(value);
      }
    } catch (error) {
      if (!abortSignal.aborted) {
        record.status = STATUS_REJECTED;
        record.value = error;

        deferred.reject(error);
      }
    } finally {
      if (!abortSignal.aborted) {
        notifySubscribers(...(params as unknown as Params));
      }
    }
  }

  function readRecordValue(record: Record<Value>): Value | undefined {
    const value = record.value;
    if (value instanceof WeakRef) {
      return value.deref();
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

  function writeRecordValue(record: Record<Value>, value: Value): void {
    if (useWeakRef && value != null && typeof value === "object") {
      record.value = new WeakRef(value);
    } else {
      record.value = value;
    }
  }

  const value: InternalCache<Params, Value> = {
    // Internal API (used by useCacheMutation)
    __backupRecordMap: backupRecordMap,
    __createRecordMap: createRecordMap,
    __getKey: getKey,
    __mutationStatusMap: mutationStatusMap,
    __notifySubscribers: notifySubscribers,

    // Public API
    abort,
    cache,
    evict,
    evictAll,
    getStatus,
    getValue,
    getValueIfCached,
    fetchAsync,
    fetchSuspense,
    prefetch,
    subscribeToStatus,
  };

  return value;
}
