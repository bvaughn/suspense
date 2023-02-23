import { exampleCache } from "./cache";

// REMOVE_BEFORE
function UserProfile({ userId }: { userId: string }) {
  const userData = exampleCache.fetchSuspense(userId);
  // ...
}
