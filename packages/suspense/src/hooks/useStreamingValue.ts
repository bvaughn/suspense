import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { STATUS_PENDING } from "../constants";

import { StreamingValue } from "../types";

export type StreamingValuePartial<Value, AdditionalData> = Pick<
  StreamingValue<Value, AdditionalData>,
  "complete" | "data" | "error" | "progress" | "status" | "value"
>;

type Noop = () => void;
type CallbackWrapper = Noop & { hold: Noop; release: Noop };

export function useStreamingValue<Value, AdditionalData = undefined>(
  streamingValues: StreamingValue<Value, AdditionalData>,
  options: { throttleUpdatesBy?: number } = {}
): StreamingValuePartial<Value, AdditionalData> {
  const { throttleUpdatesBy = 100 } = options;

  const callbackWrapperRef = useRef<CallbackWrapper | null>(null);

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
        callbackWrapper.hold();
      });

      callbackWrapperRef.current = callbackWrapper;

      return streamingValues.subscribe(callbackWrapper);
    },
    [streamingValues.subscribe]
  );

  useEffect(() => {
    const callbackWrapper = callbackWrapperRef.current;
    if (callbackWrapper) {
      setTimeout(callbackWrapper.release, throttleUpdatesBy);
    }
  });

  return useSyncExternalStore<StreamingValuePartial<Value, AdditionalData>>(
    throttledSubscribe,
    getValue,
    getValue
  );
}

function throttle(callback: Noop): CallbackWrapper {
  let hold = false;
  let pending = false;

  const throttled = () => {
    if (hold) {
      pending = true;
    } else {
      callback();
    }
  };

  throttled.hold = () => {
    hold = true;
  };

  throttled.release = () => {
    hold = false;

    if (pending) {
      pending = false;
      callback();
    }
  };

  return throttled;
}
