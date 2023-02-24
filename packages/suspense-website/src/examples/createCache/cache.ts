import { createCache } from "suspense";

export const userProfileCache = createCache<[userId: string], JSON>(
  async (userId: string) => {
    const response = await fetch(`https://example.com/user?id=${userId}`);
    const json = await response.json();
    return json;
  }
);
