import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT) || 5173;
const baseURL = `http://localhost:${port}`;

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
