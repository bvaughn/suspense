import { createStreamingCache, StreamingProgressNotifier } from "suspense";

class ApiClient {
  async streamData(
    id: string,
    onData: (data: string[]) => void,
    onComplete: () => void
  ) {
    return JSON.parse("");
  }
}

// REMOVE_BEFORE
export const exampleStreamingCache = createStreamingCache<
  [client: ApiClient, id: string],
  string
>(
  // In this example, data is streamed by a "client" object
  async (
    notifier: StreamingProgressNotifier<string>,
    client: ApiClient,
    id: string
  ) =>
    client.streamData(
      id,
      (values: string[]) => notifier.update(values),
      () => notifier.resolve()
    ),

  // The id parameter is sufficiently unique to be the key
  (client: ApiClient, id: string) => id
);
