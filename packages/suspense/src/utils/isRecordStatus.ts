import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "../constants";
import {
  PendingRecord,
  Record,
  RejectedRecord,
  ResolvedRecord,
} from "../types";

export function isPendingRecord(
  record: Record<any>
): record is PendingRecord<any> {
  return record.status === STATUS_PENDING;
}

export function isRejectedRecord(
  record: Record<any>
): record is RejectedRecord {
  return record.status === STATUS_REJECTED;
}

export function isResolvedRecord(
  record: Record<any>
): record is ResolvedRecord<any> {
  return record.status === STATUS_RESOLVED;
}
