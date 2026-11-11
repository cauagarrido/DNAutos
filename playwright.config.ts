import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    channel: "msedge",
    baseURL: "http://127.0.0.1:5110",
    headless: true,
  },
  webServer: {
    command: "npm run dev:all",
    url: "http://127.0.0.1:5110/api/health",
    reuseExistingServer: false,
    timeout: 30000,
    env: {
      PUBLIC_APP_URL: "http://127.0.0.1:5110",
      PUBLIC_API_URL: "http://127.0.0.1:5110",
      PORT: "3000",
    },
  },
});
