import { KeyboardEvent, Suspense, useMemo, useRef, useState } from "react";
import Icon from "../../../components/Icon";

import styles from "./style.module.css";

// Fake API data
import { comments as staticComments } from "../comments.json";
import { createSingleEntryCache, useCacheMutation } from "suspense";
import Loader from "../../../components/Loader";
import { AddComment } from "./AddComment";
import { SaveButton } from "./SaveButton";

type Comment = typeof staticComments[0];

export type ApiClient = {
  addComment: (body: string) => Promise<Comment[]>;
  deleteComment: (commentId: number) => Promise<void>;
  editComment: (id: number, body: string) => Promise<Comment>;
  fetchComments: () => Promise<Comment[]>;
};

export const commentsCache = createSingleEntryCache<[ApiClient], Comment[]>({
  debugLabel: "Comments",
  load: async (client: ApiClient) => client.fetchComments(),
});

function createDummyApiClient(): ApiClient {
  // Simulate remote state
  const additions: Comment[] = [];
  const deletions: Set<number> = new Set();
  const edits: Map<number, string> = new Map();

  let id = staticComments.reduce(
    (max, comment) => Math.max(max, comment.id),
    0
  );

  const apiClient: ApiClient = {
    addComment: async (body: string) => {
      id++;
      additions.push({
        id,
        body,
      });

      return await apiClient.fetchComments();
    },
    deleteComment: async (commentId: number) => {
      deletions.add(commentId);
    },
    editComment: async (id: number, body: string) => {
      edits.set(id, body);

      const comment = staticComments.find((comment) => comment.id === id);

      return { ...comment, body };
    },
    fetchComments: async () => {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      return staticComments
        .concat(...additions)
        .filter((comment) => !deletions.has(comment.id))
        .map((comment) => {
          const editedBody = edits.get(comment.id);
          return editedBody ? { ...comment, body: editedBody } : comment;
        });
    },
  };

  return apiClient;
}

export default function Demo() {
  const apiClient = useMemo<ApiClient>(createDummyApiClient, []);

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
  const comments = commentsCache.fetchSuspense(apiClient);

  return (
    <div className={styles.Comments}>
      {comments.map((comment) => (
        <Comment apiClient={apiClient} comment={comment} key={comment.id} />
      ))}

      <div />
      <AddComment apiClient={apiClient} />
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

    mutate({
      mutate: async () => {
        await apiClient.editComment(comment.id, body);
      },
      effect: async () => {
        setHasPendingChanges(false);
      },
      params: [apiClient],
    });
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
    mutate({
      mutate: async () => {
        await apiClient.deleteComment(comment.id);
      },
      params: [apiClient],
    });
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
      <SaveButton
        hasPendingChanges={hasPendingChanges}
        isPending={isPending}
        onClick={saveComment}
      />
    </>
  );
}
