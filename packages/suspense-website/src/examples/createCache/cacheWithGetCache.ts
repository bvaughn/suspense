import { CacheLoadOptions, createCache } from "suspense";

const load = async () => null as any;

declare class LRUCache<T> {
  constructor(options: { max: number; onEvict: (key: string) => void });
  get(key: string): T | undefined;
  set(key: string, value: T): this;
  clear(): void;
  has(key: string): boolean;
  delete(key: string): boolean;
}

// REMOVE_BEFORE

createCache<[userId: string], JSON>({
  config: {
    getCache: (onEvict) =>
      new LRUCache({
        max: 100,
        onEvict: (key) => onEvict(key),
      }),
  },
  load,
  // ...
});
