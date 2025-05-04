import { processExample } from "..";

import cache from "./cache?raw";
import cacheWithParameters from "./cacheWithParameters?raw";

export const createSingleEntryCache = {
  cache: processExample(cache),
  cacheWithParameters: processExample(cacheWithParameters),
};
