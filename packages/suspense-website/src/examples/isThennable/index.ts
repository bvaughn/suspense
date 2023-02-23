import { readFileSync } from "fs";
import { join } from "path";
import { processExample } from "../processExample";

const util = processExample(readFileSync(join(__dirname, "util.ts"), "utf8"));

export { util };
