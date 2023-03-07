import { Metadata, Post, ProgressBar, Rows, User } from "./index";

// REMOVE_BEFORE

import { StreamingValue, useStreamingValue } from "suspense";

function Posts({
  stream,
  users,
}: {
  stream: StreamingValue<Post[], Metadata>;
  users: User[];
}) {
  // * progress is a number (0-1) indicating the loading percentage
  // * values is an array of posts
  // * data contains extra metadata provided by the cache;
  //   in this case that data includes the total number of posts
  const { data, progress = 0, value = [] } = useStreamingValue(stream);

  return (
    <>
      <ProgressBar progress={progress} />
      <Rows postCount={data?.postCount ?? 0} posts={value} users={users} />
    </>
  );
}

// REMOVE_AFTER

export { Posts };
