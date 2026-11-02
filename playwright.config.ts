import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: process.env.TEST_BASE_URL ?? "http://localhost:3100", browserName: "chromium", channel: "msedge", trace: "retain-on-failure" },
  timeout: 60000,
  reporter: "list",
  ...(process.env.TEST_BASE_URL ? {} : {
    webServer: {
      command: "pnpm exec next dev --port 3100",
      url: "http://localhost:3100/login",
      reuseExistingServer: true,
      timeout: 120000,
    },
  }),
});