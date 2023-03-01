import { createRangeCache } from "suspense";

interface Token {
  // ...
}

interface Line {
  index: number;
  parsedText: Token[];
  rawText: string;
}

const sourceCodeCache = createRangeCache<number, [fileName: string], Line>({
  // Load lines within the specified start/end range
  load: async (start: number, end: number, fileName: string) => {
    const response = await fetch(
      `/api/parse-code?file=${fileName}&startLine=${start}&stopLine=${end}`
    );
    const json = await response.json();
    return json;
  },

  // Extract the line index from a Line value
  // This enables the range cache to merged and sort loaded Lines
  getPointForValue: (value: Line): number => {
    return value.index;
  },
});
