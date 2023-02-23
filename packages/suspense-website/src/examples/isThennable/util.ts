function methodThatMaySuspend() {}
// REMOVE_BEFORE
import { isThennable } from "suspense";

try {
  methodThatMaySuspend();
} catch (errorOrThennable) {
  if (isThennable(errorOrThennable)) {
    // ...
  }

  throw errorOrThennable;
}
