import { Cacher } from "../types";

export function defaultGetCacher<Key, Value>(): Cacher<Key, Value> {
  return new Map<Key, Value>();
}
