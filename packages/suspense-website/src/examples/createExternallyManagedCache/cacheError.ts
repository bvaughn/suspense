import { managedCache } from "./createCache";

// REMOVE_BEFORE

const error = Error("Could not load JSON with id:example");

managedCache.cacheError(error, "example");
