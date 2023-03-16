import { useSyncExternalStore } from "react";

import { IntervalCache, Status } from "../types";

export function useIntervalCacheStatus<Point, Params extends Array<any>>(
  cache: IntervalCache<Point, Params, any>,
  start: Point,
  end: Point,
  ...params: Params
): Status {
  return useSyncExternalStore<Status>(
    (callback) => cache.subscribeToStatus(callback, start, end, ...params),
    () => cache.getStatus(start, end, ...params),
    () => cache.getStatus(start, end, ...params)
  );
}
