import { readFileSync } from "fs";
import { join } from "path";

function processExample(text: string): string {
  const index = text.indexOf("REMOVE_BEFORE");
  if (index >= 0) {
    text = text.substring(index + "REMOVE_BEFORE".length);
  }

  return text.trim();
}

const createCache = {
  async: processExample(
    readFileSync(join(__dirname, "createCache", "async.ts"), "utf8")
  ),
  cache: processExample(
    readFileSync(join(__dirname, "createCache", "cache.ts"), "utf8")
  ),
  cacheWithKey: processExample(
    readFileSync(join(__dirname, "createCache", "cacheWithKey.ts"), "utf8")
  ),
  evict: processExample(
    readFileSync(join(__dirname, "createCache", "evict.ts"), "utf8")
  ),
  hook: processExample(
    readFileSync(join(__dirname, "createCache", "hook.ts"), "utf8")
  ),
  prefetch: processExample(
    readFileSync(join(__dirname, "createCache", "prefetch.ts"), "utf8")
  ),
  suspense: processExample(
    readFileSync(join(__dirname, "createCache", "suspense.ts"), "utf8")
  ),
  sync: processExample(
    readFileSync(join(__dirname, "createCache", "sync.ts"), "utf8")
  ),
};

const createDeferred = {
  control: processExample(
    readFileSync(join(__dirname, "createDeferred", "control.ts"), "utf8")
  ),
  create: processExample(
    readFileSync(join(__dirname, "createDeferred", "create.ts"), "utf8")
  ),
  observe: processExample(
    readFileSync(join(__dirname, "createDeferred", "observe.ts"), "utf8")
  ),
};

const createStreamingCache = {
  cache: processExample(
    readFileSync(join(__dirname, "createStreamingCache", "cache.ts"), "utf8")
  ),
  cacheWithKey: processExample(
    readFileSync(
      join(__dirname, "createStreamingCache", "cacheWithKey.ts"),
      "utf8"
    )
  ),
  hook: processExample(
    readFileSync(join(__dirname, "createStreamingCache", "hook.ts"), "utf8")
  ),
  prefetch: processExample(
    readFileSync(join(__dirname, "createStreamingCache", "prefetch.ts"), "utf8")
  ),
};

const isThennable = {
  util: processExample(
    readFileSync(join(__dirname, "isThennable", "util.ts"), "utf8")
  ),
};

export { createCache, createDeferred, createStreamingCache, isThennable };
