import { userCache, User } from "./shared";

import { useCacheMutation } from "suspense";

const apiClient = {
  updateUserName: async (id: string, name: string) => {
    return { id } as User;
  },
};

const userId = "1";

// REMOVE_BEFORE

const { isPending, mutateAsync } = useCacheMutation(userCache);

const onClick = () => {
  // The mutate method requires the same params as the read method
  // so that it can identify which record is being mutated
  // In this example, that means the user id
  mutateAsync([userId], async () => {
    const updatedUser = await apiClient.updateUserName(userId, "New name");

    // This value will be added to the cache
    return updatedUser;
  });
};

// isPending can be used to disable form inputs while saving the new name
