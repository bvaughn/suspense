import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "../constants";
import {
  Deferred,
  PendingRecordData,
  RejectedRecordData,
  ResolvedRecordData,
} from "../types";
import { createDeferred } from "./createDeferred";

export function createPendingRecordData<Type>(
  deferred: Deferred<Type> = createDeferred<Type>(),
  abortController: AbortController = new AbortController()
): PendingRecordData<Type> {
  return {
    abortController,
    deferred,
    status: STATUS_PENDING,
  };
}

export function createRejectedRecordData(error: any): RejectedRecordData {
  return {
    error,
    status: STATUS_REJECTED,
  };
}

export function createResolvedRecordData<Type>(
  value: Type,
  useWeakRef: boolean = false
): ResolvedRecordData<Type> {
  if (useWeakRef) {
    if (value != null && typeof value === "object") {
      return {
        status: STATUS_RESOLVED,
        // @ts-ignore
        weakRef: new WeakRef(value),
      };
    }
  }

  return {
    status: STATUS_RESOLVED,
    value,
  };
}
