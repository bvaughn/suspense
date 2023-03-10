import { createCache } from "suspense";

export const userProfileCache = createCache<[userId: string], JSON>({
  load: async ([userId]) => {
    const response = await fetch(`/api/user?id=${userId}`);
    const json = await response.json();
    return json;
  },
});
