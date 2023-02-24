import { createStreamingCache, StreamingProgressNotifier } from "suspense";

const socket = new WebSocket(`ws://example.com`);

export const exampleStreamingCache = createStreamingCache<
  [path: string],
  string
>(
  // Stream data for params
  async (notifier: StreamingProgressNotifier<string>, path: string) => {
    let loadedLines = 0;
    let totalLineCount = 0;

    socket.onerror = (error) => {
      // If loading fails, notify the cache
      notifier.reject(error);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data as any);
      if (data.path === path) {
        switch (data.type) {
          case "initialize":
            totalLineCount = data.count as number;
            break;
          case "progress":
            const lines = data.lines as string[];
            loadedLines += lines.length;

            // When new data streams in, notify the cache
            notifier.update(lines, loadedLines / totalLineCount);
            break;
          case "complete":
            // Once loading has finished, notify the cache
            notifier.resolve();
            break;
        }
      }
    };
    socket.send(
      JSON.stringify({
        socket,
        type: "streamContent",
      })
    );
  }
);
