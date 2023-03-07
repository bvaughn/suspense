import { useEffect } from "react";
import {
  STATUS_NOT_STARTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { Cache, StatusPending, StatusRejected, StatusResolved } from "../types";
import { useCacheStatus } from "./useCacheStatus";

export type ErrorResponse = { error: any; status: StatusRejected; value: any };
export type PendingResponse = {
  error: undefined;
  status: StatusPending;
  value: undefined;
};
export type ResolvedResponse<Value> = {
  error: undefined;
  status: StatusResolved;
  value: Value;
};

export function useCacheValue<Params extends any[], Value>(
  cache: Cache<Params, Value>,
  ...params: Params
): ErrorResponse | PendingResponse | ResolvedResponse<Value> {
  const status = useCacheStatus(cache, ...params);

  useEffect(() => {
    switch (status) {
      case STATUS_NOT_STARTED:
        cache.prefetch(...params);
    }
  }, [cache, status, ...params]);

  switch (status) {
    case STATUS_REJECTED:
      let caught;
      try {
        cache.getValue(...params);
      } catch (error) {
        caught = error;
      }
      return { error: caught, status: STATUS_REJECTED, value: undefined };
    case STATUS_RESOLVED:
      return {
        error: undefined,
        status: STATUS_RESOLVED,
        value: cache.getValueIfCached(...params),
      };
    default:
      return {
        error: undefined,
        status: STATUS_PENDING,
        value: undefined,
      };
  }
}
