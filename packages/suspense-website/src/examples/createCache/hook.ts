import { userProfileCache } from "./cache";

// REMOVE_BEFORE
import { useCacheStatus } from "suspense";

function StatusBadge({ userId }: { userId: string }) {
  const status = useCacheStatus(userProfileCache, userId);

  switch (status) {
    case "not-started":
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
