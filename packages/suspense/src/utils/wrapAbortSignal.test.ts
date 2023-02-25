import { wrapAbortSignal } from "./wrapAbortSignal";

describe("wrapAbortSignal", () => {
  it("should abort", () => {
    const abortController = new AbortController();
    const wrapped = wrapAbortSignal(abortController.signal);
    expect(wrapped.signal.aborted).toBe(false);
    wrapped.abort();
    expect(abortController.signal.aborted).toBe(false);
    expect(wrapped.signal.aborted).toBe(true);
  });

  it("should abort when the wrapped signal is already aborted", () => {
    const abortController = new AbortController();
    abortController.abort();
    expect(abortController.signal.aborted).toBe(true);
    const wrapped = wrapAbortSignal(abortController.signal);
    expect(wrapped.signal.aborted).toBe(true);
  });

  it("should abort when the wrapped signal aborts", () => {
    const abortController = new AbortController();
    const wrapped = wrapAbortSignal(abortController.signal);
    expect(wrapped.signal.aborted).toBe(false);
    abortController.abort();
    expect(abortController.signal.aborted).toBe(true);
    expect(wrapped.signal.aborted).toBe(true);
  });

  it("should remove listener when unwrapped", () => {
    const abortController = new AbortController();
    const wrapped = wrapAbortSignal(abortController.signal);
    expect(wrapped.signal.aborted).toBe(false);
    wrapped.unwrap();
    abortController.abort();
    expect(abortController.signal.aborted).toBe(true);
    expect(wrapped.signal.aborted).toBe(false);
  });
});
