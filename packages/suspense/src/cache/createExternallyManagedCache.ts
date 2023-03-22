import { Cache } from "../types";
import { createCache, CreateCacheOptions } from "./createCache";

export function createExternallyManagedCache<Params extends Array<any>, Value>(
  options: Omit<CreateCacheOptions<Params, Value>, "load"> & {
    timeout?: number;
    timeoutMessage?: string;
  }
): Cache<Params, Value> {
  const { timeout, timeoutMessage = "Timed out", ...rest } = options;

  return createCache<Params, Value>({
    ...rest,
    load: async () =>
      new Promise((resolve, reject) => {
        if (timeout != null) {
          setTimeout(() => {
            reject(timeoutMessage);
          }, timeout);
        }
      }),
  });
}
