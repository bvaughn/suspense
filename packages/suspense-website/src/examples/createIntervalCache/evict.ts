import { sourceCodeCache } from "./cache";

const fileName = "";

// REMOVE_BEFORE

// Evict all loaded lines for a specific file
sourceCodeCache.evict(fileName);

// Evict all loaded lines for ever file
sourceCodeCache.evictAll();
