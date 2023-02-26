import { Suspense, useMemo, useState } from "react";
import {
  createCache,
  createStreamingCache,
  StreamingCacheLoadOptions,
  StreamingValues,
  useStreamingValues,
} from "suspense";
import Loader from "../../../components/Loader";
import posts from "./data.json";

import styles from "./style.module.css";

export type Post = typeof posts[0];

export type Metadata = {
  postCount: number;
};

const streamingCache = createStreamingCache<[Post[]], Post, Metadata>(
  async (options: StreamingCacheLoadOptions<Post, Metadata>, posts: Post[]) => {
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
  }
);

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
        {stream ? <Posts stream={stream} /> : <Placeholder />}
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

function Posts({ stream }: { stream: StreamingValues<Post, Metadata> }) {
  const { data, progress, values } = useStreamingValues(stream);

  return (
    <>
      <ProgressBar progress={progress ?? 0} />
      <Rows postCount={data?.postCount ?? 0} posts={values ?? []} />
    </>
  );
}

export function Rows({
  postCount,
  posts,
}: {
  postCount: number;
  posts: Post[];
}) {
  return (
    <div className={styles.Posts}>
      {Array(postCount)
        .fill(null)
        .map((_, index) => (
          <PostRow key={index} post={posts[index] ?? null} />
        ))}
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

function PostRow({ post }: { post: Post | null }) {
  if (post === null) {
    return <PlaceholderRow />;
  }

  return (
    <div className={styles.PostRow}>
      <div className={styles.PostTitle}>{post.title}</div>
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
