import { useStreamingValues } from "suspense";
import { exampleStreamingCache } from "./cache";

function ReactComponent({ path }: { path: string }) {
  const stream = exampleStreamingCache.stream(path);

  // Uses useSyncExternalStore to subscribe to changes
  const { complete, progress, values } = useStreamingValues(stream);

  // ...
}
