import { userCommentsCache } from "./cache";
// REMOVE_BEFORE
import { useStreamingValues } from "suspense";

function ReactComponent({ path }: { path: string }) {
  const stream = userCommentsCache.stream(path);

  // Uses useSyncExternalStore to subscribe to changes
  const { complete, progress, status, values } = useStreamingValues(stream);

  // ...
}
