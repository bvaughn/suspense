export function requestGC(): void {
  // Node --expose-gc flag
  global.gc();
}

export async function wait(delay: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function waitForGC(
  condition: () => boolean,
  timeoutInSeconds: number = 5
): Promise<void> {
  const startTime = process.hrtime();
  do {
    global.gc();
    await wait(0);
  } while (
    condition() === false &&
    process.hrtime(startTime)[0] < timeoutInSeconds
  );
}
