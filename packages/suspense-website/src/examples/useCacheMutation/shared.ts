import { createCache } from "suspense";

export type User = {
  id: string;
  name: string;
};

export const userCache = createCache<[string], User>({
  load: async () => ({
    id: "1",
    name: "",
  }),
});
