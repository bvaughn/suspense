import { createCache } from "suspense";

type Module = any;

export const { readAsync: fetchModuleAsync, read: fetchModuleSuspense } =
  createCache<[string], Module>({
    debugLabel: "ImportCache",
    load: async ([path]) => {
      switch (path) {
        case "@codemirror/lang-css":
          return await import("@codemirror/lang-css");
        case "@codemirror/lang-html":
          return await import("@codemirror/lang-html");
        case "@codemirror/lang-javascript":
          return await import("@codemirror/lang-javascript");
        case "@codemirror/lang-markdown":
          return await import("@codemirror/lang-markdown");
        default:
          throw Error(`Unknown path: ${path}`);
      }
    },
  });
