# Testing Reference: Vitest & Playwright in SvelteKit

Official Resources:
- Vitest Documentation: https://vitest.dev/
- Playwright Documentation: https://playwright.dev/
- Svelte Testing Guide: https://svelte.dev/docs/kit/testing

## 1. Scaffolding with `sv add`

In modern SvelteKit, Vitest and Playwright are installed via the official `sv add` utility:
```bash
pnpm dlx sv add vitest="usages:unit,component" playwright --install pnpm
pnpm exec playwright install --with-deps chromium
```

## 2. Test Scripts

Standardized scripts configured in `package.json`:
- `pnpm run test:unit`: Executes Vitest tests once (`vitest run`).
- `pnpm run test:e2e`: Runs Playwright headless browser tests (`playwright test`).
- `pnpm run test`: Executes both unit and E2E suites sequentially.

## 3. Biome Linter & Formatter Alignment

Biome formats and checks test files without requiring third-party ESLint plugins. Test output directories are ignored in `biome.json`:
```json
"ignore": [
  "playwright-report/**",
  "test-results/**"
]
```

## 4. Dev Server Lifecycle & Collision Prevention

By default, standard starter templates configure Playwright with:
```typescript
webServer: {
  command: 'pnpm run build && pnpm run preview',
  port: 4173
}
```

### The Problem (`500 ENOENT: stat $types.d.ts`)
When an AI agent or developer runs `pnpm run test:e2e` while `vite dev` is running concurrently in the background, `vite build` wipes `.svelte-kit/output` and regenerates `.svelte-kit/types/` and `.svelte-kit/generated/`.
The active dev server's file watcher catches the deletion and tries to stat `.svelte-kit/types/src/routes/$types.d.ts` at the exact microsecond `vite build` unlinked it, crashing the dev server with `500 ENOENT: stat $types.d.ts`.

### The Solution: Reusing Active Dev Server with Portless
Configure `playwright.config.ts` to spin up or reuse the dev server, connecting via Portless (`https://<project-name>.localhost` or `process.env.PORTLESS_URL`):

```typescript
import { defineConfig, devices } from '@playwright/test';
import pkg from './package.json';

const projectName = pkg.name || process.env.npm_package_name || 'app';
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ||
  process.env.PORTLESS_URL ||
  (process.env.LOCAL_DOMAIN ? `https://${process.env.LOCAL_DOMAIN}` : `https://${projectName}.localhost`);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
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
  webServer: {
    command: 'pnpm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

And in `vite.config.ts`, enable `allowedHosts: true` so the Portless proxy on `*.localhost` can communicate with Vite:
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    // Portless automatically assigns an ephemeral port and injects --port / PORT
    strictPort: true,
    allowedHosts: true, // Allow Portless proxy on *.localhost (e.g. <project-name>.localhost)
  },
  preview: {
    strictPort: true,
    allowedHosts: true,
  },
});
```

