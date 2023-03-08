import { Deferred, Status } from "../types";

// A "thenable" is a subset of the Promise API.
// We could use a Promise as thenable, but Promises have a downside: they use the microtask queue.
// An advantage to creating a custom thenable is synchronous resolution (or rejection).
//
// A "deferred" is a "thenable" that has convenience resolve/reject methods.
export function createDeferred<Type>(debugLabel?: string): Deferred<Type> {
  let status: Status = "pending";

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
    if (status !== "pending") {
      throw Error(`Deferred has already been ${status}`);
    }
  }

  const deferred: Deferred<Type> = {
    // @ts-ignore
    debugLabel,

    catch<ThenResult = Type, ErrorResult = never>(
      rejectCallback?:
        | ((error: Error) => Promise<ErrorResult>)
        | undefined
        | null
    ): Promise<ThenResult | ErrorResult> {
      // @ts-ignore
      return promise.catch(rejectCallback);
    },

    finally(onFinally?: (() => void) | undefined | null) {
      return promise.finally(onFinally);
    },

    then<ThenResult = Type, ErrorResult = never>(
      resolveCallback?:
        | ((value: Type) => ThenResult | Promise<ThenResult>)
        | undefined
        | null,
      rejectCallback?:
        | ((error: Error) => Promise<ErrorResult>)
        | undefined
        | null
    ): Promise<ThenResult | ErrorResult> {
      return promise.then(resolveCallback, rejectCallback);
    },

    reject(error: Error) {
      assertPending();

      status = "rejected";

      rejectPromise(error);
    },

    resolve(value: Type) {
      assertPending();

      status = "resolved";

      resolvePromise(value);
    },
  };

  return deferred;
}
