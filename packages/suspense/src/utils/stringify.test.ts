import { describe, expect, it } from "vitest";
import { stringify } from "./stringify";

describe("stringify", () => {
  it("should stringify values with circular references", () => {
    const array: any[] = [123, "string", true];
    array.push(array);
    const object: Object = {
      string: "string",
      number: 123,
      array,
    };
    // @ts-ignore
    object.object = object;

    expect(stringify(object)).toEqual(
      '{"string":"string","number":123,"array":[123,"string",true,"[Circular]"],"object":"[Circular]"}'
    );
  });

  it("should respect the space parameter", () => {
    const object: Object = {
      string: "string",
      number: 123,
      boolean: true,
    };

    expect(stringify(object, 2)).toBe(JSON.stringify(object, null, 2));
  });
});
