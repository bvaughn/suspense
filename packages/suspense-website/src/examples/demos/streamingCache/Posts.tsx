import { Metadata, Post, ProgressBar, Rows } from "./index";

// REMOVE_BEFORE

import { StreamingValues, useStreamingValues } from "suspense";

function Posts({ stream }: { stream: StreamingValues<Post, Metadata> }) {
  // * progress is a number (0-1) indicating the loading percentage
  // * values is an array of posts
  // * data contains extra metadata provided by the cache;
  //   in this case that data includes the total number of posts
  const { data, progress = 0, values = [] } = useStreamingValues(stream);

  return (
    <>
      <ProgressBar progress={progress} />
      <Rows postCount={data?.postCount ?? 0} posts={values} />
    </>
  );
}

// REMOVE_AFTER

export { Posts };
