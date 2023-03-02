type Token = any;

// REMOVE_BEFORE

import { createRangeCache } from "suspense";

interface Line {
  index: number;
  parsedText: Token[];
  rawText: string;
}

const sourceCodeCache = createRangeCache<number, [fileName: string], Line>({
  // Load lines within the specified start/end range
  // Note the first two params passed to function are the start/end points
  load: async (start: number, end: number, fileName: string) => {
    const response = await fetch(
      `/api/parse-code?file=${fileName}&startLine=${start}&stopLine=${end}`
    );
    const json = await response.json();
    return json;
  },

  // Determine where a value falls within a range
  // The cache uses this to merged and sort loaded values
  // The "point" is the line number in this example
  getPointForValue: (value: Line): number => {
    return value.index;
  },
});
