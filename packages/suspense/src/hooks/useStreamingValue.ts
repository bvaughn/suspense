import { useCallback, useRef, useSyncExternalStore } from "react";
import { STATUS_PENDING } from "../constants";

import { StreamingValue } from "../types";
import { throttle } from "../utils/throttle";

export type StreamingValuePartial<Value, AdditionalData> = Pick<
  StreamingValue<Value, AdditionalData>,
  "complete" | "data" | "error" | "progress" | "status" | "value"
>;

export function useStreamingValue<Value, AdditionalData = undefined>(
  streamingValues: StreamingValue<Value, AdditionalData>,
  options: { throttleUpdatesBy?: number } = {}
): StreamingValuePartial<Value, AdditionalData> {
  const { throttleUpdatesBy = 150 } = options;

  const ref = useRef<StreamingValuePartial<Value, AdditionalData>>({
    complete: false,
    data: undefined,
    error: undefined,
    progress: 0,
    status: STATUS_PENDING,
    value: undefined,
  });

  const getValue = () => {
    const value = ref.current;
    if (
      value.complete !== streamingValues.complete ||
      value.data !== streamingValues.data ||
      value.progress !== streamingValues.progress ||
      value.status !== streamingValues.status ||
      value.value !== streamingValues.value
    ) {
      ref.current = {
        complete: streamingValues.complete,
        data: streamingValues.data,
        error: streamingValues.error,
        progress: streamingValues.progress,
        status: streamingValues.status,
        value: streamingValues.value,
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
    [streamingValues.subscribe]
  );

  return useSyncExternalStore<StreamingValuePartial<Value, AdditionalData>>(
    throttledSubscribe,
    getValue,
    getValue
  );
}
