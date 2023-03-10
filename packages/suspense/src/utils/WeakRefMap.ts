export type FinalizerCallback<Key> = (key: Key) => void;

// WeakRefs only work with objects, yet the user may be specifying an arbitrary type.
// This doesn't actually matter since internally what is stored is Record<Value>
// which is an object.
// Currently we lie to the type system to make this work seamlessly.
// TODO: Find a better way to do this.
export class WeakRefMap<Key extends string, Value> {
  private finalizerCallback: FinalizerCallback<Key>;
  private finalizationRegistry: FinalizationRegistry<Key>;
  private map: Map<Key, WeakRef<any>>;

  constructor(finalizerCallback: FinalizerCallback<Key>) {
    this.finalizerCallback = finalizerCallback;

    this.map = new Map<Key, WeakRef<any>>();
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
    // Don't just use map.has(key) in case value has been GC'ed
    // and FinalizationRegistry callback has not yet run.
    const weakRef = this.map.get(key);
    return weakRef != null && weakRef.deref() != null;
  }

  set(key: Key, value: Value): this {
    if (this.map.has(key)) {
      this.unregister(key);

      // FinalizationRegistry won't trigger if we unregister.
      this.finalizerCallback(key);
    }

    this.map.set(key, new WeakRef(value!));

    if (value != null) {
      this.finalizationRegistry.register(value, key, value);
    }
    return this;
  }

  clear(): void {
    this.map.clear();
  }
}
