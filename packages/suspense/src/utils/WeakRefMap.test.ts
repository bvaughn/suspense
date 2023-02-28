import { WeakRefMap } from "./WeakRefMap";

describe("WeakRefMap", () => {
  it("should implement a basic Map-like API", () => {
    const finalizer = jest.fn();

    const foo = { foo: true };
    const bar = { bar: true };

    const map = new WeakRefMap(finalizer);
    map.set("foo", foo);
    map.set("bar", bar);

    expect(map.size()).toBe(2);
    expect(map.has("foo")).toBe(true);
    expect(map.has("bar")).toBe(true);
    expect(map.get("foo")).toBe(foo);
    expect(map.get("bar")).toBe(bar);

    expect(map.delete("foo")).toBe(true);
    expect(map.size()).toBe(1);
    expect(map.has("foo")).toBe(false);
    expect(map.get("foo")).toBe(undefined);
    expect(map.has("bar")).toBe(true);
    expect(map.get("bar")).toBe(bar);

    map.set("bar", foo);
    expect(map.size()).toBe(1);
    expect(map.has("bar")).toBe(true);
    expect(map.get("bar")).toBe(foo);

    map.delete("bar");
    expect(map.size()).toBe(0);
    expect(map.has("foo")).toBe(false);
    expect(map.has("bar")).toBe(false);
    expect(map.get("foo")).toBe(undefined);
    expect(map.get("bar")).toBe(undefined);
  });
});
