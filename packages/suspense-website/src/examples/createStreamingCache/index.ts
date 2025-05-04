import { processExample } from "..";

import abort from "./abort?raw";
import cache from "./cache?raw";
import cacheWithKey from "./cacheWithKey?raw";
import cacheWithSignal from "./cacheWithSignal?raw";
import evict from "./evict?raw";
import hook from "./hook?raw";
import prefetch from "./prefetch?raw";

export const createStreamingCache = {
  abort: processExample(abort),
  cache: processExample(cache),
  cacheWithKey: processExample(cacheWithKey),
  cacheWithSignal: processExample(cacheWithSignal),
  evict: processExample(evict),
  hook: processExample(hook),
  prefetch: processExample(prefetch),
};
