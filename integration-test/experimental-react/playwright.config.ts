import { defineConfig } from "@playwright/test";

export default defineConfig({
  webServer: {
    command: "node server",
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: 3000,
      NODE_ENV: "production",
    },
  },
  timeout: 120 * 1000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  testDir: "src/",
});
