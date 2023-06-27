import { useEffect, useMemo, useState } from "react";
import equal from "deep-equal";

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

  let error: unknown | undefined = undefined;
  let value: Value | undefined = undefined;

  useEffect(() => {
    switch (status) {
      case STATUS_NOT_FOUND: {
        cache.prefetch(...params);
        break;
      }
      case STATUS_RESOLVED: {
        // Cache most recently resolved value in case of a mutation
        setPrevParams((prevParams) => {
          if (prevParams == params || equal(prevParams, params)) {
            return prevParams;
          } else {
            return params;
          }
        });

        const value = cache.getValue(...params);

        setPrevValue((prevValue) => {
          if (prevValue == value || equal(prevValue, value)) {
            return prevValue;
          } else {
            return value;
          }
        });
        break;
      }
    }
  }, [cache, status, ...params]);

  switch (status) {
    case STATUS_REJECTED: {
      try {
        cache.getValue(...params);
      } catch (caught) {
        error = caught;
      }
      break;
    }
    case STATUS_RESOLVED: {
      value = cache.getValue(...params);
      break;
    }
    case STATUS_PENDING: {
      value =
        prevParams == params || equal(prevParams, params)
          ? prevValue
          : undefined;
      break;
    }
  }

  return useMemo(
    () =>
      ({
        error,
        status,
        value,
      } as
        | ImperativeErrorResponse
        | ImperativePendingResponse<Value>
        | ImperativeResolvedResponse<Value>),
    [error, status, value]
  );
}
