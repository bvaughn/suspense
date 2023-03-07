import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "../constants";
import {
  PendingRecord,
  PendingRecordData,
  Record,
  RecordData,
  RejectedRecord,
  RejectedRecordData,
  ResolvedRecord,
  ResolvedRecordData,
} from "../types";

export function isPendingRecord<Type>(
  record: Record<Type>
): record is PendingRecord<Type> {
  return record.data.status === STATUS_PENDING;
}

export function isPendingRecordData<Type>(
  recordData: RecordData<Type>
): recordData is PendingRecordData<Type> {
  return recordData.status === STATUS_PENDING;
}

export function isRejectedRecord<Type>(
  record: Record<Type>
): record is RejectedRecord {
  return record.data.status === STATUS_REJECTED;
}

export function isRejectedRecordData<Type>(
  recordData: RecordData<Type>
): recordData is RejectedRecordData {
  return recordData.status === STATUS_REJECTED;
}

export function isResolvedRecord<Type>(
  record: Record<Type>
): record is ResolvedRecord<Type> {
  return record.data.status === STATUS_RESOLVED;
}

export function isResolvedRecordData<Type>(
  recordData: RecordData<Type>
): recordData is ResolvedRecordData<Type> {
  return recordData.status === STATUS_RESOLVED;
}
