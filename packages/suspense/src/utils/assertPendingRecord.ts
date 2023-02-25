import { STATUS_PENDING } from "../constants";
import { PendingRecord, Record } from "../types";
import { assert } from "./assert";
import { isPendingRecord } from "./isPendingRecord";

export function assertPendingRecord(
  record: Record<any>
): record is PendingRecord<any> {
  assert(isPendingRecord(record));
  return true;
}
