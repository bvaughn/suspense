export function isPromiseLike(value: any): value is PromiseLike<any> {
  return value != null && typeof value.then === "function";
}
