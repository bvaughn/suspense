type Comment = any;
type Message = any;

// REMOVE_BEFORE
import { createStreamingCache, StreamingCacheLoadOptions } from "suspense";

const socket = new WebSocket("...");

export const userCommentsCache = createStreamingCache<
  [userId: string],
  Comment[]
>({
  // Stream data for params
  load: async (
    options: StreamingCacheLoadOptions<Comment[]>,
    userId: string
  ) => {
    const { reject, update, resolve } = options;

    let comments: Comment[] = [];
    let countTotal = 0;

    socket.onerror = (error) => {
      // If loading fails, notify the cache
      reject(error);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as Message;
      if (data.requestType === "fetchComments" && data.userId === userId) {
        switch (data.responseType) {
          case "initialize":
            // Some caches can calculate progress (but this is optional)
            countTotal = data.count as number;
            break;
          case "update":
            comments.splice(comments.length, 0, ...data.comments);

            const countLoaded = comments.length;

            // When new data streams in, notify the cache
            update(data.comments, countLoaded / countTotal);
            break;
          case "complete":
            // Once loading has finished, notify the cache
            resolve();
            break;
        }
      }
    };
    socket.send(
      JSON.stringify({
        type: "fetchComments",
        userId,
      })
    );
  },
});
