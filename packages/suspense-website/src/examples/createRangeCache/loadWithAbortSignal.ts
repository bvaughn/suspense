type Token = any;

interface Line {
  index: number;
}

const getPointForValue = (value: Line) => value.index;

// REMOVE_BEFORE

import { CacheLoadOptions, createRangeCache } from "suspense";

createRangeCache<number, [fileName: string], Line>({
  load: async (
    start: number,
    end: number,
    fileName: string,
    options: CacheLoadOptions
  ) => {
    // An AbortSignal is passed in as the final parameter with each request
    const { signal } = options;

    // The native fetch API supports AbortSignals
    // All that's required to support cancellation is to forward the signal
    const response = await fetch(
      `/api/parse-code?file=${fileName}&startLine=${start}&stopLine=${end}`,
      { signal }
    );
    const json = await response.json();
    return json;
  },

  getPointForValue,
});
