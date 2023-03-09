import { userCache, User } from "./shared";

import { RefObject } from "react";
import { useCacheMutation } from "suspense";

const userId = "1";

const inputRef: RefObject<HTMLInputElement> = null as any;

// REMOVE_BEFORE

const { mutateSync } = useCacheMutation(userCache);

const onClick = () => {
  const newName = inputRef.current!.value;

  mutateSync([userId], {
    id: userId,
    name: newName,
  });
};
