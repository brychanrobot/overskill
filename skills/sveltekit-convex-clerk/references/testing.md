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

### The Solution: Reusing Active Dev Server
Configure `playwright.config.ts` to spin up or reuse the dev server, matching Vite's port dynamically:

```typescript
import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT) || 5173;
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ||
  (process.env.LOCAL_DOMAIN ? `http://${process.env.LOCAL_DOMAIN}` : `http://localhost:${port}`);

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

And in `vite.config.ts`, align the port and allow Caddy reverse proxy hosts:
```typescript
const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port,
    strictPort: true,
    allowedHosts: true, // Allow Caddy reverse proxy via <project-name>.localhost
  },
});
```

