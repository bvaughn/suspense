import { createStreamingCache, StreamingCacheLoadOptions } from "suspense";

type Comment = any;

// REMOVE_BEFORE
createStreamingCache<[userId: string], Comment>(
  async (options: StreamingCacheLoadOptions<Comment>, userId: string) => {
    // An AbortSignal is included in the options parameter with each request
    const { signal } = options;

    signal.onabort = () => {
      // Abort the in-progress request here.
      // How to do this depends on how the data is loaded.
    };

    // ...
  }
);
