import { createResolvedRecord } from "suspense";

const record = createResolvedRecord(1);

// REMOVE_BEFORE

import { isRejectedRecord, isPendingRecord, isResolvedRecord } from "suspense";

if (isPendingRecord(record)) {
  // ...
} else if (isRejectedRecord(record)) {
  // ...
} else if (isResolvedRecord(record)) {
  // ...
}
