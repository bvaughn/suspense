import { createCache } from "suspense";

class ApiClient {
  async loadData(id: string) {
    return JSON.parse("");
  }
}

// REMOVE_BEFORE
createCache<[client: ApiClient, id: string], JSON>(
  // In this example, data is loaded by a "client" object
  async (client: ApiClient, id: string) => client.loadData(id),

  // The id parameter is sufficiently unique to be the key
  (client: ApiClient, id: string) => id
);
