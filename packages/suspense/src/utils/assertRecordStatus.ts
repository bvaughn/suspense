import { assert } from "./assert";
import {
  isPendingRecord,
  isRejectedRecord,
  isResolvedRecord,
} from "./isRecordStatus";
import {
  ResolvedRecord,
  Record,
  PendingRecord,
  RejectedRecord,
} from "../types";

export function assertPendingRecord(
  record: Record<any>
): record is PendingRecord<any> {
  assert(isPendingRecord(record));
  return true;
}

export function assertRejectedRecord(
  record: Record<any>
): record is RejectedRecord {
  assert(isRejectedRecord(record));
  return true;
}

export function assertResolvedRecord(
  record: Record<any>
): record is ResolvedRecord<any> {
  assert(isResolvedRecord(record));
  return true;
}
