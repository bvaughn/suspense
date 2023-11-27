import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "..";
import {
  Deferred,
  StatusPending,
  StatusRejected,
  StatusResolved,
} from "../types";

// A "thenable" is a subset of the Promise API.
// We could use a Promise as thenable, but Promises have a downside: they use the microtask queue.
// An advantage to creating a custom thenable is synchronous resolution (or rejection).
//
// A "deferred" is a "thenable" that has convenience resolve/reject methods.
export function createDeferred<Type>(debugLabel?: string): Deferred<Type> {
  let status: StatusPending | StatusRejected | StatusResolved = STATUS_PENDING;

  let rejectPromise: (error: Error) => void;
  let resolvePromise: (value: Type | PromiseLike<Type>) => void;

  const promise = new Promise<Type>((resolve, reject) => {
    rejectPromise = reject;
    resolvePromise = resolve;
  });
  promise.catch(() => {
    // Prevent unhandled promise rejection warning.
  });

  function assertPending() {
    if (status !== STATUS_PENDING) {
      throw Error(`Deferred has already been ${status}`);
    }
  }

  const deferred: Deferred<Type> = {
    // @ts-ignore
    debugLabel,

    promise,

    reject(error: Error) {
      assertPending();

      status = STATUS_REJECTED;

      rejectPromise(error);
    },

    resolve(value: Type) {
      assertPending();

      status = STATUS_RESOLVED;

      resolvePromise(value);
    },

    get status() {
      return status;
    },
  };

  return deferred;
}
