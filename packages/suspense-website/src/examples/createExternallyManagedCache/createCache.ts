import { createExternallyManagedCache } from "suspense";

const managedCache = createExternallyManagedCache<[id: string], JSON>({
  getKey: ([id]) => id,
});

// REMOVE_AFTER

export { managedCache };
