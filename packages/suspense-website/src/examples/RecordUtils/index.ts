import { processExample } from "..";

import assertRecordStatus from "./assertRecordStatus?raw";
import createPendingRecord from "./createPendingRecord?raw";
import createPendingRecordData from "./createPendingRecordData?raw";
import createRejectedRecord from "./createRejectedRecord?raw";
import createRejectedRecordData from "./createRejectedRecordData?raw";
import createResolvedRecord from "./createResolvedRecord?raw";
import createResolvedRecordData from "./createResolvedRecordData?raw";
import isRecordStatus from "./isRecordStatus?raw";
import updateRecordToPending from "./updateRecordToPending?raw";
import updateRecordToRejected from "./updateRecordToRejected?raw";
import updateRecordToResolved from "./updateRecordToResolved?raw";

export const recordUtils = {
  assertRecordStatus: processExample(assertRecordStatus),
  createPendingRecord: processExample(createPendingRecord),
  createPendingRecordData: processExample(createPendingRecordData),
  createRejectedRecord: processExample(createRejectedRecord),
  createRejectedRecordData: processExample(createRejectedRecordData),
  createResolvedRecord: processExample(createResolvedRecord),
  createResolvedRecordData: processExample(createResolvedRecordData),
  isRecordStatus: processExample(isRecordStatus),
  updateRecordToPending: processExample(updateRecordToPending),
  updateRecordToRejected: processExample(updateRecordToRejected),
  updateRecordToResolved: processExample(updateRecordToResolved),
};
