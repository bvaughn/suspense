import { sourceCodeCache } from "../createIntervalCache/cache";

const lineStart = 0;
const lineEnd = 0;
const fileName = "";

// REMOVE_BEFORE

import {
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
  useImperativeIntervalCacheValues,
} from "suspense";

function Example({ userId }: { userId: string }) {
  const { error, status, value } = useImperativeIntervalCacheValues(
    sourceCodeCache,
    lineStart,
    lineEnd,
    fileName
  );

  switch (status) {
    case STATUS_PENDING:
    // Rending loading UI ...
    case STATUS_REJECTED:
    // Render "error" ...
    case STATUS_RESOLVED:
    // Render "value" ...
  }
}
