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

// Enable to help with debugging in dev
const DEBUG_LOG_IN_DEV = false;

type SerializableToString = { toString(): string };

type PendingIntervalAndThenableTuple<Point, Value> = [
  Interval<Point>,
  Value[] | Thenable<Value[]>
];

type Metadata<Point, Value> = {
  loadedIntervals: Interval<Point>[];
  pendingIntervalAndThenableTuples: PendingIntervalAndThenableTuple<
    Point,
    Value
  >[];
  pendingRecords: Set<Record<Value[]>>;
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
    if (DEBUG_LOG_IN_DEV && process.env.NODE_ENV === "development") {
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
    const cacheKey = getKey(...params);

    let caught;

    let metadata = metadataMap.get(cacheKey);
    if (metadata) {
      const { pendingRecords } = metadata;
      if (pendingRecords.size > 0) {
        debugLogInDev("abort()", params);

        for (let record of pendingRecords) {
          try {
            record.value.abortController.abort();
          } catch (error) {
            caught = error;
          }
        }
        pendingRecords.clear();

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
        loadedIntervals: [],
        pendingIntervalAndThenableTuples: [],
        pendingRecords: new Set(),
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

  async function processPendingIntervalAndThenableTuple(
    metadata: Metadata<Point, Value>,
    pendingIntervalAndThenableTuple: PendingIntervalAndThenableTuple<
      Point,
      Value
    >,
    start: Point,
    end: Point,
    ...params: Params
  ) {
    const [interval, thenable] = pendingIntervalAndThenableTuple;

    let values;
    try {
      values = await thenable;
    } finally {
      metadata.pendingIntervalAndThenableTuples.splice(
        metadata.pendingIntervalAndThenableTuples.indexOf(
          pendingIntervalAndThenableTuple
        ),
        1
      );
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
  }

  async function processPendingRecord(
    metadata: Metadata<Point, Value>,
    record: Record<Value[]>,
    start: Point,
    end: Point,
    ...params: Params
  ) {
    assertPendingRecord(record);

    metadata.pendingRecords.add(record);

    const { abortController, deferred } = record.value;
    const { signal } = abortController;

    const foundIntervals = findIntervals<Point>(
      {
        loaded: metadata.loadedIntervals,
        pending: metadata.pendingIntervalAndThenableTuples.map(
          ([interval]) => interval
        ),
      },
      [start, end],
      intervalUtils
    );

    const missingThenables: Array<Value[] | Thenable<Value[]>> = [];
    foundIntervals.missing.forEach(([start, end]) => {
      const thenable = load(start, end, ...params, abortController);

      missingThenables.push(thenable);

      const pendingIntervalAndThenableTuple: PendingIntervalAndThenableTuple<
        Point,
        Value
      > = [[start, end], thenable];

      metadata.pendingIntervalAndThenableTuples.push(
        pendingIntervalAndThenableTuple
      );

      processPendingIntervalAndThenableTuple(
        metadata,
        pendingIntervalAndThenableTuple,
        start,
        end,
        ...params
      );
    });

    // Gather all of the deferred requests the new interval blocks on.
    // Can we make this more efficient than a nested loop?
    // It's tricky since requests initiated separately (e.g. [1,2] and [2,4])
    // may end up reported as single/merged blocker (e.g. [1,3])
    const pendingThenables: Array<Value[] | Thenable<Value[]>> = [];
    foundIntervals.pending.forEach(([start, end]) => {
      metadata.pendingIntervalAndThenableTuples.forEach(
        ([interval, deferred]) => {
          if (intervalUtils.contains(interval, [start, end])) {
            pendingThenables.push(deferred);
          }
        }
      );
    });

    try {
      await Promise.all([...missingThenables, ...pendingThenables]);

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
      if (!signal.aborted) {
        record.status = STATUS_REJECTED;
        record.value = error;

        deferred.reject(error);
      }
    } finally {
      metadata.pendingRecords.delete(record);
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
