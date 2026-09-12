import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3010",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx next dev --port 3010",
    url: "http://localhost:3010",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      APP_URL: "http://localhost:3010",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
