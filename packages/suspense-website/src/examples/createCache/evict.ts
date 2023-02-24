import { userProfileCache } from "./cache";

// REMOVE_BEFORE
const userId = "123";

userProfileCache.evict(userId);
