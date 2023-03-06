const commentsCache = {
  fetchUserCommentsSuspense: (userId: string): any[] => [],
};

const userId = "123";

// REMOVE_BEFORE
import { isPromiseLike } from "suspense";

function UserComments({ userId }: { userId: string }) {
  let comments: string[];
  try {
    // Try to load comments using Suspense
    comments = commentsCache.fetchUserCommentsSuspense(userId);
  } catch (errorOrPromiseLike) {
    if (isPromiseLike(errorOrPromiseLike)) {
      // Re-throw thenables so that Suspense works
      throw errorOrPromiseLike;
    } else {
      // Ignore other types of errors though
      comments = [];
    }
  }

  // ...
}
