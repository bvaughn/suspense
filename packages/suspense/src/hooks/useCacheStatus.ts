import { useSyncExternalStore } from "react";

import { Cache, Status } from "../types";

export function useCacheStatus<Params extends Array<any>>(
  cache: Cache<Params, any>,
  ...params: Params
): Status {
  return useSyncExternalStore<Status>(
    (callback) => cache.subscribe(callback, ...params),
    () => cache.getStatus(...params),
    () => cache.getStatus(...params)
  );
}

useCacheStatus.displayName = "useCacheStatus";
