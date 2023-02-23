import { readFileSync } from "fs";
import { join } from "path";
import { processExample } from "../processExample";

const control = processExample(
  readFileSync(join(__dirname, "control.ts"), "utf8")
);
const create = processExample(
  readFileSync(join(__dirname, "create.ts"), "utf8")
);
const observe = processExample(
  readFileSync(join(__dirname, "observe.ts"), "utf8")
);

export { control, create, observe };
