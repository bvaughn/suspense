import { ApiClient, commentsCache } from "./index";

type CommentsCache = typeof commentsCache;

const apiClient = {} as ApiClient;

// REMOVE_BEFORE

import { useCacheMutation } from "suspense";
import { useRef } from "react";

function AddComment() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isPending, mutate] = useCacheMutation(commentsCache);

  const onClick = async () => {
    const text = inputRef.current?.value;
    if (text) {
      // The mutate function will schedule an update with React
      // for any components using the cache that may be impacted by the mutation.
      await mutate(async () => {
        await apiClient.addComment(text);
      });
    }
  };

  // ...
}
