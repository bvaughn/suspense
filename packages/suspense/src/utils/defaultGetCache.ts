import { Cacher } from "../types";

export function defaultGetCache<Key, Value>(): Cacher<Key, Value> {
  return new Map<Key, Value>();
}
