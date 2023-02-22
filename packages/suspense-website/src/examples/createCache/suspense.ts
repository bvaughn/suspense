import { exampleCache } from "./cache";

function UserProfile({ userId }: { userId: string }) {
  const userData = exampleCache.fetchSuspense(userId);
  // ...
}
