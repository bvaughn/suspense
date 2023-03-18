import { CacheMap } from "../types";

export function defaultGetCache<Key, Value>(): CacheMap<Key, Value> {
  return new Map<Key, Value>();
}
