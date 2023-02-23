import { readFileSync } from "fs";
import { join } from "path";
import { processExample } from "../processExample";

const cache = processExample(readFileSync(join(__dirname, "cache.ts"), "utf8"));
const hook = processExample(readFileSync(join(__dirname, "hook.ts"), "utf8"));
const prefetch = processExample(
  readFileSync(join(__dirname, "prefetch.ts"), "utf8")
);

export { cache, hook, prefetch };
