import { createPendingRecord } from "suspense";

const record = createPendingRecord();

// REMOVE_BEFORE

import { createDeferred, updateRecordToPending } from "suspense";

const abortController = new AbortController();
const deferred = createDeferred<number>();

updateRecordToPending(record, deferred, abortController);
