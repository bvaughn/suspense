import shuffle from "lodash.shuffle";
import {
  KeyboardEvent,
  startTransition,
  Suspense,
  useMemo,
  useRef,
  useState,
} from "react";
import Icon from "../../../components/Icon";

import styles from "./style.module.css";

// Fake API data
import json from "../comments.json";
import { createCache, useCacheMutation } from "suspense";
import Loader from "../../../components/Loader";

type Comment = typeof json.comments[0];

const randomComments = shuffle(json.comments).slice(0, 5);

export type ApiClient = {
  addComment: (body: string) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
  editComment: (id: number, body: string) => Promise<void>;
  fetchComments: () => Promise<Comment[]>;
};

export const commentsCache = createCache<[ApiClient], Comment[]>({
  load: async (client: ApiClient) => client.fetchComments(),
});

export default function Demo() {
  const apiClient = useMemo<ApiClient>(() => {
    // Simulate remote state
    const additions: Comment[] = [];
    const deletions: Set<number> = new Set();
    const edits: Map<number, string> = new Map();

    let id = randomComments.reduce(
      (max, comment) => Math.max(max, comment.id),
      0
    );

    return {
      addComment: async (body: string) => {
        id++;

        additions.push({
          id,
          body,
        });
        commentsCache.evictAll();
      },
      deleteComment: async (commentId: number) => {
        deletions.add(commentId);
        commentsCache.evictAll();
      },
      editComment: async (id: number, body: string) => {
        edits.set(id, body);
        commentsCache.evictAll();
      },
      fetchComments: async () => {
        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 1_000));

        return randomComments
          .concat(...additions)
          .filter((comment) => !deletions.has(comment.id))
          .map((comment) => {
            const editedBody = edits.get(comment.id);
            return editedBody ? { ...comment, body: editedBody } : comment;
          });
      },
    };
  }, []);

  return (
    <>
      <p>Manage comments</p>
      <Suspense fallback={<Loader />}>
        <CommentsSuspends apiClient={apiClient} />
      </Suspense>
    </>
  );
}

function CommentsSuspends({ apiClient }: { apiClient: ApiClient }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isPending, mutate] = useCacheMutation(commentsCache);

  const comments = commentsCache.fetchSuspense(apiClient);

  const setFocus = () => {
    inputRef.current?.focus();
  };

  const onChange = () => {
    setHasPendingChanges(inputRef.current!.value !== "");
  };

  const addComment = async () => {
    const body = inputRef.current!.value;
    if (!body) {
      return;
    }

    await mutate(async () => {
      await apiClient.addComment(body);
    });

    startTransition(() => {
      // This state update also needs to be part of the mutation (transition)
      setHasPendingChanges(false);
    });

    inputRef.current!.value = "";
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        addComment();
        break;
    }
  };

  const saveComment = () => {
    addComment();
  };

  return (
    <div className={styles.Comments}>
      {comments.map((comment) => (
        <Comment apiClient={apiClient} comment={comment} key={comment.id} />
      ))}

      <div />
      <div className={styles.InputRow} onClick={setFocus}>
        <Icon type="edit" />
        <input
          className={styles.Input}
          disabled={isPending}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="New comment"
          ref={inputRef}
        />
      </div>
      <button
        className={styles.Button}
        disabled={isPending || !hasPendingChanges}
        onClick={saveComment}
      >
        Save
      </button>
    </div>
  );
}

function Comment({
  apiClient,
  comment,
}: {
  apiClient: ApiClient;
  comment: Comment;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isPending, mutate] = useCacheMutation(commentsCache);

  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const onChange = () => {
    const value = inputRef.current!.value;

    setHasPendingChanges(value !== comment.body);
  };

  const editComment = () => {
    const body = inputRef.current!.value;
    if (!body) {
      return;
    }

    mutate(async () => {
      await apiClient.editComment(comment.id, body);
    }, apiClient);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        editComment();
        break;
      case "Escape":
        inputRef.current!.value = comment.body;
        break;
    }
  };

  const deleteComment = () => {
    mutate(async () => await apiClient.deleteComment(comment.id), apiClient);
  };

  const saveComment = () => {
    editComment();
  };

  const setFocus = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <button
        className={styles.Button}
        disabled={isPending}
        onClick={deleteComment}
      >
        <Icon type="delete" />
      </button>
      <div className={styles.InputRow} onClick={setFocus}>
        <Icon type="edit" />
        <input
          className={styles.Input}
          defaultValue={comment.body}
          disabled={isPending}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="New comment"
          ref={inputRef}
        />
      </div>
      <button
        className={styles.Button}
        disabled={!hasPendingChanges || isPending}
        onClick={saveComment}
      >
        Save
      </button>
    </>
  );
}
