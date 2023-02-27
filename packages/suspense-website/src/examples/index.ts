import { readFileSync } from "fs";
import { join } from "path";

function processExample(text: string): string {
  let index = text.indexOf("// REMOVE_BEFORE");
  if (index >= 0) {
    text = text.substring(index + "// REMOVE_BEFORE".length);
  }

  index = text.indexOf("// REMOVE_AFTER");
  if (index >= 0) {
    text = text.substring(0, index);
  }

  return text.trim();
}

const createCache = {
  abort: processExample(
    readFileSync(join(__dirname, "createCache", "abort.ts"), "utf8")
  ),
  async: processExample(
    readFileSync(join(__dirname, "createCache", "async.ts"), "utf8")
  ),
  cache: processExample(
    readFileSync(join(__dirname, "createCache", "cache.ts"), "utf8")
  ),
  cacheWithKey: processExample(
    readFileSync(join(__dirname, "createCache", "cacheWithKey.ts"), "utf8")
  ),
  cacheWithSignal: processExample(
    readFileSync(join(__dirname, "createCache", "cacheWithSignal.ts"), "utf8")
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

const createSingleEntryCache = {
  cache: processExample(
    readFileSync(join(__dirname, "createSingleEntryCache", "cache.ts"), "utf8")
  ),
  cacheWithParameters: processExample(
    readFileSync(
      join(__dirname, "createSingleEntryCache", "cacheWithParameters.ts"),
      "utf8"
    )
  ),
};

const createStreamingCache = {
  abort: processExample(
    readFileSync(join(__dirname, "createStreamingCache", "abort.ts"), "utf8")
  ),
  cache: processExample(
    readFileSync(join(__dirname, "createStreamingCache", "cache.ts"), "utf8")
  ),
  cacheWithKey: processExample(
    readFileSync(
      join(__dirname, "createStreamingCache", "cacheWithKey.ts"),
      "utf8"
    )
  ),
  cacheWithSignal: processExample(
    readFileSync(
      join(__dirname, "createStreamingCache", "cacheWithSignal.ts"),
      "utf8"
    )
  ),
  evict: processExample(
    readFileSync(join(__dirname, "createStreamingCache", "evict.ts"), "utf8")
  ),
  hook: processExample(
    readFileSync(join(__dirname, "createStreamingCache", "hook.ts"), "utf8")
  ),
  prefetch: processExample(
    readFileSync(join(__dirname, "createStreamingCache", "prefetch.ts"), "utf8")
  ),
};

const demos = {
  abortRequest: {
    abort: processExample(
      readFileSync(join(__dirname, "demos", "abortRequest", "abort.ts"), "utf8")
    ),
  },
  mutatingCacheValue: {
    // TODO
  },
  renderingCacheStatus: {
    UserStatusBadge: processExample(
      readFileSync(
        join(
          __dirname,
          "demos",
          "rendering-status-while-fetching",
          "UserStatusBadge.tsx"
        ),
        "utf8"
      )
    ),
  },
  streamingCache: {
    Posts: processExample(
      readFileSync(
        join(__dirname, "demos", "streaming-cache", "Posts.tsx"),
        "utf8"
      )
    ),
  },
};

const isThenable = {
  util: processExample(
    readFileSync(join(__dirname, "isThenable", "util.ts"), "utf8")
  ),
};

export {
  createCache,
  createDeferred,
  createSingleEntryCache,
  createStreamingCache,
  demos,
  isThenable,
};
