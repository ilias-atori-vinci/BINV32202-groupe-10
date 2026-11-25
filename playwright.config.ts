import { defineConfig, devices } from "@playwright/test";

const API_PORT = "3000";
const FRONTEND_PORT = "5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: `http://127.0.0.1:${FRONTEND_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run e2e:prepare && npm run e2e:api",
      url: `http://127.0.0.1:${API_PORT}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        API_PORT,
        DATABASE_PATH: "data/e2e.db",
        DEMO_AUTH_ENABLED: "true",
        JWT_SECRET: "playwright-e2e-secret-key-minimum-32-characters",
        NODE_ENV: "test",
      },
    },
    {
      command: "npm run dev -w frontend -- --host 127.0.0.1",
      url: `http://127.0.0.1:${FRONTEND_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        API_PORT,
      },
    },
  ],
});
