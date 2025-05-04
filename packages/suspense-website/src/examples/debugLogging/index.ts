import { processExample } from "..";

import global from "./global?raw";
import perCache from "./per-cache?raw";

export const debugLogging = {
  global: processExample(global),
  perCache: processExample(perCache),
};
