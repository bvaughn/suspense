import { useCallback, useRef, useSyncExternalStore } from "react";
import { STATUS_PENDING } from "../constants";

import { StreamingValues } from "../types";
import { throttle } from "../utils/throttle";

export type StreamingValuesPartial<Value, AdditionalData> = Pick<
  StreamingValues<Value, AdditionalData>,
  "complete" | "data" | "progress" | "status" | "values"
>;

export function useStreamingValues<Value, AdditionalData = undefined>(
  streamingValues: StreamingValues<Value, AdditionalData>,
  options: {
    throttleUpdatesBy?: number;
  } = {}
): StreamingValuesPartial<Value, AdditionalData> {
  const { throttleUpdatesBy = 500 } = options;

  const ref = useRef<StreamingValuesPartial<Value, AdditionalData>>({
    complete: false,
    data: undefined,
    progress: 0,
    status: STATUS_PENDING,
    values: undefined,
  });

  const getValue = () => {
    const value = ref.current;
    if (
      value.complete !== streamingValues.complete ||
      value.data !== streamingValues.data ||
      value.progress !== streamingValues.progress ||
      value.status !== streamingValues.status ||
      value.values !== streamingValues.values
    ) {
      ref.current = {
        complete: streamingValues.complete,
        data: streamingValues.data,
        progress: streamingValues.progress,
        status: streamingValues.status,
        values: streamingValues.values,
      };
    }

    return ref.current;
  };

  const throttledSubscribe = useCallback(
    (callback: () => void) => {
      const callbackWrapper = throttle(() => {
        callback();
      }, throttleUpdatesBy);

      return streamingValues.subscribe(callbackWrapper);
    },
    [streamingValues.subscribe, throttleUpdatesBy]
  );

  return useSyncExternalStore<StreamingValuesPartial<Value, AdditionalData>>(
    throttledSubscribe,
    getValue,
    getValue
  );
}
