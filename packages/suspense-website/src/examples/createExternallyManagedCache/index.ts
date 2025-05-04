import { processExample } from "..";

import cacheError from "./cacheError?raw";
import cacheValue from "./cacheValue?raw";
import createCache from "./createCache?raw";

export const createExternallyManagedCache = {
  cacheError: processExample(cacheError),
  cacheValue: processExample(cacheValue),
  createCache: processExample(createCache),
};
