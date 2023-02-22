import { exampleCache } from "./cache";

async function load(userId: string) {
  const userData = await exampleCache.fetchAsync(userId);
  // ...
}
