import { Deferred } from "../types";

let MAX_LOOP_COUNT = 1_000;

// A "thenable" is a subset of the Promise API.
// We could use a Promise as thenable, but Promises have a downside: they use the microtask queue.
// An advantage to creating a custom thenable is synchronous resolution (or rejection).
//
// A "deferred" is a "thenable" that has convenience resolve/reject methods.
export function createDeferred<Type>(debugLabel?: string): Deferred<Type> {
  const resolveCallbacks: Set<(value?: Type) => void> = new Set();
  const rejectCallbacks: Set<(error: Error) => void> = new Set();

  let status: "unresolved" | "resolved" | "rejected" = "unresolved";
  let data: Type | Error | null = null;

  let callbacksRegisteredAfterResolutionCount = 0;

  // Guard against a case where promise resolution results in a new deferred listener being added.
  // That cause would result in an infinite loop.
  // Note that our guard counter should be somewhat high to avoid false positives.
  // It is a legitimate use-case to register handlers after a deferred has been resolved or rejected.
  const checkCircularPromiseLikeChain = () => {
    if (++callbacksRegisteredAfterResolutionCount > MAX_LOOP_COUNT) {
      throw Error(
        `Circular thenable chain detected (infinite loop) for resource: ${debugLabel}`
      );
    }
  };

  const deferred: Deferred<Type> = {
    then<ThenResult = Type, ErrorResult = never>(
      resolveCallback?:
        | ((value?: Type) => ThenResult | PromiseLike<ThenResult>)
        | undefined
        | null,
      rejectCallback?:
        | ((error: Error) => PromiseLike<ErrorResult>)
        | undefined
        | null
    ) {
      switch (status) {
        case "unresolved":
          resolveCallbacks.add(resolveCallback);
          rejectCallbacks.add(rejectCallback);
          break;
        case "rejected":
          checkCircularPromiseLikeChain();
          rejectCallback(data as Error);
          break;
        case "resolved":
          checkCircularPromiseLikeChain();
          resolveCallback(data as Type);
          break;
      }

      return null;
    },
    reject(error: Error) {
      if (status !== "unresolved") {
        throw Error(`Deferred has already been ${status}`);
      }

      status = "rejected";
      data = error;

      rejectCallbacks.forEach((rejectCallback) => {
        let thrownValue = null;

        try {
          rejectCallback(error);
        } catch (error) {
          thrownValue = error;
        }

        if (thrownValue !== null) {
          throw thrownValue;
        }
      });

      rejectCallbacks.clear();
      resolveCallbacks.clear();
    },
    resolve(value?: Type) {
      if (status !== "unresolved") {
        throw Error(`Deferred has already been ${status}`);
      }

      status = "resolved";
      data = value;

      resolveCallbacks.forEach((resolveCallback) => {
        let thrownValue = null;

        try {
          resolveCallback(value);
        } catch (error) {
          thrownValue = error;
        }

        if (thrownValue !== null) {
          throw thrownValue;
        }
      });

      rejectCallbacks.clear();
      resolveCallbacks.clear();
    },
  };

  return deferred;
}
