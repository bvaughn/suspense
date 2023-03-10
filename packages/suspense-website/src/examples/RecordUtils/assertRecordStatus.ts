import { createResolvedRecord } from "suspense";

const record = createResolvedRecord(1);

// REMOVE_BEFORE

import {
  assertPendingRecord,
  assertRejectedRecord,
  assertResolvedRecord,
} from "suspense";

assertPendingRecord<number>(record); // record is PendingRecord<Type>
assertRejectedRecord(record); // record is RejectedRecord<Type>
assertResolvedRecord<number>(record); // record is ResolvedRecord<Type>
