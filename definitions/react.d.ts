import "react";

declare module "react" {
  // Unstable APIs used by this package ...
  export function unstable_useCacheRefresh(): (
    resourceType?: () => any,
    seed?: any
  ) => void;
}
