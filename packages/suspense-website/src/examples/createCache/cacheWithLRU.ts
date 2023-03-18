import { createCache, Record } from "suspense";

const load = async () => null as any;

// REMOVE_BEFORE

import LRUCache from "lru-cache";

createCache<[userId: string], JSON>({
  config: {
    getCache: (onEvict) =>
      new LRUCache<string, Record<JSON>>({
        max: 100,
        dispose: (value, key, reason) => {
          if (reason === "evict") {
            onEvict(key);
          }
        },
      }),
  },
  load,
  // ...
});
