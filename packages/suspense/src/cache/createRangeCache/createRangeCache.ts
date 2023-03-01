import {
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../../constants";
import {
  ComparisonFunction,
  PendingRecord,
  RangeCache,
  Record,
  Thenable,
} from "../../types";
import { assertPendingRecord } from "../../utils/assertPendingRecord";
import { createDeferred } from "../../utils/createDeferred";
import { defaultGetKey } from "../../utils/defaultGetKey";
import { isPendingRecord } from "../../utils/isPendingRecord";
import { findMissingRanges } from "./findMissingRanges";
import { findNearestIndexAfter } from "./findNearestIndex";
import { sliceValues } from "./sliceValues";

// Enable to help with debugging in dev
const DEBUG_LOG_IN_DEV = false;

type SerializableToString = { toString(): string };

export type GetPoint<Point, Value> = (value: Value) => Point;

export type RangeMetadata<Value> = {
  recordMap: Map<string, Record<Value[]>>;
  sortedValues: Value[];
};

export type RangeIterator<Point> = (
  start: Point,
  end: Point,
  callback: (current: Point) => void
) => void;

export function createRangeCache<
  Point extends SerializableToString,
  Params extends Array<any>,
  Value
>(options: {
  comparePoints: ComparisonFunction<Point>;
  debugLabel?: string;
  getKey?: (...params: Params) => string;
  getPoint: GetPoint<Point, Value>;
  load: (
    start: Point,
    end: Point,
    ...params: Params
  ) => Thenable<Value[]> | Value[];
  rangeIterator: RangeIterator<Point>;
}): RangeCache<Point, Params, Value> {
  const {
    comparePoints,
    debugLabel,
    getKey = defaultGetKey,
    getPoint,
    load,
    rangeIterator,
  } = options;

  const rangeMap = new Map<string, RangeMetadata<Value>>();

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

  function getOrCreateRangeMetadata(...params: Params): RangeMetadata<Value> {
    const cacheKey = getKey(...params);
    let range = rangeMap.get(cacheKey);
    if (range == null) {
      range = {
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
    rangeMetadata: RangeMetadata<Value>,
    start: Point,
    end: Point,
    ...params: Params
  ) {
    const values = await load(start, end, ...params);

    const index = findNearestIndexAfter(
      rangeMetadata.sortedValues,
      start,
      getPoint,
      comparePoints
    );

    rangeMetadata.sortedValues.splice(index, 0, ...values);
  }

  async function processPendingRecord(
    rangeMetadata: RangeMetadata<Value>,
    record: Record<Value[]>,
    start: Point,
    end: Point,
    ...params: Params
  ) {
    assertPendingRecord(record);

    const { abortController, deferred } = record.value;
    const { signal } = abortController;

    const missingRanges = findMissingRanges<Point, Value>(
      rangeMetadata.sortedValues,
      start,
      end,
      getPoint,
      rangeIterator,
      comparePoints
    );

    try {
      await Promise.all(
        missingRanges.map(([start, end]) =>
          loadRangeAndMergeValues(rangeMetadata, start, end, ...params)
        )
      );

      if (!signal.aborted) {
        record.status = STATUS_RESOLVED;
        record.value = sliceValues<Point, Value>(
          rangeMetadata.sortedValues,
          start,
          end,
          getPoint,
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
    }
  }

  return {
    evict,
    evictAll,
    fetchAsync,
    fetchSuspense,
  };
}
