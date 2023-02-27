import { CacheLoadOptions, createCache } from "suspense";

// REMOVE_BEFORE

createCache<[userId: string], JSON>({
  load: async (userId: string, options: CacheLoadOptions) => {
    // An AbortSignal is passed in as the final parameter with each request
    const { signal } = options;

    // The native fetch API supports AbortSignals
    // All that's required to support cancellation is to forward the signal
    const response = await fetch(`/api/user?id=${userId}`, {
      signal,
    });
    const json = await response.json();
    return json;
  },
});
