import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/env.setup.ts", "src/test/setup.ts"],
    fileParallelism: false,
  },
});
