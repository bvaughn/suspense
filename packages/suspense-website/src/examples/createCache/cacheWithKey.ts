import { createCache } from "suspense";

class ApiClient {
  async loadData(id: string) {
    return JSON.parse("");
  }
}

// REMOVE_BEFORE

createCache<[client: ApiClient, id: string], JSON>({
  // The "client" parameter can't be serialized to a string
  // The "id" parameter is unique, so it can be the key
  getKey: ([client, id]) => id,

  // In this example, data is loaded by a "client" object
  load: async ([client, id]) => client.loadData(id),
});
