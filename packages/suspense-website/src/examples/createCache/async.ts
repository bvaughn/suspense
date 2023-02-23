import { exampleCache } from "./cache";

// REMOVE_BEFORE
async function load(userId: string) {
  const userData = await exampleCache.fetchAsync(userId);
  // ...
}
