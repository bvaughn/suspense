import { readFileSync } from "fs";
import { join } from "path";

const async = readFileSync(join(__dirname, "async.ts"), "utf8");
const cache = readFileSync(join(__dirname, "cache.ts"), "utf8");
const prefetch = readFileSync(join(__dirname, "prefetch.ts"), "utf8");
const suspense = readFileSync(join(__dirname, "suspense.ts"), "utf8");

export { async, cache, prefetch, suspense };
