import {
  configure as configureIntervalUtilities,
  Interval,
} from "interval-utilities";

import {
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
  Thenable,
} from "../../types";
import { assertPendingRecord } from "../../utils/assertPendingRecord";
import { createDeferred } from "../../utils/createDeferred";
import { defaultGetKey } from "../../utils/defaultGetKey";
import { isPendingRecord } from "../../utils/isPendingRecord";
import { findIntervals } from "./findIntervals";
import { findIndex, findNearestIndexAfter } from "./findIndex";
import { sliceValues } from "./sliceValues";
import { isThenable } from "../../utils/isThenable";

// Enable to help with debugging in dev
const DEBUG_LOG_IN_DEV = false;

type SerializableToString = { toString(): string };

type PendingMetadata<Point, Value> = {
  interval: Interval<Point>;
  record: Record<Value[]>;
  value: Thenable<Value[]> | Value[];
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
  ) => Thenable<Value[]> | Value[];
}): IntervalCache<Point, Params, Value> {
  const {
    comparePoints = defaultComparePoints,
    debugLabel,
    getKey = defaultGetKey,
    getPointForValue,
    load,
  } = options;

  const intervalUtils = configureIntervalUtilities<Point>(comparePoints);

  const metadataMap = new Map<string, Metadata<Point, Value>>();

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

            record.value.abortController.abort();
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
    return metadataMap.delete(cacheKey);
  }

  function evictAll(): boolean {
    debugLogInDev(`evictAll()`, undefined, `${metadataMap.size} records`);

    const hadValues = metadataMap.size > 0;

    metadataMap.clear();

    return hadValues;
  }

  function fetchAsync(
    start: Point,
    end: Point,
    ...params: Params
  ): Thenable<Value[]> | Value[] {
    debugLogInDev(`fetchAsync(${start}, ${end})`, params);

    const record = getOrCreateRecord(start, end, ...params);
    switch (record.status) {
      case STATUS_PENDING:
        return record.value.deferred;
      case STATUS_RESOLVED:
        return record.value;
      case STATUS_REJECTED:
        throw record.value;
    }
  }

  function fetchSuspense(start: Point, end: Point, ...params: Params): Value[] {
    debugLogInDev(`fetchSuspense(${start}, ${end})`, params);

    const record = getOrCreateRecord(start, end, ...params);
    if (record.status === STATUS_RESOLVED) {
      return record.value;
    } else if (isPendingRecord(record)) {
      throw record.value.deferred;
    } else {
      throw record.value;
    }
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
        status: STATUS_PENDING,
        value: {
          abortController,
          deferred,
        },
      } as Record<Value[]>;

      metadata.recordMap.set(cacheKey, record);

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

  async function processPendingInterval(
    metadata: Metadata<Point, Value>,
    pendingMetadata: PendingMetadata<Point, Value>,
    start: Point,
    end: Point
  ) {
    const { record, value } = pendingMetadata;

    assertPendingRecord(record);

    const { abortController } = record.value;

    let values;
    try {
      values = isThenable(value) ? await value : value;

      if (abortController.signal.aborted) {
        // Ignore results if the request was aborted
        return;
      }

      metadata.loadedIntervals = intervalUtils.mergeAll(
        ...intervalUtils.sort(...metadata.loadedIntervals, [start, end])
      );

      // Check for duplicate values near the edges because of how intervals are split
      if (values.length > 0) {
        const firstValue = values[0];
        const index = findIndex(
          metadata.sortedValues,
          getPointForValue(firstValue),
          getPointForValue,
          comparePoints
        );
        if (index >= 0) {
          values.splice(0, 1);
        }
      }
      if (values.length > 0) {
        const lastValue = values[values.length - 1];
        const index = findIndex(
          metadata.sortedValues,
          getPointForValue(lastValue),
          getPointForValue,
          comparePoints
        );
        if (index >= 0) {
          values.pop();
        }
      }

      // Merge any remaining unique values
      if (values.length > 0) {
        const firstValue = values[0];
        const index = findNearestIndexAfter(
          metadata.sortedValues,
          getPointForValue(firstValue),
          getPointForValue,
          comparePoints
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

    const { abortController, deferred } = record.value;
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
      record.status = STATUS_REJECTED;
      record.value = error;

      deferred.reject(error);

      return;
    }

    const missingThenables: Array<Value[] | Thenable<Value[]>> = [];
    foundIntervals.missing.forEach(([start, end]) => {
      const thenable = load(start, end, ...params, abortController);

      missingThenables.push(thenable);

      const pendingMetadata: PendingMetadata<Point, Value> = {
        interval: [start, end],
        record,
        value: thenable,
      };

      metadata.pendingMetadata.push(pendingMetadata);

      processPendingInterval(metadata, pendingMetadata, start, end);
    });

    // Gather all of the deferred requests the new interval blocks on.
    // Can we make this more efficient than a nested loop?
    // It's tricky since requests initiated separately (e.g. [1,2] and [2,4])
    // may end up reported as single/merged blocker (e.g. [1,3])
    const pendingThenables: Array<Value[] | Thenable<Value[]>> = [];
    foundIntervals.pending.forEach(([start, end]) => {
      metadata.pendingMetadata.forEach(({ interval, value }) => {
        if (intervalUtils.contains(interval, [start, end])) {
          pendingThenables.push(value);
        }
      });
    });

    try {
      const values = await Promise.all([
        ...missingThenables,
        ...pendingThenables,
      ]);

      debugLogInDev(
        `processPendingRecord(${start}, ${end}): resolved`,
        params,
        values
      );

      if (!signal.aborted) {
        record.status = STATUS_RESOLVED;
        record.value = sliceValues<Point, Value>(
          metadata.sortedValues,
          start,
          end,
          getPointForValue,
          comparePoints
        );

        deferred.resolve(record.value);
      }
    } catch (error) {
      debugLogInDev(
        `processPendingRecord(${start}, ${end}): failed`,
        params,
        error?.message || error
      );

      if (!signal.aborted) {
        record.status = STATUS_REJECTED;
        record.value = error;

        deferred.reject(error);
      }
    }
  }

  return {
    abort,
    evict,
    evictAll,
    fetchAsync,
    fetchSuspense,
  };
}

function defaultComparePoints(a: any, b: any): number {
  return a - b;
}
