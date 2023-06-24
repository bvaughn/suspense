import { disableDebugLogging, enableDebugLogging, log } from "./debugging";

describe("debugging", () => {
  let consoleMock: jest.SpyInstance<
    void,
    [message?: any, ...optionalParams: any[]],
    any
  >;

  beforeEach(() => {
    consoleMock = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should honor the debug param", () => {
    log(true, ["should be logged"]);
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith("should be logged");

    log(false, ["should not be logged"]);
    expect(consoleMock).toHaveBeenCalledTimes(1);

    enableDebugLogging();
    log(false, ["should not be logged"]);
    expect(consoleMock).toHaveBeenCalledTimes(1);
  });

  it("should default to using the global the debug value if no debug param passed", () => {
    enableDebugLogging();
    log(undefined, ["should be logged"]);
    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenCalledWith("should be logged");

    disableDebugLogging();
    log(undefined, ["should not be logged"]);
    expect(consoleMock).toHaveBeenCalledTimes(1);
  });
});
