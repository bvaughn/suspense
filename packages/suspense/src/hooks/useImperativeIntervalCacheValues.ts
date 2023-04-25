import { useEffect } from "react";
import {
  STATUS_NOT_FOUND,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import {
  IntervalCache,
  ImperativeIntervalErrorResponse,
  ImperativeIntervalPendingResponse,
  ImperativeIntervalResolvedResponse,
} from "../types";
import { useIntervalCacheStatus } from "./useIntervalCacheStatus";

export function useImperativeIntervalCacheValues<
  Point,
  Params extends Array<any>,
  Value
>(
  cache: IntervalCache<Point, Params, Value>,
  start: Point,
  end: Point,
  ...params: Params
):
  | ImperativeIntervalErrorResponse
  | ImperativeIntervalPendingResponse
  | ImperativeIntervalResolvedResponse<Value[]> {
  const status = useIntervalCacheStatus(cache, start, end, ...params);

  useEffect(() => {
    switch (status) {
      case STATUS_NOT_FOUND:
        cache.readAsync(start, end, ...params);
    }
  }, [cache, status, start, end, ...params]);

  switch (status) {
    case STATUS_REJECTED:
      let caught;
      try {
        cache.getValue(start, end, ...params);
      } catch (error) {
        caught = error;
      }
      return { error: caught, status: STATUS_REJECTED, value: undefined };
    case STATUS_RESOLVED:
      try {
        const value = cache.getValue(start, end, ...params);
        const isPartialResult = cache.isPartialResult(value);
        return {
          error: undefined,
          isPartialResult,
          status: STATUS_RESOLVED,
          value,
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
