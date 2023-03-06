import { userProfileCache } from "./cache";

// REMOVE_BEFORE
function UserProfile({ userId }: { userId: string }) {
  const userProfile = userProfileCache.read(userId);

  // ...
}
