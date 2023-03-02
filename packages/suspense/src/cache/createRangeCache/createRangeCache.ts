import {
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../../constants";
import {
  RangeCacheLoadOptions,
  ComparisonFunction,
  GetPointForValue,
  PendingRecord,
  RangeCache,
  Record,
  Thenable,
  RangeTuple,
} from "../../types";
import { assertPendingRecord } from "../../utils/assertPendingRecord";
import { createDeferred } from "../../utils/createDeferred";
import { defaultGetKey } from "../../utils/defaultGetKey";
import { isPendingRecord } from "../../utils/isPendingRecord";
import { createPointUtils } from "./createPointUtils";
import { createRangeUtils } from "./createRangeUtils";
import { defaultComparePoints } from "./defaultComparePoints";
import { findMissingRanges } from "./findMissingRanges";
import { findIndex, findNearestIndexAfter } from "./findIndex";
import { sliceValues } from "./sliceValues";

// Enable to help with debugging in dev
const DEBUG_LOG_IN_DEV = false;

type SerializableToString = { toString(): string };

type RangeMetadata<Point, Value> = {
  cachedRanges: RangeTuple<Point>[];
  pendingRecords: Set<Record<Value[]>>;
  recordMap: Map<string, Record<Value[]>>;
  sortedValues: Value[];
};

export function createRangeCache<
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
    ...params: [...Params, RangeCacheLoadOptions]
  ) => Thenable<Value[]> | Value[];
}): RangeCache<Point, Params, Value> {
  const {
    comparePoints = defaultComparePoints,
    debugLabel,
    getKey = defaultGetKey,
    getPointForValue,
    load,
  } = options;

  const pointUtils = createPointUtils<Point>(comparePoints);
  const rangeUtils = createRangeUtils<Point>(pointUtils);

  const rangeMap = new Map<string, RangeMetadata<Point, Value>>();

  const debugLogInDev = (debug: string, params?: Params, ...args: any[]) => {
    if (DEBUG_LOG_IN_DEV && process.env.NODE_ENV === "development") {
      const cacheKey = params ? `"${getKey(...params)}"` : "";
      const prefix = debugLabel
        ? `createRangeCache[${debugLabel}]`
        : "createRangeCache";

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

    let rangeMetadata = rangeMap.get(cacheKey);
    if (rangeMetadata) {
      const { pendingRecords } = rangeMetadata;
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

    return rangeMap.delete(cacheKey);
  }

  function evictAll(): boolean {
    debugLogInDev(`evictAll()`, undefined, `${rangeMap.size} records`);

    const hadValues = rangeMap.size > 0;

    rangeMap.clear();

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

  function getOrCreateRangeMetadata(
    ...params: Params
  ): RangeMetadata<Point, Value> {
    const cacheKey = getKey(...params);
    let range = rangeMap.get(cacheKey);
    if (range == null) {
      range = {
        cachedRanges: [],
        pendingRecords: new Set(),
        recordMap: new Map(),
        sortedValues: [],
      };

      rangeMap.set(cacheKey, range);
    }
    return range;
  }

  function getOrCreateRecord(
    start: Point,
    end: Point,
    ...params: Params
  ): Record<Value[]> {
    const rangeMetadata = getOrCreateRangeMetadata(...params);
    const cacheKey = `${start}–${end}`;

    let record = rangeMetadata.recordMap.get(cacheKey);
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

      rangeMetadata.recordMap.set(cacheKey, record);

      processPendingRecord(
        rangeMetadata,
        record as PendingRecord<Value[]>,
        start,
        end,
        ...params
      );
    }

    return record;
  }

  async function loadRangeAndMergeValues(
    rangeMetadata: RangeMetadata<Point, Value>,
    abortController: AbortController,
    start: Point,
    end: Point,
    ...params: Params
  ) {
    const { cachedRanges, sortedValues } = rangeMetadata;

    const values = await load(start, end, ...params, abortController);

    rangeMetadata.cachedRanges = rangeUtils.mergeAll(
      ...rangeUtils.sort(...cachedRanges, [start, end])
    );

    // Check for duplicate values near the edges because of how ranges are split
    if (values.length > 0) {
      const firstValue = values[0];
      const index = findIndex(
        sortedValues,
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
        sortedValues,
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
        sortedValues,
        getPointForValue(firstValue),
        getPointForValue,
        comparePoints
      );
      sortedValues.splice(index, 0, ...values);
    }
  }

  async function processPendingRecord(
    rangeMetadata: RangeMetadata<Point, Value>,
    record: Record<Value[]>,
    start: Point,
    end: Point,
    ...params: Params
  ) {
    assertPendingRecord(record);

    rangeMetadata.pendingRecords.add(record);

    const { abortController, deferred } = record.value;
    const { signal } = abortController;

    const missingRanges = findMissingRanges<Point>(
      rangeMetadata.cachedRanges,
      [start, end],
      rangeUtils,
      pointUtils
    );

    try {
      await Promise.all(
        missingRanges.map(([start, end]) =>
          loadRangeAndMergeValues(
            rangeMetadata,
            abortController,
            start,
            end,
            ...params
          )
        )
      );

      if (!signal.aborted) {
        record.status = STATUS_RESOLVED;
        record.value = sliceValues<Point, Value>(
          rangeMetadata.sortedValues,
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
      rangeMetadata.pendingRecords.delete(record);
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
