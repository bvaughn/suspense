import { createCache } from "suspense";

export const exampleCache = createCache<[userId: string], JSON>(
  (userId: string) => userId,
  async (userId: string) => {
    const response = await fetch(`https://example.com/user?id=${userId}`);
    return await response.json();
  }
);
