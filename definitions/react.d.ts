import "react";

declare module "react" {
  // Unstable APIs used by this package ...

  export function unstable_getCacheForType<T>(resourceType: () => T): T;
  export function unstable_useCacheRefresh(): () => void;
}
