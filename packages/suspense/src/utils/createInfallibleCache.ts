import { isThenable } from "./isThenable";

export function createInfallibleCache<TParams extends Array<any>, TValue>(
  suspenseCache: (...params: TParams) => TValue
): (...params: TParams) => TValue | undefined {
  return function createInfallibleSuspenseCache(...params) {
    try {
      return suspenseCache(...params);
    } catch (errorOrThenable) {
      if (isThenable(errorOrThenable)) {
        throw errorOrThenable;
      } else {
        return undefined;
      }
    }
  };
}
