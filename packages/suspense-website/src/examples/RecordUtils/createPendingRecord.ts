import { createDeferred, createPendingRecord } from "suspense";

const abortController = new AbortController();
const deferred = createDeferred<number>();

createPendingRecord(deferred, abortController);
