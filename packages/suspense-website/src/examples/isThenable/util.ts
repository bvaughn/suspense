const commentsCache = {
  fetchUserCommentsSuspense: (userId: string): any[] => [],
};

const userId = "123";

// REMOVE_BEFORE
import { isThenable } from "suspense";

function UserComments({ userId }: { userId: string }) {
  let comments: string[];
  try {
    // Try to load comments using Suspense
    comments = commentsCache.fetchUserCommentsSuspense(userId);
  } catch (errorOrThenable) {
    if (isThenable(errorOrThenable)) {
      // Re-throw thenables so that Suspense works
      throw errorOrThenable;
    } else {
      // Ignore other types of errors though
      comments = [];
    }
  }

  // ...
}
