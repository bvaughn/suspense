import { Thenable } from "../types";

export function isThenable(value: any): value is Thenable<any> {
  return value != null && typeof value.then === "function";
}
