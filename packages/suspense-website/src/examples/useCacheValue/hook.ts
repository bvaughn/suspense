import { userProfileCache } from "../createCache/cache";

// REMOVE_BEFORE

import {
  STATUS_PENDING,
  STATUS_REJECTED,
  STATUS_RESOLVED,
  useCacheValue,
} from "suspense";

function Example({ userId }: { userId: string }) {
  const { error, status, value } = useCacheValue(userProfileCache, userId);

  switch (status) {
    case STATUS_PENDING:
    // Rending loading UI ...
    case STATUS_REJECTED:
    // Render "error" ...
    case STATUS_RESOLVED:
    // Render "value" ...
  }
}
