import { CacheLoadOptions, createCache } from "suspense";

export const userProfileCache = createCache<[userId: string], JSON>(
  async (userId: string, options: CacheLoadOptions) => {
    const { signal } = options;

    // The native fetch API supports AbortSignals
    // All that's required to support cancellation is to forward the signal
    const response = await fetch(`https://example.com/user?id=${userId}`, {
      signal,
    });
    const json = await response.json();
    return json;
  }
);
