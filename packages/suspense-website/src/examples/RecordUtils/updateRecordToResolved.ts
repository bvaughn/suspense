import { createPendingRecord } from "suspense";

const record = createPendingRecord();

// REMOVE_BEFORE

import { updateRecordToResolved } from "suspense";

updateRecordToResolved(record, "some loaded value");
