export type WeakRefArray<Value> = MockWeakRefInterface<Value>[];
export interface MockWeakRefInterface<Value> {
  collect(): void;
  deref(): Value | undefined;
  value: Value | undefined;
}

export function mockWeakRef(): WeakRefArray<any> {
  const weakRefArray: WeakRefArray<any> = [];

  class MockWeakRef<Value> {
    [Symbol.toStringTag]: "WeakRef" = "WeakRef";

    value: Value | undefined = undefined;

    constructor(value: Value) {
      this.value = value;

      weakRefArray.push(this);
    }

    collect() {
      this.value = undefined;
    }

    deref(): Value | undefined {
      return this.value;
    }
  }

  globalThis.WeakRef = MockWeakRef;

  return weakRefArray;
}

export async function requestGC() {
  // Wait before requesting GS
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef#notes_on_weakrefs
  await wait(100);

  // Node --expose-gc flag
  globalThis.gc!();

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

export class SimpleLRUCache<Value> {
  private cache = new Map<string, Value>();
  private capacity: number;
  private onEvict?: (key: string) => void;
  constructor(capacity: number, onEvict?: (key: string) => void) {
    this.capacity = capacity;
    this.onEvict = onEvict;
  }

  get(key: string) {
    if (!this.cache.has(key)) return undefined;

    let val = this.cache.get(key);

    this.cache.delete(key);
    this.cache.set(key, val);

    return val;
  }

  set(key: string, value: Value) {
    this.cache.delete(key);

    if (this.cache.size === this.capacity) {
      const evictedKey = this.cache.keys().next().value;
      this.cache.delete(evictedKey);
      this.onEvict?.(evictedKey);
      this.cache.set(key, value);
    } else {
      this.cache.set(key, value);
    }
    return this;
  }

  delete(key: string) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  has(key: string) {
    return this.cache.has(key);
  }

  get size() {
    return this.cache.size;
  }

  forEach(callback: (value: Value, key: string, cache: this) => void) {
    this.cache.forEach((value, key) => callback(value, key, this));
  }
}
