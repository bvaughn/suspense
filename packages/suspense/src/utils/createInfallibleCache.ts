import { isPromiseLike } from "./isPromiseLike";

export function createInfallibleCache<TParams extends Array<any>, TValue>(
  suspenseCache: (...params: TParams) => TValue
): (...params: TParams) => TValue | undefined {
  return function createInfallibleSuspenseCache(...params) {
    try {
      return suspenseCache(...params);
    } catch (errorOrPromiseLike) {
      if (isPromiseLike(errorOrPromiseLike)) {
        throw errorOrPromiseLike;
      } else {
        return undefined;
      }
    }
  };
}
