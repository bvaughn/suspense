import { Suspense, useMemo, useState } from "react";
import {
  createStreamingCache,
  StreamingCacheLoadOptions,
  StreamingValues,
  useStreamingValues,
} from "suspense";
import Loader from "../../../components/Loader";

import styles from "./style.module.css";

// Fake API data
import { posts } from "../posts.json";
import { users } from "../users.json";
import { Posts } from "./Posts";

export type Post = (typeof posts)[0];
export type User = (typeof users)[0];

export type Metadata = {
  postCount: number;
};

const streamingCache = createStreamingCache<[Post[]], Post, Metadata>({
  load: async (
    options: StreamingCacheLoadOptions<Post, Metadata>,
    posts: Post[]
  ) => {
    const { signal } = options;

    for (let i = 0; i < posts.length; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, i % 10 === 0 ? 500 : 1)
      );

      if (signal.aborted) {
        return;
      }

      const post = posts[i];
      const progress = i / posts.length;

      options.update([post], progress, { postCount: posts.length });
    }
    options.resolve();
  },
});

export default function Demo() {
  return (
    <Suspense fallback={<Loader />}>
      <DemoSuspends />
    </Suspense>
  );
}

function DemoSuspends() {
  const [state, setState] = useState<"ready" | "running" | "complete">("ready");
  const [stream, setStream] = useState<StreamingValues<Post, Metadata> | null>(
    null
  );

  const handleAbort = () => {
    if (state === "running") {
      streamingCache.abort(posts);
    }
  };

  const handleChangeState = async () => {
    switch (state) {
      case "ready":
        const stream = streamingCache.stream(posts);

        setStream(stream);
        setState("running");

        await stream.resolver;

        setState("complete");
        break;
      case "complete":
        streamingCache.evict(posts);

        setStream(null);
        setState("ready");
        break;
    }
  };

  let label;
  switch (state) {
    case "ready":
      label = "Start demo";
      break;
    case "running":
      label = "Loading data";
      break;
    case "complete":
      label = "Reset demo";
      break;
  }

  return (
    <div className={styles.App}>
      <div className={styles.ButtonRow}>
        <button
          className={styles.Button}
          disabled={state !== "ready"}
          onClick={handleChangeState}
        >
          Start demo
        </button>
        <button
          className={styles.Button}
          disabled={state !== "running"}
          onClick={handleAbort}
        >
          Abort stream
        </button>
        <button
          className={styles.Button}
          disabled={state !== "complete"}
          onClick={handleChangeState}
        >
          Reset demo
        </button>
      </div>

      <main className={styles.App}>
        {stream ? <Posts stream={stream} users={users} /> : <Placeholder />}
      </main>
    </div>
  );
}

function Placeholder() {
  return (
    <>
      <ProgressBar progress={0} />
      <div className={styles.Posts} />
    </>
  );
}

export function Rows({
  postCount,
  posts,
  users,
}: {
  postCount: number;
  posts: Post[];
  users: User[];
}) {
  return (
    <div className={styles.Posts}>
      {Array(postCount)
        .fill(null)
        .map((_, index) => {
          const post = posts[index] ?? null;
          const user = post
            ? users.find(({ id }) => id === post.userId) ?? null
            : null;
          if (post && !user) {
            debugger;
          }

          return <PostRow key={index} post={post} user={user} />;
        })}
    </div>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className={styles.ProgressBarOuter}>
      <div
        className={styles.ProgressBarInner}
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

function PostRow({ post, user }: { post: Post | null; user: User | null }) {
  if (post === null) {
    return <PlaceholderRow />;
  }

  return (
    <div className={styles.PostRow}>
      <div className={styles.PostHeaderRow}>
        <div className={styles.PostName}>
          {user.firstName} {user.lastName} (@{user.username})
        </div>
        <div className={styles.PostTags}>
          {post.tags.map((tag) => (
            <span key={tag} className={styles.PostTag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.PostTitle}>"{post.title}"</div>
      <div className={styles.PostBody}>{post.body}</div>
    </div>
  );
}

function PlaceholderRow() {
  const width = useMemo(() => 25 + Math.random() * 75, []);
  return (
    <div className={styles.PlaceholderRow} style={{ width: `${width}%` }} />
  );
}
