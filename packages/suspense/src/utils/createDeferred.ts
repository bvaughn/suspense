import { Deferred } from "../types";

let MAX_LOOP_COUNT = 1_000;

// A "thenable" is a subset of the Promise API.
// We could use a Promise as thenable, but Promises have a downside: they use the microtask queue.
// An advantage to creating a custom thenable is synchronous resolution (or rejection).
//
// A "deferred" is a "thenable" that has convenience resolve/reject methods.
export function createDeferred<Type>(debugLabel?: string): Deferred<Type> {
  const resolveCallbacks: Set<(value: Type) => any> = new Set();
  const rejectCallbacks: Set<(error: Error) => any> = new Set();

  let status: "unresolved" | "resolved" | "rejected" = "unresolved";
  let rejectedValue: Error | null = null;
  let resolvedValue: Type | undefined;

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
        | ((value: Type) => ThenResult | PromiseLike<ThenResult>)
        | undefined
        | null,
      rejectCallback?:
        | ((error: Error) => PromiseLike<ErrorResult>)
        | undefined
        | null
    ): PromiseLike<ThenResult | ErrorResult> {
      switch (status) {
        case "unresolved":
          if (resolveCallback) {
            resolveCallbacks.add(resolveCallback);
          }
          if (rejectCallback) {
            rejectCallbacks.add(rejectCallback);
          }
          break;
        case "rejected":
          checkCircularPromiseLikeChain();
          if (rejectCallback) {
            rejectCallback(rejectedValue!);
          }
          break;
        case "resolved":
          checkCircularPromiseLikeChain();
          if (resolveCallback) {
            resolveCallback(resolvedValue!);
          }
          break;
      }

      // @ts-ignore
      return null;
    },
    reject(error: Error) {
      if (status !== "unresolved") {
        throw Error(`Deferred has already been ${status}`);
      }

      status = "rejected";
      rejectedValue = error;

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
    resolve(value: Type) {
      if (status !== "unresolved") {
        throw Error(`Deferred has already been ${status}`);
      }

      status = "resolved";
      resolvedValue = value;

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
