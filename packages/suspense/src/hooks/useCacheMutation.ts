import {
  unstable_useCacheRefresh as useCacheRefresh,
  useCallback,
  useTransition,
} from "react";
import { Cache } from "../types";

type MutationCallback<Params extends Array<any>, Value> = (
  cache: (value: Value, ...params: Params) => void
) => Promise<void>;

export function useCacheMutation<Params extends Array<any>, Value>(
  cache: Cache<Params, Value>
): [
  isPending: boolean,
  mutate: (
    ...args:
      | [MutationCallback<Params, Value>]
      | [MutationCallback<Params, Value>, ...Params]
  ) => Promise<void>
] {
  const [isPending, startTransition] = useTransition();

  const refresh = useCacheRefresh();

  const mutate = useCallback(
    async (callback: MutationCallback<Params, Value>, ...params: Params) => {
      let cacheCalls: [value: Value, ...params: Params][] = [];

      // Allow external mutations (e.g. API calls) to finish first
      await callback((value: Value, ...params: Params) => {
        cacheCalls.push([value, ...params]);
      });

      // If this mutation is related to a specific record, clear the stale record from the in-memory cache
      if (params.length > 0) {
        cache.evict(...params);
      }

      // If the mutation returned any updated values, (e.g. API responses)
      // pre-cache them before re-rendering to avoid unnecessary fetches
      cacheCalls.forEach(([value, ...params]) => {
        cache.cache(value, ...params);
      });

      // Finally schedule an update with React (which will fetch the updated data)
      startTransition(refresh);
    },
    []
  );

  return [isPending, mutate];
}
