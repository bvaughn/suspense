import { searchResultsCache } from "./cacheWithPartialResults";

// REMOVE_BEFORE

const results = searchResultsCache.read(1672531200000, 1673136000000);
const showPartialResultsUI = searchResultsCache.isPartialResult(results);
