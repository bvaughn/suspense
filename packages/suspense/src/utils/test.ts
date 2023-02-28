export async function requestGC() {
  await wait(100);

  // Node --expose-gc flag
  global.gc();

  await wait(100);
}

export async function wait(delay: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function waitUntil(
  conditional: () => boolean,
  timeout: number = 5000
) {
  let startTime = performance.now();
  do {
    if (conditional()) {
      return;
    }

    await wait(100);
  } while (startTime + timeout > performance.now());

  const elapsed = performance.now() - startTime;

  throw Error(`Condition not met within ${elapsed}ms`);
}

export async function waitForGC(
  conditional: () => boolean = () => true,
  timeout: number = 5000
): Promise<void> {
  const finalizer = jest.fn();
  const finalizationRegistry = new FinalizationRegistry(finalizer);
  finalizationRegistry.register({}, "control");

  await requestGC();

  // Ensure some GC has occurred
  await waitUntil(() => finalizer.mock.calls.length > 0);

  expect(finalizer).toHaveBeenCalledTimes(1);
  expect(finalizer).toHaveBeenCalledWith("control");

  // Ensure additional constraints are met
  await waitUntil(conditional, timeout);
}
