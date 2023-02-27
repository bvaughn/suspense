import { createCache } from "./createCache";
import { Cache, CacheLoadOptions, Thenable } from "../types";

const key = Symbol.for("createSingleEntryCache").toString();

export function createSingleEntryCache<
  Params extends Array<any>,
  Value
>(options: {
  load: (...params: [...Params, CacheLoadOptions]) => Thenable<Value> | Value;
  debugLabel?: string;
}): Cache<Params, Value> {
  if (options.hasOwnProperty("getKey")) {
    throw Error("createSingleEntryCache does not support a getKey option");
  }

  return createCache({
    getKey: () => key,
    ...options,
  });
}
