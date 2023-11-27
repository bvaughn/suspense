import { STATUS_PENDING, STATUS_REJECTED, STATUS_RESOLVED } from "..";
import { createDeferred } from "./createDeferred";

describe("createDeferred", () => {
  it("should resolve with a value", async () => {
    const deferred = createDeferred<string>();
    expect(deferred.status).toBe(STATUS_PENDING);

    setTimeout(() => {
      deferred.resolve("Resolved value");
      expect(deferred.status).toBe(STATUS_RESOLVED);
    }, 0);

    await expect(await deferred.promise).toBe("Resolved value");
  });

  it("should reject with a value", async () => {
    const deferred = createDeferred<string>();
    expect(deferred.status).toBe(STATUS_PENDING);

    deferred.reject("Expected error");
    expect(deferred.status).toBe(STATUS_REJECTED);

    let caught = null;

    try {
      await deferred.promise;
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
