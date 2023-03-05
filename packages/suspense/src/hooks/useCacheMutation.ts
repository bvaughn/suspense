import {
  unstable_useCacheRefresh as useCacheRefresh,
  useCallback,
  useLayoutEffect,
  useRef,
  useTransition,
} from "react";
import { InternalCache } from "../cache/createCache";
import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "../constants";
import { Cache, Record } from "../types";
import { createDeferred } from "../utils/createDeferred";

type EffectCallback = () => Promise<void>;

type MutationCallback<Value> = () => Promise<Value>;

export type MutateAsync<Params extends Array<any>, Value> = (
  params: Params,
  callback: MutationCallback<Value>
) => void;

export type MutateSync<Params extends Array<any>, Value> = (
  params: Params,
  newValue: Value
) => void;

export function useCacheMutation<Params extends Array<any>, Value>(
  cache: Cache<Params, Value>
): {
  isPending: boolean;
  mutateAsync: MutateAsync<Params, Value>;
  mutateSync: MutateSync<Params, Value>;
} {
  const {
    __backupRecordMap: backupRecordMap,
    __createRecordMap: createRecordMap,
    __getKey: getKey,
    __mutationStatusMap: mutationStatusMap,
    __notifySubscribers: notifySubscribers,
  } = cache as InternalCache<Params, Value>;

  const pendingEffectsRef = useRef<EffectCallback[]>([]);

  const [isPending, startTransition] = useTransition();

  useLayoutEffect(() => {
    const pendingEffects = pendingEffectsRef.current;
    if (pendingEffects.length > 0) {
      try {
        pendingEffects.forEach((effect) => effect());
      } finally {
        pendingEffects.splice(0);
      }
    }
  });

  const refresh = useCacheRefresh();

  const mutateSync = useCallback<MutateSync<Params, Value>>(
    (params: Params, newValue: Value) => {
      const cacheKey = getKey(...params);

      const record: Record<Value> = {
        status: STATUS_RESOLVED,
        value: newValue as any,
      };

      backupRecordMap.set(cacheKey, record);

      const recordMap = createRecordMap();
      recordMap.set(cacheKey, record);

      startTransition(() => {
        refresh(createRecordMap, recordMap);
      });
    },
    [refresh, startTransition]
  );

  const mutateAsync = useCallback<MutateAsync<Params, Value>>(
    (params: Params, callback: MutationCallback<Value>) => {
      const cacheKey = getKey(...params);

      let record: Record<Value> = {
        status: STATUS_PENDING,
        value: {
          abortController: new AbortController(),
          deferred: createDeferred<Value>(),
        },
      };

      const deferred = record.value.deferred;

      // Don't mutate the module-level cache yet;
      // this might cause other components to suspend (and fallback)
      // if they happened to re-render before the mutation finished
      const recordMap = createRecordMap();
      recordMap.set(cacheKey, record);

      mutationStatusMap.set(cacheKey, STATUS_PENDING);

      const promise = callback();
      promise.then(
        (newValue: Value) => {
          record.status = STATUS_RESOLVED;
          record.value = newValue;

          deferred.resolve(newValue);

          mutationStatusMap.delete(cacheKey);
          backupRecordMap.set(cacheKey, record);
          recordMap.set(cacheKey, record);

          startTransition(() => {
            notifySubscribers(...params);

            refresh(createRecordMap, recordMap);
          });
        },
        (error: any) => {
          record.status = STATUS_REJECTED;
          record.value = error;

          deferred.reject(error);

          mutationStatusMap.delete(cacheKey);
          backupRecordMap.set(cacheKey, record);
          recordMap.set(cacheKey, record);

          startTransition(() => {
            notifySubscribers(...params);

            refresh(createRecordMap, recordMap);
          });
        }
      );

      startTransition(() => {
        notifySubscribers(...params);

        refresh(createRecordMap, recordMap);
      });
    },
    [refresh, startTransition]
  );

  return {
    isPending,
    mutateAsync,
    mutateSync,
  };
}
