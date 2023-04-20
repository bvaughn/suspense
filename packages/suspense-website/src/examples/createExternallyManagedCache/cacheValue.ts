import { managedCache } from "./createCache";

const json = {} as JSON;

// REMOVE_BEFORE

managedCache.cacheValue(json, "example");
