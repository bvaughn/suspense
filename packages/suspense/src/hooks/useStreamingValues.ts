import { useCallback, useRef, useSyncExternalStore } from "react";

import { StreamingValues } from "../types";

export type ReturnType<Value, AdditionalData> = Pick<
  StreamingValues<Value, AdditionalData>,
  "complete" | "data" | "progress" | "values"
>;

export function useStreamingValues<Value, AdditionalData = undefined>(
  streamingValues: StreamingValues<Value, AdditionalData>
): ReturnType<Value, AdditionalData> {
  const ref = useRef<ReturnType<Value, AdditionalData>>({
    complete: false,
    data: undefined,
    progress: 0,
    values: undefined,
  });

  const getValue = () => {
    const value = ref.current;
    if (
      value.complete !== streamingValues.complete ||
      value.data !== streamingValues.data ||
      value.progress !== streamingValues.progress ||
      value.values !== streamingValues.values
    ) {
      ref.current = {
        complete: streamingValues.complete,
        data: streamingValues.data,
        progress: streamingValues.progress,
        values: streamingValues.values,
      };
    }

    return ref.current;
  };

  return useSyncExternalStore<ReturnType<Value, AdditionalData>>(
    streamingValues.subscribe,
    getValue,
    getValue
  );
}
