import { sourceCodeCache } from "./cache";

// REMOVE_BEFORE
import { useIntervalCacheStatus } from "suspense";

function StatusBadge({
  fileName,
  lineEnd,
  lineStart,
}: {
  fileName: string;
  lineEnd: number;
  lineStart: number;
}) {
  const status = useIntervalCacheStatus(
    sourceCodeCache,
    lineStart,
    lineEnd,
    fileName
  );

  switch (status) {
    case "not-found":
      // ...
      break;
    case "pending":
      // ...
      break;
    case "resolved":
      // ...
      break;
    case "rejected":
      // ...
      break;
  }
}
