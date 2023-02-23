import { createWakeable } from "suspense";

const wakeable = createWakeable<string>();

// REMOVE_BEFORE
wakeable.then(
  function onFulfill(value: string) {
    // ..
  },
  function onReject(error: Error) {
    // ...
  }
);
