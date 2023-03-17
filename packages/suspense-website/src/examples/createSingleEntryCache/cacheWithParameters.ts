import { createSingleEntryCache } from "suspense";

class ApiClient {
  async getRecentArticles() {
    return JSON.parse("");
  }
}

// REMOVE_BEFORE

createSingleEntryCache<[ApiClient], JSON>({
  load: async ([apiClient]) => apiClient.getRecentArticles(),
});
