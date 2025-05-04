import { processExample } from "..";

import cache from "./cache?raw";
import abort from "./abort?raw";
import async from "./async?raw";
import cacheWithKey from "./cacheWithKey?raw";
import cacheWithSignal from "./cacheWithSignal?raw";
import cacheWithLRU from "./cacheWithLRU?raw";
import cacheWithWeakRefMap from "./cacheWithWeakRefMap?raw";
import evict from "./evict?raw";
import hook from "./hook?raw";
import immutable from "./immutable?raw";
import prefetch from "./prefetch?raw";
import suspense from "./suspense?raw";
import sync from "./sync?raw";

export const createCache = {
  cache: processExample(cache),
  abort: processExample(abort),
  async: processExample(async),
  cacheWithKey: processExample(cacheWithKey),
  cacheWithSignal: processExample(cacheWithSignal),
  cacheWithLRU: processExample(cacheWithLRU),
  cacheWithWeakRefMap: processExample(cacheWithWeakRefMap),
  evict: processExample(evict),
  hook: processExample(hook),
  immutable: processExample(immutable),
  prefetch: processExample(prefetch),
  suspense: processExample(suspense),
  sync: processExample(sync),
};
