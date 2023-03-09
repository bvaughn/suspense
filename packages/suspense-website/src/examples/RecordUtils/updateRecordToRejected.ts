import { createPendingRecord } from "suspense";

const record = createPendingRecord();

// REMOVE_BEFORE

import { updateRecordToRejected } from "suspense";

updateRecordToRejected(record, new Error("Something went wrong"));
