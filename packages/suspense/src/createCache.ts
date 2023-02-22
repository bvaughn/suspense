import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "./constants";
import { createWakeable } from "./createWakeable";
import {
  Cache,
  Record,
  Status,
  StatusCallback,
  Thennable,
  UnsubscribeCallback,
} from "./types";
import { assertPendingRecord, isThennable } from "./utils";

export function createCache<Params extends Array<any>, Value>(
  getKey: (...params: Params) => string,
  load: (...params: Params) => Thennable<Value> | Value,
  debugLabel?: string
): Cache<Params, Value> {
  const recordMap = new Map<string, Record<Value>>();
  const subscriberMap = new Map<string, Set<StatusCallback>>();

  function cache(value: Value, ...params: Params): void {
    const cacheKey = getKey(...params);
    const record: Record<Value> = {
      status: STATUS_RESOLVED,
      value,
    };

    recordMap.set(cacheKey, record);
  }

  function evict(...params: Params): boolean {
    const cacheKey = getKey(...params);

    return recordMap.delete(cacheKey);
  }

  function getOrCreateRecord(...params: Params): Record<Value> {
    const cacheKey = getKey(...params);

    let record = recordMap.get(cacheKey);
    if (record == null) {
      const wakeable = createWakeable<Value>(
        debugLabel ? `${debugLabel} ${cacheKey}}` : cacheKey
      );

      record = {
        status: STATUS_PENDING,
        value: wakeable,
      } as Record<Value>;

      recordMap.set(cacheKey, record);

      notifySubscribers(...params);

      processPendingRecord(record, ...params);
    }

    return record;
  }

  function getStatus(...params: Params): Status | undefined {
    const cacheKey = getKey(...params);
    const record = recordMap.get(cacheKey);

    return record?.status;
  }

  function getValue(...params: Params): Value {
    const cacheKey = getKey(...params);
    const record = recordMap.get(cacheKey);

    if (record == null) {
      throw Error("No record found");
    } else if (record.status !== STATUS_RESOLVED) {
      throw Error(`Record found with status "${record.status}"`);
    } else {
      return record.value;
    }
  }

  function getValueIfCached(...params: Params): Value | undefined {
    const cacheKey = getKey(...params);
    const record = recordMap.get(cacheKey);

    if (record?.status === STATUS_RESOLVED) {
      return record.value;
    }
  }

  function prefetch(...params: Params): void {
    fetchAsync(...params);
  }

  function fetchAsync(...params: Params): Thennable<Value> | Value {
    const record = getOrCreateRecord(...params);
    switch (record.status) {
      case STATUS_PENDING:
      case STATUS_RESOLVED: {
        return record.value;
      }
      case STATUS_REJECTED: {
        throw record.value;
      }
    }
  }

  function fetchSuspense(...params: Params): Value {
    const record = getOrCreateRecord(...params);
    if (record.status === STATUS_RESOLVED) {
      return record.value;
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
    record: Record<Value>,
    ...params: Params
  ) {
    assertPendingRecord(record);

    const wakeable = record.value;

    try {
      const valueOrThennable = load(...params);
      const value = isThennable(valueOrThennable)
        ? await valueOrThennable
        : valueOrThennable;

      record.status = STATUS_RESOLVED;
      record.value = value;

      wakeable.resolve(value);
    } catch (error) {
      record.status = STATUS_REJECTED;
      record.value = error;

      wakeable.reject(error);
    } finally {
      notifySubscribers(...(params as unknown as Params));
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

  return {
    cache,
    evict,
    getStatus,
    getValue,
    getValueIfCached,
    fetchAsync,
    fetchSuspense,
    prefetch,
    subscribeToStatus,
  };
}
