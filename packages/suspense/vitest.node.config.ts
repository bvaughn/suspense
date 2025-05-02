import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.node.{test,spec}.?(c|m)[jt]s?(x)"],
    coverage: {
      reporter: ["text", "json", "html"], // Optional: Add coverage reports
    },
    poolOptions: {
      forks: {
        execArgv: ["--expose-gc"],
      },
    },
  },
  resolve: {
    conditions: ["development"],
  },
});
