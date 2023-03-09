import {
  Deferred,
  PendingRecord,
  Record,
  RejectedRecord,
  ResolvedRecord,
} from "../types";
import { createDeferred } from "./createDeferred";
import {
  createPendingRecordData,
  createRejectedRecordData,
  createResolvedRecordData,
} from "./RecordData";

export function createPendingRecord<Type>(
  deferred: Deferred<Type> = createDeferred<Type>(),
  abortController: AbortController = new AbortController()
): PendingRecord<Type> {
  return { data: createPendingRecordData<Type>(deferred, abortController) };
}

export function createRejectedRecord(error: any): RejectedRecord {
  return { data: createRejectedRecordData(error) };
}

export function createResolvedRecord<Type>(
  value: Type,
  useWeakRef: boolean = false
): ResolvedRecord<Type> {
  return { data: createResolvedRecordData<Type>(value, useWeakRef) };
}

export function updateRecordToPending<Type>(
  record: Record<Type>,
  deferred: Deferred<Type> = createDeferred<Type>(),
  abortController: AbortController = new AbortController()
): void {
  record.data = createPendingRecordData<Type>(deferred, abortController);
}

export function updateRecordToRejected(record: Record<any>, error: any): void {
  record.data = createRejectedRecordData(error);
}

export function updateRecordToResolved<Type>(
  record: Record<Type>,
  value: Type,
  useWeak: boolean = false
): void {
  record.data = createResolvedRecordData<Type>(value, useWeak);
}
