import { readFileSync } from "fs";
import { join } from "path";
import { processExample } from "../processExample";

const async = processExample(readFileSync(join(__dirname, "async.ts"), "utf8"));
const cache = processExample(readFileSync(join(__dirname, "cache.ts"), "utf8"));
const evict = processExample(readFileSync(join(__dirname, "evict.ts"), "utf8"));
const hook = processExample(readFileSync(join(__dirname, "hook.ts"), "utf8"));
const prefetch = processExample(
  readFileSync(join(__dirname, "prefetch.ts"), "utf8")
);
const suspense = processExample(
  readFileSync(join(__dirname, "suspense.ts"), "utf8")
);

export { async, cache, evict, hook, prefetch, suspense };
