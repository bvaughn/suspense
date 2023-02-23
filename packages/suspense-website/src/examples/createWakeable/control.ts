import { createWakeable } from "suspense";

const wakeable = createWakeable<string>();

// REMOVE_BEFORE
// It can be (sync/async) resolved with a value:
wakeable.resolve("Example value");

// Or it can be rejected with an error:
wakeable.reject("Something went wrong");
