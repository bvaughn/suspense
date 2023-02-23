import { exampleCache } from "./cache";

// REMOVE_BEFORE
import { useCacheStatus } from "suspense";

function StatusBadge({ userId }: { userId: string }) {
  const status = useCacheStatus(exampleCache, userId);

  switch (status) {
    case "pending":
      // ...
      break;
    case "resolved":
      // ...
      break;
    case "rejected":
      // ...
      break;
    default:
      // Not fetched yet
      // ...
      break;
  }
}
