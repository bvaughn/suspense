import { userCommentsCache } from "./cache";
// REMOVE_BEFORE
import { useStreamingValue } from "suspense";

function ReactComponent({ path }: { path: string }) {
  const stream = userCommentsCache.stream(path);

  // Uses useSyncExternalStore to subscribe to changes
  const { complete, progress, status, value } = useStreamingValue(stream);

  // ...
}
