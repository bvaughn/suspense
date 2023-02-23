export function throttle<T extends (...args: any[]) => void>(
  callback: T,
  throttleByAmount: number
): T & { cancel: () => void } {
  let lastCalledAt = -Infinity;
  let timeoutId: NodeJS.Timeout = null;

  const throttled = (...args: any[]) => {
    const elapsed = performance.now() - lastCalledAt;
    if (elapsed >= throttleByAmount) {
      lastCalledAt = performance.now();
      callback(...args);
    } else {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        lastCalledAt = performance.now();
        callback(...args);
      }, throttleByAmount - elapsed);
    }
  };

  throttled.cancel = () => {
    clearTimeout(timeoutId);
  };

  return throttled as T & { cancel: () => void };
}
