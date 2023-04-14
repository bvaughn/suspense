import { useEffect } from "react";
import {
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import {
  Cache,
  ImperativeErrorResponse,
  ImperativePendingResponse,
  ImperativeResolvedResponse,
} from "../types";
import { useCacheStatus } from "./useCacheStatus";

export function useImperativeCacheValue<
  Params extends any[],
  Value,
  TParams extends Params
>(
  cache: Cache<Params, Value>,
  ...params: TParams
):
  | ImperativeErrorResponse
  | ImperativePendingResponse
  | ImperativeResolvedResponse<Value> {
  const status = useCacheStatus(cache, ...params);

  useEffect(() => {
    switch (status) {
      case STATUS_NOT_FOUND:
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
      try {
        return {
          error: undefined,
          status: STATUS_RESOLVED,
          value: cache.getValue(...params),
        };
      } catch (error) {}
    default:
  }

  return {
    error: undefined,
    status: STATUS_PENDING,
    value: undefined,
  };
}
