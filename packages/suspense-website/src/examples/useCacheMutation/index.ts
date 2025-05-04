import { processExample } from "..";

import async from "./async?raw";
import hook from "./hook?raw";
import sync from "./sync?raw";

export const useCacheMutation = {
  async: processExample(async),
  hook: processExample(hook),
  sync: processExample(sync),
};
