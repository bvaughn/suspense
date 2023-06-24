const load: any = null;

// REMOVE_BEFORE

import { createCache } from "suspense";

// Cache can be configured during initialization
const cache = createCache({
  debugLogging: true,
  load,
});

// They can also be turned on/off later
cache.disableDebugLogging();
cache.enableDebugLogging();
