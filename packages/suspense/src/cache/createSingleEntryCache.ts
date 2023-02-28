import { createCache, CreateCacheOptions } from "./createCache";
import { Cache } from "../types";

const key = Symbol.for("createSingleEntryCache").toString();

export function createSingleEntryCache<Params extends Array<any>, Value>(
  options: Omit<CreateCacheOptions<Params, Value>, "getKey">
): Cache<Params, Value> {
  if (options.hasOwnProperty("getKey")) {
    throw Error("createSingleEntryCache does not support a getKey option");
  }

  return createCache<Params, Value>({
    getKey: () => key,
    ...options,
  });
}
