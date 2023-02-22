import { Thennable } from "../types";

export function isThennable(value: any): value is Thennable<any> {
  return value != null && typeof value.then === "function";
}
