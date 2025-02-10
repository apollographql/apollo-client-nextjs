import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "yarn start",
        cwd: resolve(__dirname, process.env.TEST_PROJECT_DIR),
        port: 3000,
        timeout: 15 * 1000,
        reuseExistingServer: !process.env.CI,
      },
  timeout: 15 * 1000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    baseURL: process.env.BASE_URL || "http://localhost:3000",
  },
  testDir: "src/",
});
