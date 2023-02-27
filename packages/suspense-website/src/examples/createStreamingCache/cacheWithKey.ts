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

createStreamingCache<[client: ApiClient, id: string], Comment>({
  // The "client" parameter can't be serialized to a string
  // The "id" parameter is unique, so it can be the key
  getKey: (client: ApiClient, id: string) => id,

  // In this example, comments are fetched using a "client" object
  load: async (
    options: StreamingCacheLoadOptions<Comment>,
    client: ApiClient,
    id: string
  ) => {
    const { resolve, update } = options;

    return client.fetchComments(
      id,
      (comments: Comment[]) => update(comments),
      () => resolve()
    );
  },
});
