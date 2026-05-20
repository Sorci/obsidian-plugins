import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      obsidian: path.join(rootDir, "src/__tests__/obsidian.ts")
    }
  },
  test: {
    environment: "node"
  }
});

