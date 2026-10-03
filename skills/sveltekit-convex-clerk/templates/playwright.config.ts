import { defineConfig, devices } from '@playwright/test';
import pkg from './package.json';

const projectName = pkg.name || process.env.npm_package_name || 'app';
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ||
  process.env.PORTLESS_URL ||
  (process.env.LOCAL_DOMAIN ? `https://${process.env.LOCAL_DOMAIN}` : `https://${projectName}.localhost`);

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
