import { userCommentsCache } from "./cache";

// REMOVE_BEFORE
const userId = "123";

userCommentsCache.evict(userId);
