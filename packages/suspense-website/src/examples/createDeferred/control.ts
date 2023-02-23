import { createDeferred } from "suspense";

const deferred = createDeferred<string>();

// REMOVE_BEFORE
// It can be (sync/async) resolved with a value:
deferred.resolve("Example value");

// Or it can be rejected with an error:
deferred.reject("Something went wrong");
