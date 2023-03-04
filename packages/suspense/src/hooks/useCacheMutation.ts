import {
  unstable_useCacheRefresh as useCacheRefresh,
  useCallback,
  useLayoutEffect,
  useRef,
  useTransition,
} from "react";
import { Cache } from "../types";

type EffectCallback = () => Promise<void>;

type MutationCallback<Params extends Array<any>, Value> = (
  cache: (value: Value, ...params: Params) => void
) => Promise<void>;

type MutateOptions<Params extends Array<any>, Value> = {
  effect?: EffectCallback;
  mutate: MutationCallback<Params, Value>;
  params?: Params;
};

export function useCacheMutation<Params extends Array<any>, Value>(
  cache: Cache<Params, Value>
): [
  isPending: boolean,
  mutate: (options: MutateOptions<Params, Value>) => Promise<void>
] {
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

  const mutate = useCallback(
    async (options: MutateOptions<Params, Value>) => {
      const { effect, mutate, params } = options;

      let cacheCalls: [value: Value, ...params: Params][] = [];

      // Allow external mutations (e.g. API calls) to finish first
      await mutate((value: Value, ...params: Params) => {
        cacheCalls.push([value, ...params]);
      });

      // If this mutation is related to a specific record, clear the stale record from the in-memory cache
      if (params != null) {
        cache.evict(...params);
      }

      // If the mutation returned any updated values, (e.g. API responses)
      // pre-cache them before re-rendering to avoid unnecessary fetches
      cacheCalls.forEach(([value, ...params]) => {
        cache.cache(value, ...params);
      });

      if (effect) {
        pendingEffectsRef.current.push(effect);
      }

      // Finally schedule an update with React (which will fetch the updated data)
      startTransition(refresh);
    },
    [cache, refresh, startTransition]
  );

  return [isPending, mutate];
}
