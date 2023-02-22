import { STATUS_PENDING } from "./constants";
import { Record, Thennable } from "./types";

export function assert(
  expectedCondition: boolean,
  message: string = "Assertion failed!"
): asserts expectedCondition {
  if (!expectedCondition) {
    console.error(message);

    throw Error(message);
  }
}

export function assertPendingRecord(record: Record<any>): boolean {
  assert(record.status === STATUS_PENDING);
  return true;
}

export function isThennable(value: any): value is Thennable<any> {
  return value != null && typeof value.then === "function";
}

export function warnInDev(expectedCondition: boolean, message: string) {
  if (process.env.NODE_ENV !== "production") {
    if (!expectedCondition) {
      console.warn(message);
    }
  }
}
