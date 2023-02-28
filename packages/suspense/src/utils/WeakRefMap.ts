export type FinalizerCallback<Key> = (key: Key) => void;

export class WeakRefMap<Key, Value extends Object> {
  private finalizerCallback: FinalizerCallback<Key>;
  private finalizationRegistry: FinalizationRegistry<Key>;
  private map: Map<Key, WeakRef<Value>>;

  constructor(finalizerCallback: FinalizerCallback<Key>) {
    this.finalizerCallback = finalizerCallback;

    this.map = new Map<Key, WeakRef<Value>>();
    this.finalizationRegistry = new FinalizationRegistry<Key>((key) => {
      this.map.delete(key);

      finalizerCallback(key);
    });
  }

  private unregister(key: Key): void {
    const weakRef = this.map.get(key);
    if (weakRef) {
      const value = weakRef.deref();
      if (value != null) {
        this.finalizationRegistry.unregister(value);
      }
    }
  }

  delete(key: Key): boolean {
    const result = this.map.delete(key);

    this.unregister(key);

    return result;
  }

  get(key: Key): Value | undefined {
    const weakRef = this.map.get(key);

    return weakRef ? weakRef.deref() : undefined;
  }

  has(key: Key): boolean {
    // Handle timing edge case in case value has been GC'ed
    // but FinalizationRegistry callback has not yet run.
    return this.map.has(key) && this.map.get(key).deref() != null;
  }

  set(key: Key, value: Value): void {
    if (this.map.has(key)) {
      this.unregister(key);

      // FinalizationRegistry won't trigger if we unregister.
      this.finalizerCallback(key);
    }

    this.map.set(key, new WeakRef(value));

    if (value != null) {
      this.finalizationRegistry.register(value, key, value);
    }
  }
}
