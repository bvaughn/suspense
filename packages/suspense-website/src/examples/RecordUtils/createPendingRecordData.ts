import { createDeferred, createPendingRecordData } from "suspense";

const abortController = new AbortController();
const deferred = createDeferred<number>();

const data = createPendingRecordData(deferred, abortController);
