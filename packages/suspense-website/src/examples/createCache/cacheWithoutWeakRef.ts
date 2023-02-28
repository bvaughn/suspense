import { CacheLoadOptions, createCache } from "suspense";

const load = async () => null as any;

// REMOVE_BEFORE

createCache<[userId: string], JSON>({
  config: { useWeakRef: false },
  load,
  // ...
});
