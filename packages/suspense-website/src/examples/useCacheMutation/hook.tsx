import { userCache } from "./shared";

// REMOVE_BEFORE

import { useCacheMutation } from "suspense";

function Example() {
  const api = useCacheMutation(userCache);

  // ...
}
