import { assert } from "./assert";
import {
  isPendingRecord,
  isPendingRecordData,
  isRejectedRecord,
  isRejectedRecordData,
  isResolvedRecord,
  isResolvedRecordData,
} from "./isRecordStatus";
import {
  ResolvedRecord,
  Record,
  PendingRecord,
  RejectedRecord,
  PendingRecordData,
  RejectedRecordData,
  ResolvedRecordData,
  RecordData,
} from "../types";

export function assertPendingRecord<Type>(
  record: Record<Type>
): record is PendingRecord<Type> {
  assert(isPendingRecord(record));
  return true;
}

export function assertPendingRecordData<Type>(
  recordData: RecordData<Type>
): recordData is PendingRecordData<Type> {
  assert(isPendingRecordData(recordData));
  return true;
}

export function assertRejectedRecord<Type>(
  record: Record<Type>
): record is RejectedRecord {
  assert(isRejectedRecord(record));
  return true;
}

export function assertRejectedRecordData<Type>(
  recordData: RecordData<Type>
): recordData is RejectedRecordData {
  assert(isRejectedRecordData(recordData));
  return true;
}

export function assertResolvedRecord<Type>(
  record: Record<Type>
): record is ResolvedRecord<Type> {
  assert(isResolvedRecord(record));
  return true;
}

export function assertResolvedRecordData<Type>(
  recordData: RecordData<Type>
): recordData is ResolvedRecordData<Type> {
  assert(isResolvedRecordData(recordData));
  return true;
}
