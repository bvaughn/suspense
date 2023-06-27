import { useEffect, useState } from "react";
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
  | ImperativePendingResponse<Value>
  | ImperativeResolvedResponse<Value> {
  const status = useCacheStatus(cache, ...params);

  const [prevParams, setPrevParams] = useState<TParams | undefined>(undefined);
  const [prevValue, setPrevValue] = useState<Value | undefined>(undefined);

  useEffect(() => {
    switch (status) {
      case STATUS_NOT_FOUND: {
        cache.prefetch(...params);
        break;
      }
      case STATUS_RESOLVED: {
        // Cache most recently resolved value in case of a mutation
        setPrevParams(params);
        setPrevValue(cache.getValue(...params));
        break;
      }
    }
  }, [cache, status, ...params]);

  switch (status) {
    case STATUS_REJECTED: {
      let caught;
      try {
        cache.getValue(...params);
      } catch (error) {
        caught = error;
      }
      return { error: caught, status: STATUS_REJECTED, value: undefined };
    }
    case STATUS_RESOLVED: {
      try {
        return {
          error: undefined,
          status: STATUS_RESOLVED,
          value: cache.getValue(...params),
        };
      } catch (error) {}
      break;
    }
  }

  let paramsHaveChanged = prevParams === undefined;
  if (prevParams) {
    if (prevParams.length !== params.length) {
      paramsHaveChanged = true;
    } else {
      for (let index = 0; index < params.length; index++) {
        if (prevParams[index] !== params[index]) {
          paramsHaveChanged = true;
          break;
        }
      }
    }
  }

  return {
    error: undefined,
    status: STATUS_PENDING,
    value: paramsHaveChanged ? undefined : prevValue,
  };
}
