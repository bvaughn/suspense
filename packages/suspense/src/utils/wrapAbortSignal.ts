export function wrapAbortSignal(signal: AbortSignal): {
  abort: () => void;
  signal: AbortSignal;
  unwrap: () => void;
} {
  const controller = new AbortController();

  function onAbort() {
    signal.removeEventListener("abort", onAbort);

    controller.abort();
  }

  if (signal.aborted) {
    controller.abort();
  } else {
    signal.addEventListener("abort", onAbort);
  }

  return {
    abort: () => {
      controller.abort();

      signal.removeEventListener("abort", onAbort);
    },
    signal: controller.signal,
    unwrap: () => {
      signal.removeEventListener("abort", onAbort);
    },
  };
}
