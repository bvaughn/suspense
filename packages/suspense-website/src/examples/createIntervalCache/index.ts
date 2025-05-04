import { processExample } from "..";

import cache from "./cache?raw";
import cacheWithPartialResults from "./cacheWithPartialResults?raw";
import callingAbort from "./callingAbort?raw";
import detectingPartialResults from "./detectingPartialResults?raw";
import evict from "./evict?raw";
import hook from "./hook?raw";
import loadWithAbortSignal from "./loadWithAbortSignal?raw";

export const createIntervalCache = {
  cache: processExample(cache),
  cacheWithPartialResults: processExample(cacheWithPartialResults),
  callingAbort: processExample(callingAbort),
  detectingPartialResults: processExample(detectingPartialResults),
  evict: processExample(evict),
  hook: processExample(hook),
  loadWithAbortSignal: processExample(loadWithAbortSignal),
};
