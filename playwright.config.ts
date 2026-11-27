import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseURL = "http://127.0.0.1:3199";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  use: {
    baseURL,
    launchOptions: { executablePath: process.env.BROWSER_EXECUTABLE },
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3199",
    url: baseURL,
    reuseExistingServer: false,
    env: {
      VULNMENTOR_INSTRUCTOR_CODE: "e2e-only",
      VULNMENTOR_DATABASE_PROVIDER: process.env.VM_E2E_PROVIDER || "sqlite",
      VULNMENTOR_DATA_DIR:
        process.env.VM_E2E_DIR || mkdtempSync(join(tmpdir(), "vm-e2e-")),
    },
  },
});
