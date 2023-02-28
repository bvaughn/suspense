import { requestGC, waitForGC } from "./test";
import { WeakRefMap } from "./WeakRefMap";

describe("WeakRefMap", () => {
  let finalizer: jest.Mock<FinalizationRegistry<string>>;
  let map: WeakRefMap<string, object>;

  beforeEach(() => {
    finalizer = jest.fn();
    map = new WeakRefMap(finalizer);
  });

  it("should implement a basic Map-like API", () => {
    const foo = { foo: true };
    const bar = { bar: true };

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

  it("should call the finalizer function when a value is garbage collected", async () => {
    map.set("foo", { foo: true });
    map.set("bar", { bar: true });

    finalizer.mockReset();

    requestGC();

    await waitForGC(() => finalizer.mock.calls.length === 2);

    expect(finalizer).toHaveBeenCalledWith("foo");
    expect(finalizer).toHaveBeenCalledWith("bar");
  });
});
