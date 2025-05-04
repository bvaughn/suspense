import { describe, beforeEach, expect, it, vi, Mock } from "vitest";
import { requestGC, waitForGC } from "./test";
import { WeakRefMap } from "./WeakRefMap";

describe("WeakRefMap", () => {
  let finalizer: Mock<() => FinalizationRegistry<string>>;
  let map: WeakRefMap<string, object>;

  beforeEach(() => {
    finalizer = vi.fn();
    map = new WeakRefMap(finalizer);
  });

  it("should implement a basic Map-like API", () => {
    const foo = { foo: true };
    const bar = { bar: true };

    map.set("foo", foo);
    map.set("bar", bar);

    expect(map.has("foo")).toBe(true);
    expect(map.has("bar")).toBe(true);
    expect(map.get("foo")).toBe(foo);
    expect(map.get("bar")).toBe(bar);

    expect(map.delete("foo")).toBe(true);
    expect(map.has("foo")).toBe(false);
    expect(map.get("foo")).toBe(undefined);
    expect(map.has("bar")).toBe(true);
    expect(map.get("bar")).toBe(bar);

    map.set("bar", foo);
    expect(map.has("bar")).toBe(true);
    expect(map.get("bar")).toBe(foo);

    map.delete("bar");
    expect(map.has("foo")).toBe(false);
    expect(map.has("bar")).toBe(false);
    expect(map.get("foo")).toBe(undefined);
    expect(map.get("bar")).toBe(undefined);
  });

  it("should call the finalizer function when a value is garbage collected", async () => {
    map.set("foo", { foo: true });
    map.set("bar", { bar: true });

    finalizer.mockClear();

    await requestGC();
    await waitForGC(() => finalizer.mock.calls.length === 2);

    expect(finalizer).toHaveBeenCalledWith("foo");
    expect(finalizer).toHaveBeenCalledWith("bar");
  });

  it("should unregister a value when a key is updated", async () => {
    map.set("test", { label: "one" });

    expect(finalizer).not.toHaveBeenCalled();

    const value = { label: "two" };
    map.set("test", value);

    await requestGC();
    await waitForGC(() => finalizer.mock.calls.length > 0);

    expect(finalizer).toHaveBeenCalledWith("test");

    expect(map.has("test")).toBe(true);
    expect(map.get("test")).toBe(value);
  });
});
