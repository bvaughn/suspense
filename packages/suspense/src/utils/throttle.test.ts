import { describe, beforeEach, expect, it, vi } from 'vitest'
import { throttle } from "./throttle";

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should not throttle the initial call", () => {
    const callback = vi.fn();
    const throttled = throttle(callback, 1_000);
    expect(callback).not.toHaveBeenCalled();
    throttled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should pass through parameters", () => {
    const callback = vi.fn();
    const throttled = throttle(callback, 1_000);
    throttled(123, "abc", true);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(123, "abc", true);
  });

  it("should should throttle by the amount specified", () => {
    const callback = vi.fn();
    const throttled = throttle(callback, 1_000);
    throttled(111);
    expect(callback).toHaveBeenCalledTimes(1);
    throttled(222);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(999);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith(222);
  });

  it("should queue multiple calls and pass through the most recent args only", () => {
    const callback = vi.fn();
    const throttled = throttle(callback, 1_000);
    throttled(111);
    expect(callback).toHaveBeenCalledTimes(1);
    throttled(222);
    throttled(333);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(999);
    throttled(444);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith(444);
  });

  it("should allow pending request to be cancelled", () => {
    const callback = vi.fn();
    const throttled = throttle(callback, 1_000);
    throttled(111);
    expect(callback).toHaveBeenCalledTimes(1);
    throttled(222);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(999);
    throttled.cancel();
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
