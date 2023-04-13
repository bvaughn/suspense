import { createCache } from "suspense";

export const sourceCodeCache = createCache<[path: string], JSON>({
  config: {
    // Signals that this cache will never be mutated
    immutable: true,
  },
  load: async ([path]) => {
    const response = await fetch(`/api/source?path=${path}`);
    const json = await response.json();
    return json;
  },
});
