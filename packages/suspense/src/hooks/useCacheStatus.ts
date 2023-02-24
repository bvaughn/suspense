import { useSyncExternalStore } from "react";

import { Cache, Status } from "../types";

export function useCacheStatus<Params extends Array<any>>(
  cache: Cache<Params, any>,
  ...params: Params
): Status {
  return useSyncExternalStore<Status | undefined>(
    (callback) => cache.subscribeToStatus(callback, ...params),
    () => cache.getStatus(...params),
    () => cache.getStatus(...params)
  );
}
