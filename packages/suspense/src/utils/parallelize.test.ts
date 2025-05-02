import { describe, expect, it, vi } from "vitest";
import { parallelize } from "./parallelize";

describe("parallelize", () => {
  it("should call all callbacks before re-throwing any thrown value", () => {
    const callbackA = vi.fn();
    const callbackB = vi.fn().mockImplementation(() => {
      throw Error("Expected error");
    });
    const callbackC = vi.fn();

    expect(() => {
      parallelize(callbackA, callbackB, callbackC);
    }).toThrow("Expected error");

    expect(callbackA).toHaveBeenCalled();
    expect(callbackB).toHaveBeenCalled();
    expect(callbackC).toHaveBeenCalled();
  });

  it("should return all values if none of the callbacks suspend", () => {
    const callbackA = () => 123;
    const callbackB = () => "abc";

    const [a, b] = parallelize(callbackA, callbackB);

    expect(a).toEqual(123);
    expect(b).toEqual("abc");
  });
});
