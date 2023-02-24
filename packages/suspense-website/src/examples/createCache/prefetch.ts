import { userProfileCache } from "./cache";

function getQueryParam(key: string): string {
  return "dummy";
}

// REMOVE_BEFORE
const userId = getQueryParam("userId");

// Start loading user data eagerly, while route renders.
userProfileCache.prefetch(userId);

function UserProfileRoute() {
  // ...
}
