import {
  unstable_useCacheRefresh as useCacheRefresh,
  useCallback,
  useTransition,
} from "react";
import { InternalCache } from "../cache/createCache";
import { STATUS_PENDING, STATUS_REJECTED } from "../constants";
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
    __writeResolvedRecordData: writeResolvedRecordData,
  } = cache as InternalCache<Params, Value>;

  const [isPending, startTransition] = useTransition();

  const refresh = useCacheRefresh();

  const mutateSync = useCallback<MutateSync<Params, Value>>(
    (params: Params, newValue: Value) => {
      const cacheKey = getKey(...params);

      if (mutationAbortControllerMap.has(cacheKey)) {
        const abortController = mutationAbortControllerMap.get(cacheKey)!;
        abortController.abort();

        mutationAbortControllerMap.delete(cacheKey);
      }

      const record: Record<Value> = {
        data: writeResolvedRecordData(newValue),
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

      if (mutationAbortControllerMap.has(cacheKey)) {
        const abortController = mutationAbortControllerMap.get(cacheKey)!;
        abortController.abort();

        mutationAbortControllerMap.delete(cacheKey);
      }

      const abortController = new AbortController();
      const deferred = createDeferred<Value>();

      let record: Record<Value> = {
        data: {
          abortController,
          deferred,
          status: STATUS_PENDING,
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
        // Wait until the mutation finishes or is aborted
        const newValue = await Promise.race([
          callback(),

          new Promise<void>((resolve) => {
            abortController.signal.onabort = () => resolve();
          }),
        ]);

        if (abortController.signal.aborted) {
          // The mutation was aborted;
          // if we can restore the previous record, do it
          const backupRecord = backupRecordMap.get(cacheKey);
          if (backupRecord) {
            recordMap.set(cacheKey, backupRecord);
          } else {
            recordMap.delete(cacheKey);
          }
        } else {
          // This method determines whether to store the value in a WeakRef
          (record as Record<Value>).data = writeResolvedRecordData(
            newValue as Value
          );

          deferred.resolve(newValue as Value);

          backupRecordMap.set(cacheKey, record);
        }

        startTransition(() => {
          notifySubscribers(...params);
          refresh(createRecordMap, recordMap);
        });
      } catch (error) {
        (record as Record<Value>).data = {
          error,
          status: STATUS_REJECTED,
        };

        try {
          deferred.reject(error);
          await deferred.promise;
        } catch (error) {
          // Don't trigger an unhandled rejection
        }

        backupRecordMap.set(cacheKey, record);

        startTransition(() => {
          notifySubscribers(...params);
          refresh(createRecordMap, recordMap);
        });
      } finally {
        // Cleanup after mutation by deleting the abort controller
        // If this mutation has already been preempted by a newer mutation
        // don't delete the newer controller
        if (abortController === mutationAbortControllerMap.get(cacheKey)) {
          mutationAbortControllerMap.delete(cacheKey);
        }
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
