import { createCache } from "suspense";

type UserData = JSON;

export const exampleCache = createCache<[userId: string], UserData>(
  (userId: string) => userId,
  async (userId: string) => {
    const response = await fetch(`https://example.com/user?id=${userId}`);
    return await response.json();
  }
);
