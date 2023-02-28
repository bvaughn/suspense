export type FinalizerCallback<Key> = (key: Key) => void;

export class WeakRefMap<Key, Value extends Object> {
  private finalizationRegistry: FinalizationRegistry<Key>;
  private map: Map<Key, WeakRef<Value>>;

  constructor(finalizerCallback: FinalizerCallback<Key>) {
    this.finalizationRegistry = new FinalizationRegistry<Key>((key) => {
      this.map.delete(key);

      finalizerCallback(key);
    });
    this.map = new Map<Key, WeakRef<Value>>();
  }

  delete(key: Key): boolean {
    const weakRef = this.map.get(key);

    const result = this.map.delete(key);

    if (weakRef) {
      const value = weakRef.deref();
      if (value != null) {
        this.finalizationRegistry.unregister(value);
      }
    }

    return result;
  }

  get(key: Key): Value | undefined {
    const weakRef = this.map.get(key);

    return weakRef ? weakRef.deref() : undefined;
  }

  has(key: Key): boolean {
    return this.map.has(key);
  }

  size(): number {
    return this.map.size;
  }

  set(key: Key, value: Value): void {
    this.map.set(key, new WeakRef(value));

    if (value != null) {
      this.finalizationRegistry.register(value, key, value);
    }
  }
}
