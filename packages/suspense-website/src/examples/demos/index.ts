import { processExample } from "..";

import abort from "./abortRequest/abort?raw";
import addItem from "./mutating-cache-values/AddItem?raw";
import UserStatusBadge from "./rendering-status-while-fetching/UserStatusBadge?raw";
import Posts from "./streaming-cache/Posts?raw";

export const demos = {
  abortRequest: {
    abort: processExample(abort),
  },
  mutatingCacheValue: {
    addItem: processExample(addItem),
  },
  renderingCacheStatus: {
    UserStatusBadge: processExample(UserStatusBadge),
  },
  streamingCache: {
    Posts: processExample(Posts),
  },
};
