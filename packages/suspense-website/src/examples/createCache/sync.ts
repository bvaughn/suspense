import { exampleCache } from "./cache";

const userId = "fake";
// REMOVE_BEFORE
// Returns a cached value if one has already been saved in the cache
const userDataOrUndefined = exampleCache.getValueIfCached(userId);

// Returns a cached value or throws if none has been loaded
const userData = exampleCache.getValue(userId);
