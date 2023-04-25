type Token = any;

interface Result {}

const getPointForValue = () => 1;

// REMOVE_BEFORE

import { IntervalCacheLoadOptions, createIntervalCache } from "suspense";

const searchResultsCache = createIntervalCache<number, [], Result>({
  load: async (
    startTimestamp: number,
    endTimestamp: number,
    options: IntervalCacheLoadOptions<Result>
  ) => {
    const response = await fetch(
      `/api/search?start=${startTimestamp}&end=${endTimestamp}`
    );

    const json = await response.json();
    if (json.hasMore) {
      // Notify the cache that this value only contains partial results
      // by calling the returnAsPartial() method.
      return options.returnAsPartial(json.results);
    } else {
      return json.results;
    }
  },
  getPointForValue,
});

// REMOVE_AFTER

export { searchResultsCache };
