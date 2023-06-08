import { isDevelopment } from "#is-development";
import { configure as configureArraySortingUtilities } from "array-sorting-utilities";
import {
  configure as configureIntervalUtilities,
  Interval,
} from "interval-utilities";
import DataIntervalTree from "node-interval-tree";
import { configure as configurePointUtilities } from "point-utilities";
import {
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../../constants";
import {
  GetPointForValue,
  IntervalCache,
  IntervalCacheLoadOptions,
  PendingRecord,
  Record,
  StatusCallback,
} from "../../types";
import { assertPendingRecord } from "../../utils/assertRecordStatus";
import { createDeferred } from "../../utils/createDeferred";
import { defaultGetKey } from "../../utils/defaultGetKey";
import { isPromiseLike } from "../../utils/isPromiseLike";
import {
  isPendingRecord,
  isRejectedRecord,
  isResolvedRecord,
} from "../../utils/isRecordStatus";
import { findIntervals } from "./findIntervals";
import { sliceValues } from "./sliceValues";

// Enable to help with debugging in dev
const DEBUG_LOG_IN_DEV = false;

type PendingMetadata<Point, Value> = {
  containsPartialResults: () => void;
  interval: Interval<Point>;
  record: PendingRecord<Value[]>;
  value: PromiseLike<Value[]> | Value[];
};

type Metadata<Point, Value> = {
  intervals: {
    failed: Interval<Point>[];
    loaded: Interval<Point>[];
    partial: Interval<Point>[];
  };
  pendingMetadata: PendingMetadata<Point, Value>[];
  recordMap: Map<string, Record<Value[]>>;
  sortedValues: Value[];
};

type SubscriptionData<Point extends number | bigint, Params> = {
  callbacks: Set<StatusCallback>;
  end: Point;
  params: Params;
  start: Point;
};

export type PartialArray<Value> = Array<Value> & {
  __partial: true;
};

type ValuesArray<Value> = Array<Value> | PartialArray<Value>;

export function createIntervalCache<
  Point extends number | bigint,
  Params extends Array<any>,
  Value
>(options: {
  debugLabel?: string;
  getKey?: (...params: Params) => string;
  getPointForValue: GetPointForValue<Point, Value>;
  load: (
    start: Point,
    end: Point,
    ...params: [...Params, IntervalCacheLoadOptions<Value>]
  ) => PromiseLike<ValuesArray<Value>> | ValuesArray<Value>;
}): IntervalCache<Point, Params, Value> {
  const {
    debugLabel,
    getKey = defaultGetKey,
    getPointForValue,
    load,
  } = options;

  const arraySortUtils = configureArraySortingUtilities<Value>(
    (a: Value, b: Value) =>
      comparePoints(getPointForValue(a), getPointForValue(b))
  );
  const intervalUtils = configureIntervalUtilities<Point>(comparePoints);
  const pointUtils = configurePointUtilities<Point>(comparePoints);

  const metadataMap = new Map<string, Metadata<Point, Value>>();

  // Subscribers are stored in a two-level data structure:
  // A key constructed from the params Array (getKey) points to an interval tree.
  // That interval tree maps an interval to a set of callbacks.
  const subscriberMap: Map<
    string,
    DataIntervalTree<SubscriptionData<Point, Params>, Point>
  > = new Map();

  const debugLogInDev = (debug: string, params?: Params, ...args: any[]) => {
    if (DEBUG_LOG_IN_DEV && isDevelopment) {
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

        const cloned = [...pendingMetadata];

        pendingMetadata.splice(0);

        for (let { interval, record } of cloned) {
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

        if (caught !== undefined) {
          throw caught;
        }

        return true;
      }
    }

    return false;
  }

  class PartialArray<Value> extends Array<Value> {
    constructor(length: number) {
      super(length);

      Object.defineProperty(this, "__partial", {
        value: true,
        enumerable: false,
      });
    }
  }

  function arrayToPartialArray<Value>(values: Value[]): PartialArray<Value> {
    const partialArray = new PartialArray<Value>(values.length);
    values.forEach((value, index) => {
      partialArray[index] = value;
    });

    return partialArray;
  }

  function createCacheKey(start: Point, end: Point): string {
    return `${start}–${end}`;
  }

  function evict(...params: Params): boolean {
    debugLogInDev("evict()", params);

    const cacheKey = getKey(...params);
    const result = metadataMap.delete(cacheKey);

    const tree = subscriberMap.get(cacheKey);
    if (tree) {
      for (let node of tree.inOrder()) {
        node.data.callbacks.forEach((callback) => callback(STATUS_NOT_FOUND));
      }
    }

    return result;
  }

  function evictAll(): boolean {
    debugLogInDev(`evictAll()`, undefined, `${metadataMap.size} records`);

    const hadValues = metadataMap.size > 0;

    metadataMap.clear();

    subscriberMap.forEach((tree) => {
      for (let node of tree.inOrder()) {
        node.data.callbacks.forEach((callback) => callback(STATUS_NOT_FOUND));
      }
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
        intervals: {
          failed: [],
          loaded: [],
          partial: [],
        },
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
    const cacheKey = createCacheKey(start, end);

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
    const cacheKey = createCacheKey(start, end);

    let record = metadata.recordMap.get(cacheKey);
    if (!record) {
      // If there is no exact match, we may also still be within a larger interval.
      const { containsFailedResults, missing, pending } = findIntervals<Point>(
        {
          failed: metadata.intervals.failed,
          loaded: metadata.intervals.loaded,
          partial: metadata.intervals.partial,
          pending: metadata.pendingMetadata.map(({ interval }) => interval),
        },
        [start, end],
        intervalUtils
      );

      if (pending.length > 0) {
        return STATUS_PENDING;
      } else if (containsFailedResults) {
        return STATUS_REJECTED;
      } else if (missing.length > 0) {
        return STATUS_NOT_FOUND;
      } else {
        return STATUS_RESOLVED;
      }
    }

    return record.data.status;
  }

  function getAlreadyLoadedValues(
    start: Point,
    end: Point,
    metadata: Metadata<Point, Value>
  ): ValuesArray<Value> | undefined {
    const { containsFailedResults, containsPartialResults, missing } =
      findIntervals<Point>(
        {
          failed: metadata.intervals.failed,
          loaded: metadata.intervals.loaded,
          partial: metadata.intervals.partial,
          pending: metadata.pendingMetadata.map(({ interval }) => interval),
        },
        [start, end],
        intervalUtils
      );

    if (missing.length === 0) {
      if (!containsFailedResults) {
        const value = sliceValues<Point, Value>(
          metadata.sortedValues,
          start,
          end,
          getPointForValue,
          pointUtils
        );
        if (containsPartialResults) {
          return arrayToPartialArray(value);
        } else {
          return value;
        }
      }
    }
  }

  function getValue(start: Point, end: Point, ...params: Params): Value[] {
    debugLogInDev(`getValue(${start}, ${end})`, params);

    const metadata = getOrCreateIntervalMetadata(...params);
    const cacheKey = createCacheKey(start, end);

    const record = metadata.recordMap.get(cacheKey);
    if (record == null) {
      const value = getAlreadyLoadedValues(start, end, metadata);
      if (value) {
        return value;
      } else {
        throw Error("No record found");
      }
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
    const cacheKey = createCacheKey(start, end);

    const record = metadata.recordMap.get(cacheKey);
    if (record == null) {
      return getAlreadyLoadedValues(start, end, metadata);
    } else if (isResolvedRecord(record)) {
      return record.data.value;
    }
  }

  function isPartialResult<Value>(value: Value[]): boolean {
    return value instanceof PartialArray;
  }

  function notifySubscribers(
    start: Point,
    end: Point,
    ...params: Params
  ): void {
    const cacheKey = getKey(...params);
    const tree = subscriberMap.get(cacheKey);
    if (tree) {
      const matches = tree.search(start, end);
      matches.forEach((match: SubscriptionData<Point, Params>) => {
        const status = getStatus(match.start, match.end, ...match.params);
        match.callbacks.forEach((callback) => {
          callback(status);
        });
      });
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

      // Store partially loaded intervals separately;
      // Future requests that contain them should also be flagged as partial
      if (isPartialResult(values)) {
        pendingMetadata.containsPartialResults();

        metadata.intervals.partial = intervalUtils.mergeAll(
          ...intervalUtils.sort(...metadata.intervals.partial, [start, end])
        );
      } else {
        metadata.intervals.loaded = intervalUtils.mergeAll(
          ...intervalUtils.sort(...metadata.intervals.loaded, [start, end])
        );

        // Prune partials interval to remove ones that have been newly loaded
        // note this intentionally includes intersections.
        // The thinking behind this is as follows:
        // 1. Loading part of a previously partial range
        //    might reduce the range enough so that the remainder can be fully loaded
        // 2. If we don't shrink partial intervals as we refine them,
        //    it may become impossible to fully remove them in some cases.
        for (
          let index = metadata.intervals.partial.length - 1;
          index >= 0;
          index--
        ) {
          const partialInterval = metadata.intervals.partial[index]!;
          if (intervalUtils.intersects([start, end], partialInterval)) {
            metadata.intervals.partial.splice(index, 1);

            const cacheKey = createCacheKey(
              partialInterval[0],
              partialInterval[1]
            );

            metadata.recordMap.delete(cacheKey);
          }
        }
      }

      // Merge in newly-loaded values; don't add duplicates though.
      // Duplicates may slip in at the edges (because of how intervals are split)
      // or they may be encountered as ranges of partial results are refined.
      for (let index = 0; index < values.length; index++) {
        const value = values[index]!;
        const insertIndex = arraySortUtils.findInsertIndex(
          metadata.sortedValues,
          value
        );
        const itemAtIndex = metadata.sortedValues[insertIndex];
        if (
          itemAtIndex == null ||
          comparePoints(
            getPointForValue(itemAtIndex),
            getPointForValue(value)
          ) !== 0
        ) {
          metadata.sortedValues.splice(insertIndex, 0, value);
        }
      }
    } catch (error) {
      // Ignore the error here; the caller will handle it.

      metadata.intervals.failed = intervalUtils.mergeAll(
        ...intervalUtils.sort(...metadata.intervals.failed, [start, end])
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
        failed: metadata.intervals.failed,
        loaded: metadata.intervals.loaded,
        partial: metadata.intervals.partial,
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
        metadata.intervals.failed.find((interval) =>
          intervalUtils.contains(missingInterval, interval)
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

    let containsPartialResults = false;

    const missingPromiseLikes: Array<Value[] | PromiseLike<Value[]>> = [];
    foundIntervals.missing.forEach(([start, end]) => {
      const options: IntervalCacheLoadOptions<Value> = {
        returnAsPartial: arrayToPartialArray<Value>,
        signal: abortController.signal,
      };

      const thenable = load(start, end, ...params, options);

      missingPromiseLikes.push(thenable);

      const pendingMetadata: PendingMetadata<Point, Value> = {
        containsPartialResults: () => {
          containsPartialResults = true;
        },
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
        let value = sliceValues<Point, Value>(
          metadata.sortedValues,
          start,
          end,
          getPointForValue,
          pointUtils
        );

        if (containsPartialResults) {
          value = arrayToPartialArray(value);
        }

        record.data = {
          metadata: {
            containsPartialResults,
          },
          status: STATUS_RESOLVED,
          value,
        };

        deferred.resolve(value);

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

    let tree = subscriberMap.get(cacheKey);
    if (tree == null) {
      tree = new DataIntervalTree();
      subscriberMap.set(cacheKey, tree);
    }

    let match = tree
      .search(start, end)
      .find((match) => match.start === start && match.end === end);
    if (match) {
      match.callbacks.add(callback);
    } else {
      match = {
        callbacks: new Set([callback]),
        end,
        params,
        start,
      };

      tree.insert(start, end, match);
    }

    try {
      const status = getStatus(start, end, ...params);

      callback(status);
    } finally {
      return () => {
        if (tree && match) {
          match.callbacks.delete(callback);
          if (match.callbacks.size === 0) {
            tree.remove(start, end, match);
          }
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
    isPartialResult,
    readAsync,
    read,
    subscribeToStatus,
  };
}

function comparePoints(a: any, b: any): number {
  return Number(a - b);
}
