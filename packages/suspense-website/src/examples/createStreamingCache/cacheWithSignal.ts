type Comment = any;
// REMOVE_BEFORE
import { createStreamingCache, StreamingCacheLoadOptions } from "suspense";

export const userCommentsCache = createStreamingCache<
  [userId: string],
  Comment
>(
  async (
    { signal, ...rest }: StreamingCacheLoadOptions<Comment>,
    userId: string
  ) => {
    signal.onabort = () => {
      // Abort the in-progress request here.
      // How to do this depends on how the data is loaded.
    };

    // ...
  }
);
