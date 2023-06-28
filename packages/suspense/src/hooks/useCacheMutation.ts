import {
  unstable_useCacheRefresh as useCacheRefresh,
  useCallback,
  useTransition,
} from "react";
import { InternalCache } from "../cache/createCache";
import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "../constants";
import { Cache, Record } from "../types";
import { createDeferred } from "../utils/createDeferred";
import { createResolvedRecord, updateRecordToResolved } from "../utils/Record";
import { assert } from "../utils/assert";

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
    __createPendingMutationRecordMap: createPendingMutationRecordMap,
    __getKey: getKey,
    __isImmutable: isImmutable,
    __mutationAbortControllerMap: mutationAbortControllerMap,
    __notifySubscribers: notifySubscribers,
    __recordMap: recordMap,
  } = cache as InternalCache<Params, Value>;

  assert(!isImmutable(), "Cannot mutate an immutable cache");

  const [isPending, startTransition] = useTransition();

  const refresh = useCacheRefresh();

  const mutateSync = useCallback<MutateSync<Params, Value>>(
    (params: Params, newValue: Value) => {
      const cacheKey = getKey(params);

      if (mutationAbortControllerMap.has(cacheKey)) {
        const abortController = mutationAbortControllerMap.get(cacheKey)!;
        abortController.abort();

        mutationAbortControllerMap.delete(cacheKey);
      }

      const record: Record<Value> = createResolvedRecord(newValue);

      recordMap.set(cacheKey, record);

      const pendingMutationRecordMap = createPendingMutationRecordMap();
      pendingMutationRecordMap.set(cacheKey, record);

      startTransition(() => {
        refresh(createPendingMutationRecordMap, pendingMutationRecordMap);
      });

      notifySubscribers(params);
    },
    [refresh, startTransition]
  );

  const mutateAsync = useCallback<MutateAsync<Params, Value>>(
    async (params: Params, callback: MutationCallback<Value>) => {
      const cacheKey = getKey(params);

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
      const pendingMutationRecordMap = createPendingMutationRecordMap();
      pendingMutationRecordMap.set(cacheKey, record);

      mutationAbortControllerMap.set(cacheKey, abortController);

      startTransition(() => {
        refresh(createPendingMutationRecordMap, pendingMutationRecordMap);
      });

      notifySubscribers(params, { status: STATUS_PENDING });

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
          const backupRecord = recordMap.get(cacheKey);
          if (backupRecord) {
            pendingMutationRecordMap.set(cacheKey, backupRecord);
          } else {
            pendingMutationRecordMap.delete(cacheKey);
          }
        } else {
          // This method determines whether to store the value in a WeakRef
          updateRecordToResolved<Value>(record, newValue as Value);

          deferred.resolve(newValue as Value);

          recordMap.set(cacheKey, record);
        }

        startTransition(() => {
          refresh(createPendingMutationRecordMap, pendingMutationRecordMap);
        });

        notifySubscribers(params, {
          status: STATUS_RESOLVED,
          value: newValue as Value,
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

        recordMap.set(cacheKey, record);

        startTransition(() => {
          refresh(createPendingMutationRecordMap, pendingMutationRecordMap);
        });

        notifySubscribers(params, {
          error,
          status: STATUS_REJECTED,
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
