import {
  configure as configureIntervalUtilities,
  Interval,
} from "interval-utilities";
import { configure as configurePointUtilities } from "point-utilities";

import {
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../../constants";
import {
  IntervalCacheLoadOptions,
  ComparisonFunction,
  GetPointForValue,
  PendingRecord,
  IntervalCache,
  Record,
  StatusCallback,
} from "../../types";
import { assertPendingRecord } from "../../utils/assertRecordStatus";
import { createDeferred } from "../../utils/createDeferred";
import { defaultGetKey } from "../../utils/defaultGetKey";
import {
  isPendingRecord,
  isRejectedRecord,
  isResolvedRecord,
} from "../../utils/isRecordStatus";
import { findIntervals } from "./findIntervals";
import { sliceValues } from "./sliceValues";
import { isPromiseLike } from "../../utils/isPromiseLike";

// Enable to help with debugging in dev
const DEBUG_LOG_IN_DEV = false;

type SerializableToString = { toString(): string };

type PendingMetadata<Point, Value> = {
  interval: Interval<Point>;
  record: PendingRecord<Value[]>;
  value: PromiseLike<Value[]> | Value[];
};

type Metadata<Point, Value> = {
  failedIntervals: Interval<Point>[];
  loadedIntervals: Interval<Point>[];
  pendingMetadata: PendingMetadata<Point, Value>[];
  recordMap: Map<string, Record<Value[]>>;
  sortedValues: Value[];
};

export function createIntervalCache<
  Point extends SerializableToString,
  Params extends Array<any>,
  Value
>(options: {
  comparePoints?: ComparisonFunction<Point>;
  debugLabel?: string;
  getKey?: (...params: Params) => string;
  getPointForValue: GetPointForValue<Point, Value>;
  load: (
    start: Point,
    end: Point,
    ...params: [...Params, IntervalCacheLoadOptions]
  ) => PromiseLike<Value[]> | Value[];
}): IntervalCache<Point, Params, Value> {
  const {
    comparePoints = defaultComparePoints,
    debugLabel,
    getKey = defaultGetKey,
    getPointForValue,
    load,
  } = options;

  const intervalUtils = configureIntervalUtilities<Point>(comparePoints);
  const pointUtils = configurePointUtilities<Point>(comparePoints);

  const metadataMap = new Map<string, Metadata<Point, Value>>();

  // Subscribers are stored in a two-level Map:
  // First a key constructed from the params Array (getKey) points to another Map,
  // Then a key constructed from the interval Array points to a Set of subscribers
  const subscriberMap = new Map<string, Map<string, Set<StatusCallback>>>();

  const debugLogInDev = (debug: string, params?: Params, ...args: any[]) => {
    if (DEBUG_LOG_IN_DEV && process.env.NODE_ENV !== "production") {
      const cacheKey = params ? `"${getKey(...params)}"` : "";
      const prefix = debugLabel
        ? `createIntervalCache[${debugLabel}]`
        : "createIntervalCache";

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

  function abort(...params: Params): boolean {
    const metadataMapKey = getKey(...params);

    let caught;

    let metadata = metadataMap.get(metadataMapKey);
    if (metadata) {
      const { pendingMetadata } = metadata;
      if (pendingMetadata.length > 0) {
        debugLogInDev("abort()", params);

        for (let { interval, record } of pendingMetadata) {
          try {
            const [start, end] = interval;

            const recordKey = `${start}–${end}`;
            metadata.recordMap.delete(recordKey);

            record.data.abortController.abort();

            notifySubscribers(start, end, ...params);
          } catch (error) {
            caught = error;
          }
        }

        pendingMetadata.splice(0);

        if (caught !== undefined) {
          throw caught;
        }

        return true;
      }
    }

    return false;
  }

  function evict(...params: Params): boolean {
    debugLogInDev("evict()", params);

    const cacheKey = getKey(...params);
    const result = metadataMap.delete(cacheKey);

    const map = subscriberMap.get(cacheKey);
    if (map) {
      map.forEach((subscribers) => {
        subscribers.forEach((callback) => callback(STATUS_NOT_FOUND));
      });
    }

    return result;
  }

  function evictAll(): boolean {
    debugLogInDev(`evictAll()`, undefined, `${metadataMap.size} records`);

    const hadValues = metadataMap.size > 0;

    metadataMap.clear();

    subscriberMap.forEach((map) => {
      map.forEach((subscribers) => {
        subscribers.forEach((callback) => callback(STATUS_NOT_FOUND));
      });
    });

    return hadValues;
  }

  function getOrCreateIntervalMetadata(
    ...params: Params
  ): Metadata<Point, Value> {
    const cacheKey = getKey(...params);
    let metadata = metadataMap.get(cacheKey);
    if (metadata == null) {
      metadata = {
        failedIntervals: [],
        loadedIntervals: [],
        pendingMetadata: [],
        recordMap: new Map(),
        sortedValues: [],
      };

      metadataMap.set(cacheKey, metadata);
    }
    return metadata;
  }

  function getOrCreateRecord(
    start: Point,
    end: Point,
    ...params: Params
  ): Record<Value[]> {
    const metadata = getOrCreateIntervalMetadata(...params);
    const cacheKey = `${start}–${end}`;

    let record = metadata.recordMap.get(cacheKey);
    if (record == null) {
      const abortController = new AbortController();
      const deferred = createDeferred<Value[]>(
        debugLabel ? `${debugLabel}: ${cacheKey}` : `${cacheKey}`
      );

      record = {
        data: {
          abortController,
          deferred,
          status: STATUS_PENDING,
        },
      };

      metadata.recordMap.set(cacheKey, record);

      notifySubscribers(start, end, ...params);

      processPendingRecord(
        metadata,
        record as PendingRecord<Value[]>,
        start,
        end,
        ...params
      );
    }

    return record;
  }

  function getStatus(start: Point, end: Point, ...params: Params) {
    const metadata = getOrCreateIntervalMetadata(...params);
    const cacheKey = `${start}–${end}`;

    let record = metadata.recordMap.get(cacheKey);
    if (!record) {
      return STATUS_NOT_FOUND;
    }

    return record.data.status;
  }

  function getValue(start: Point, end: Point, ...params: Params): Value[] {
    debugLogInDev(`getValue(${start}, ${end})`, params);

    const metadata = getOrCreateIntervalMetadata(...params);
    const cacheKey = `${start}–${end}`;

    const record = metadata.recordMap.get(cacheKey);
    if (record == null) {
      throw Error("No record found");
    } else if (isRejectedRecord(record)) {
      throw record.data.error;
    } else if (isResolvedRecord(record)) {
      return record.data.value;
    } else {
      throw Error(`Record found with status "${record.data.status}"`);
    }
  }

  function getValueIfCached(
    start: Point,
    end: Point,
    ...params: Params
  ): Value[] | undefined {
    debugLogInDev(`getValueIfCached(${start}, ${end})`, params);

    const metadata = getOrCreateIntervalMetadata(...params);
    const cacheKey = `${start}–${end}`;

    const record = metadata.recordMap.get(cacheKey);
    if (record && isResolvedRecord(record)) {
      return record.data.value;
    }
  }

  function notifySubscribers(
    start: Point,
    end: Point,
    ...params: Params
  ): void {
    const cacheKey = getKey(...params);
    const map = subscriberMap.get(cacheKey);
    if (map) {
      const intervalKey = `${start}–${end}`;
      const set = map.get(intervalKey);
      if (set) {
        const status = getStatus(start, end, ...params);
        set.forEach((callback) => {
          callback(status);
        });
      }
    }
  }

  async function processPendingInterval(
    metadata: Metadata<Point, Value>,
    pendingMetadata: PendingMetadata<Point, Value>,
    start: Point,
    end: Point
  ) {
    const { record, value } = pendingMetadata;

    assertPendingRecord(record);

    const { abortController } = record.data;

    let values;
    try {
      values = isPromiseLike(value) ? await value : value;

      if (abortController.signal.aborted) {
        // Ignore results if the request was aborted
        return;
      }

      metadata.loadedIntervals = intervalUtils.mergeAll(
        ...intervalUtils.sort(...metadata.loadedIntervals, [start, end])
      );

      const sortedPoints = metadata.sortedValues.map(getPointForValue);

      // Check for duplicate values near the edges because of how intervals are split
      if (values.length > 0) {
        const firstValue = values[0];
        const index = pointUtils.findIndex(
          sortedPoints,
          getPointForValue(firstValue)
        );
        if (index >= 0) {
          values.splice(0, 1);
        }
      }
      if (values.length > 0) {
        const lastValue = values[values.length - 1];
        const index = pointUtils.findIndex(
          sortedPoints,
          getPointForValue(lastValue)
        );
        if (index >= 0) {
          values.pop();
        }
      }

      // Merge any remaining unique values
      if (values.length > 0) {
        const firstValue = values[0];
        const index = pointUtils.findNearestIndexAfter(
          sortedPoints,
          getPointForValue(firstValue)
        );
        metadata.sortedValues.splice(index, 0, ...values);
      }
    } catch (error) {
      // Ignore the error here;
      // the caller will handle it.

      metadata.failedIntervals = intervalUtils.mergeAll(
        ...intervalUtils.sort(...metadata.failedIntervals, [start, end])
      );
    } finally {
      const index = metadata.pendingMetadata.indexOf(pendingMetadata);
      metadata.pendingMetadata.splice(index, 1);
    }
  }

  async function processPendingRecord(
    metadata: Metadata<Point, Value>,
    record: Record<Value[]>,
    start: Point,
    end: Point,
    ...params: Params
  ) {
    assertPendingRecord(record);

    const { abortController, deferred } = (record as PendingRecord<Value[]>)
      .data;
    const { signal } = abortController;

    const foundIntervals = findIntervals<Point>(
      {
        loaded: metadata.loadedIntervals,
        pending: metadata.pendingMetadata.map(({ interval }) => interval),
      },
      [start, end],
      intervalUtils
    );

    debugLogInDev(
      `processPendingRecord(${start}, ${end})`,
      params,
      "\n-> metadata:",
      metadata,
      "\n-> found:",
      foundIntervals
    );

    // If any of the unloaded intervals contain a failed request,
    // we shouldn't try loading them again
    // This is admittedly somewhat arbitrary but matches Replay's functionality
    const previouslyFailedInterval = foundIntervals.missing.find(
      (missingInterval) =>
        metadata.failedIntervals.find((failedInterval) =>
          intervalUtils.contains(missingInterval, failedInterval)
        )
    );
    if (previouslyFailedInterval != null) {
      const error = Error(
        `Cannot load interval that contains previously failed interval`
      );
      record.data = {
        error,
        status: STATUS_REJECTED,
      };

      deferred.reject(error);

      notifySubscribers(start, end, ...params);

      return;
    }

    const missingPromiseLikes: Array<Value[] | PromiseLike<Value[]>> = [];
    foundIntervals.missing.forEach(([start, end]) => {
      const thenable = load(start, end, ...params, abortController);

      missingPromiseLikes.push(thenable);

      const pendingMetadata: PendingMetadata<Point, Value> = {
        interval: [start, end],
        record: record as PendingRecord<Value[]>,
        value: thenable,
      };

      metadata.pendingMetadata.push(pendingMetadata);

      processPendingInterval(metadata, pendingMetadata, start, end);
    });

    // Gather all of the deferred requests the new interval blocks on.
    // Can we make this more efficient than a nested loop?
    // It's tricky since requests initiated separately (e.g. [1,2] and [2,4])
    // may end up reported as single/merged blocker (e.g. [1,3])
    const pendingPromiseLikes: Array<Value[] | PromiseLike<Value[]>> = [];
    foundIntervals.pending.forEach(([start, end]) => {
      metadata.pendingMetadata.forEach(({ interval, value }) => {
        if (intervalUtils.contains(interval, [start, end])) {
          pendingPromiseLikes.push(value);
        }
      });
    });

    try {
      const values = await Promise.all([
        ...missingPromiseLikes,
        ...pendingPromiseLikes,
      ]);

      debugLogInDev(
        `processPendingRecord(${start}, ${end}): resolved`,
        params,
        values
      );

      if (!signal.aborted) {
        record.data = {
          status: STATUS_RESOLVED,
          value: sliceValues<Point, Value>(
            metadata.sortedValues,
            start,
            end,
            getPointForValue,
            pointUtils
          ),
        };

        deferred.resolve(record.data.value);

        notifySubscribers(start, end, ...params);
      }
    } catch (error) {
      let errorMessage = "Unknown Error";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      debugLogInDev(
        `processPendingRecord(${start}, ${end}): failed`,
        params,
        errorMessage
      );

      if (!signal.aborted) {
        record.data = {
          error,
          status: STATUS_REJECTED,
        };

        deferred.reject(error);

        notifySubscribers(start, end, ...params);
      }
    }
  }

  function read(start: Point, end: Point, ...params: Params): Value[] {
    debugLogInDev(`read(${start}, ${end})`, params);

    const record = getOrCreateRecord(start, end, ...params);
    if (record.data.status === STATUS_RESOLVED) {
      return record.data.value as Value[];
    } else if (isPendingRecord(record)) {
      throw record.data.deferred.promise;
    } else {
      throw record.data.error;
    }
  }

  function readAsync(
    start: Point,
    end: Point,
    ...params: Params
  ): PromiseLike<Value[]> | Value[] {
    debugLogInDev(`readAsync(${start}, ${end})`, params);

    const record = getOrCreateRecord(start, end, ...params);
    switch (record.data.status) {
      case STATUS_PENDING:
        return record.data.deferred.promise;
      case STATUS_RESOLVED:
        return record.data.value as Value[];
      case STATUS_REJECTED:
        throw record.data.error;
    }
  }

  function subscribeToStatus(
    callback: StatusCallback,
    start: Point,
    end: Point,
    ...params: Params
  ) {
    const cacheKey = getKey(...params);
    let map = subscriberMap.get(cacheKey);
    if (!map) {
      map = new Map();
      subscriberMap.set(cacheKey, map);
    }

    const intervalKey = `${start}–${end}`;
    let set = map.get(intervalKey);
    if (set) {
      set.add(callback);
    } else {
      set = new Set([callback]);
      map.set(intervalKey, set);
    }

    try {
      const status = getStatus(start, end, ...params);

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
    abort,
    evict,
    evictAll,
    getStatus,
    getValue,
    getValueIfCached,
    readAsync,
    read,
    subscribeToStatus,
  };
}

function defaultComparePoints(a: any, b: any): number {
  return a - b;
}
