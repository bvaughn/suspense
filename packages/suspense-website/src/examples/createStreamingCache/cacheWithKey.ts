import { createStreamingCache, StreamingCacheLoadOptions } from "suspense";

class ApiClient {
  async fetchComments(
    id: string,
    onData: (data: string[]) => void,
    onComplete: () => void
  ) {
    return JSON.parse("");
  }
}

type Comment = any;

// REMOVE_BEFORE
export const userCommentsCache = createStreamingCache<
  [client: ApiClient, id: string],
  Comment
>(
  // In this example, comments are fetched using a "client" object
  async (
    { resolve, update }: StreamingCacheLoadOptions<string>,
    client: ApiClient,
    id: string
  ) =>
    client.fetchComments(
      id,
      (comments: Comment[]) => update(comments),
      () => resolve()
    ),

  // The id parameter is sufficiently unique to be the key
  (client: ApiClient, id: string) => id
);
