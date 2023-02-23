import { isThennable } from "./isThennable";

export function createInfallibleCache<TParams extends Array<any>, TValue>(
  suspenseCache: (...params: TParams) => TValue
): (...params: TParams) => TValue | undefined {
  return function createInfallibleSuspenseCache(...params) {
    try {
      return suspenseCache(...params);
    } catch (errorOrThennable) {
      if (isThennable(errorOrThennable)) {
        throw errorOrThennable;
      } else {
        return undefined;
      }
    }
  };
}
