import { createCache } from "suspense";

const load = async () => null as any;

// REMOVE_BEFORE

import { WeakRefMap } from "suspense";

createCache<[userId: string], JSON>({
  config: {
    getCache: (onEvict) => new WeakRefMap(onEvict),
  },
  load,
  // ...
});
