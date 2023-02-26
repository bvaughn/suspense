import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { STATUS_PENDING } from "../constants";

import { StreamingValues } from "../types";

export type StreamingValuesPartial<Value, AdditionalData> = Pick<
  StreamingValues<Value, AdditionalData>,
  "complete" | "data" | "progress" | "status" | "values"
>;

type Noop = () => void;
type CallbackWrapper = Noop & { hold: Noop; release: Noop };

export function useStreamingValues<Value, AdditionalData = undefined>(
  streamingValues: StreamingValues<Value, AdditionalData>,
  options: { throttleUpdatesBy?: number } = {}
): StreamingValuesPartial<Value, AdditionalData> {
  const { throttleUpdatesBy = 100 } = options;

  const callbackWrapperRef = useRef<CallbackWrapper | null>(null);

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

  return useSyncExternalStore<StreamingValuesPartial<Value, AdditionalData>>(
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
