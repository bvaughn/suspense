function methodThatMaySuspend() {}
// REMOVE_BEFORE
import { isThenable } from "suspense";

try {
  methodThatMaySuspend();
} catch (errorOrThenable) {
  if (isThenable(errorOrThenable)) {
    // ...
  }

  throw errorOrThenable;
}
