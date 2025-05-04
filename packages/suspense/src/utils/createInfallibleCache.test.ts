import { describe, expect, it, vi } from "vitest";
import { createInfallibleCache } from "./createInfallibleCache";

describe("createInfallibleCache", () => {
  it("should pass through params and return value when Suspense is successful", () => {
    const cache = vi.fn().mockImplementation((params) => {
      return params * 2;
    });
    const infallibleCache = createInfallibleCache(cache);

    expect(infallibleCache(1)).toEqual(2);
    expect(infallibleCache(123)).toEqual(246);
  });

  it("it should return undefined when the Suspense cache throws", () => {
    const cache = vi.fn().mockImplementation(() => {
      throw Error("Expected error");
    });
    const infallibleCache = createInfallibleCache(cache);

    expect(infallibleCache()).toEqual(undefined);
  });
});
