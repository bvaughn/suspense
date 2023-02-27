import { createSingleEntryCache } from "suspense";

const articlesCache = createSingleEntryCache<[], JSON>({
  load: async () => {
    const response = await fetch(`/api/articles/?sort=DESC&limit=10`);
    const json = await response.json();
    return json;
  },
});
