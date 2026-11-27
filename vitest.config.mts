import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/app/api/**/route.ts", "src/lib/**/*.ts"],
      reporter: ["text-summary", "json-summary", "html"],
    },
  },
});
