import { processExample } from "..";

import control from "./control?raw";
import create from "./create?raw";
import observe from "./observe?raw";

export const createDeferred = {
  control: processExample(control),
  create: processExample(create),
  observe: processExample(observe),
};
