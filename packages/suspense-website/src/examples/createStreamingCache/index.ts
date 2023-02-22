import { readFileSync } from "fs";
import { join } from "path";

const cache = readFileSync(join(__dirname, "cache.ts"), "utf8");
const hook = readFileSync(join(__dirname, "hook.ts"), "utf8");
const prefetch = readFileSync(join(__dirname, "prefetch.ts"), "utf8");

export { cache, hook, prefetch };
