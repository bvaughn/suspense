import { STATUS_PENDING } from "../constants";
import { PendingRecord, Record } from "../types";

export function isPendingRecord(
  record: Record<any>
): record is PendingRecord<any> {
  return record.status === STATUS_PENDING;
}
