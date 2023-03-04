import { createDeferred } from "./createDeferred";

describe("createDeferred", () => {
  it("should resolve with a value", async () => {
    const deferred = createDeferred<string>();

    setTimeout(() => {
      deferred.resolve("Resolved value");
    }, 0);

    await expect(await deferred).toBe("Resolved value");
  });

  it("should reject with a value", async () => {
    const deferred = createDeferred<string>();

    deferred.reject("Expected error");

    let caught = null;

    try {
      await deferred;
    } catch (error) {
      caught = error;
    }

    expect(caught).toBe("Expected error");
  });

  it("should throw error if resolve or reject called after completion", async () => {
    const deferred = createDeferred<string>();
    deferred.resolve("Resolved value");

    expect(() => {
      deferred.resolve("Not permitted");
    }).toThrowError("Deferred has already been resolved");

    expect(() => {
      deferred.reject("Not permitted");
    }).toThrowError("Deferred has already been resolved");
  });
});
