import {
  unstable_useCacheRefresh as useCacheRefresh,
  useCallback,
  useTransition,
} from "react";
import { InternalCache } from "../cache/createCache";
import {
  STATUS_NOT_STARTED,
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
} from "../constants";
import { Cache, Record } from "../types";
import { createDeferred } from "../utils/createDeferred";

type MutationCallback<Value> = () => Promise<Value>;

export type MutateAsync<Params extends Array<any>, Value> = (
  params: Params,
  callback: MutationCallback<Value>
) => Promise<void>;

export type MutateSync<Params extends Array<any>, Value> = (
  params: Params,
  newValue: Value
) => void;

export type MutationApi<Params extends Array<any>, Value> = {
  isPending: boolean;
  mutateAsync: MutateAsync<Params, Value>;
  mutateSync: MutateSync<Params, Value>;
};

export function useCacheMutation<Params extends Array<any>, Value>(
  cache: Cache<Params, Value>
): MutationApi<Params, Value> {
  const {
    __backupRecordMap: backupRecordMap,
    __createRecordMap: createRecordMap,
    __getKey: getKey,
    __mutationAbortControllerMap: mutationAbortControllerMap,
    __notifySubscribers: notifySubscribers,
  } = cache as InternalCache<Params, Value>;

  const [isPending, startTransition] = useTransition();

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
    async (params: Params, callback: MutationCallback<Value>) => {
      const cacheKey = getKey(...params);

      const abortController = new AbortController();
      const deferred = createDeferred<Value>();

      let record: Record<Value> = {
        status: STATUS_PENDING,
        value: {
          abortController,
          deferred,
        },
      };

      // Don't mutate the module-level cache yet;
      // this might cause other components to suspend (and fallback)
      // if they happened to re-render before the mutation finished
      const recordMap = createRecordMap();
      recordMap.set(cacheKey, record);

      mutationAbortControllerMap.set(cacheKey, abortController);

      startTransition(() => {
        notifySubscribers(...params);
        refresh(createRecordMap, recordMap);
      });

      try {
        let didAbort = false;

        const newValue = await Promise.race([
          callback(),

          new Promise<void>((resolve) => {
            abortController.signal.onabort = () => {
              didAbort = true;

              resolve();
            };
          }),
        ]);

        if (didAbort) {
          const backupRecord = backupRecordMap.get(cacheKey);
          if (backupRecord) {
            recordMap.set(cacheKey, backupRecord);
          } else {
            recordMap.delete(cacheKey);
          }
        } else {
          (record as Record<Value>).status = STATUS_RESOLVED;
          (record as Record<Value>).value = newValue;

          deferred.resolve(newValue as Value);

          backupRecordMap.set(cacheKey, record);
        }

        mutationAbortControllerMap.delete(cacheKey);

        startTransition(() => {
          notifySubscribers(...params);

          refresh(createRecordMap, recordMap);
        });
      } catch (error) {
        (record as Record<Value>).status = STATUS_REJECTED;
        (record as Record<Value>).value = error;

        deferred.reject(error);

        mutationAbortControllerMap.delete(cacheKey);
        backupRecordMap.set(cacheKey, record);

        startTransition(() => {
          notifySubscribers(...params);
          refresh(createRecordMap, recordMap);
        });
      }
    },
    [refresh, startTransition]
  );

  return {
    isPending,
    mutateAsync,
    mutateSync,
  };
}
