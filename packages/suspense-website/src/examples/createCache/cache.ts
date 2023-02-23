import { createCache } from "suspense";

export const exampleCache = createCache<[userId: string], JSON>(
  // Create unique key for params
  (userId: string) => userId,

  // Load data for params
  async (userId: string) => {
    const response = await fetch(`https://example.com/user?id=${userId}`);
    return await response.json();
  }
);
