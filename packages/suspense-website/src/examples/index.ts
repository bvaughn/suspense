export { createCache } from "./createCache";
export { createDeferred } from "./createDeferred";
export { createExternallyManagedCache } from "./createExternallyManagedCache";
export { createIntervalCache } from "./createIntervalCache";
export { createSingleEntryCache } from "./createSingleEntryCache";
export { createStreamingCache } from "./createStreamingCache";
export { debugLogging } from "./debugLogging";
export { demos } from "./demos";
export { isPromiseLike } from "./isPromiseLike";
export { recordUtils } from "./RecordUtils";
export { useCacheMutation } from "./useCacheMutation";
export { useImperativeCacheValue } from "./useImperativeCacheValue";
export { useImperativeIntervalCacheValues } from "./useImperativeIntervalCacheValues";

export function processExample(text: string): string {
  let index = text.indexOf("// REMOVE_BEFORE");
  if (index >= 0) {
    text = text.substring(index + "// REMOVE_BEFORE".length);
  }

  index = text.indexOf("// REMOVE_AFTER");
  if (index >= 0) {
    text = text.substring(0, index);
  }

  return text.trim();
}
