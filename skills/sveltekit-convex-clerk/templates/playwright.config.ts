import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT) || 5173;
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ||
  (process.env.LOCAL_DOMAIN ? `http://${process.env.LOCAL_DOMAIN}` : `http://localhost:${port}`);


export default defineConfig({
  testDir: './e2e',
  webServer: {
    command: 'pnpm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
