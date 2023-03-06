import { userProfileCache } from "./cache";

// REMOVE_BEFORE
async function load(userId: string) {
  const userProfile = await userProfileCache.readAsync(userId);

  // ...
}
