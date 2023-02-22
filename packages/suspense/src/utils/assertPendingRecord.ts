import { STATUS_PENDING } from "../constants";
import { Record } from "../types";
import { assert } from "./assert";

export function assertPendingRecord(record: Record<any>): boolean {
  assert(record.status === STATUS_PENDING);
  return true;
}
