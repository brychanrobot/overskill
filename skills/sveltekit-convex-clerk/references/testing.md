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

## 2. Test Scripts & Baseline Setup

Standardized scripts configured in `package.json`:
- `pnpm run test:unit`: Executes Vitest tests once (`vitest run`).
- `pnpm run test:e2e`: Runs Playwright headless browser tests (`playwright test`).
- `pnpm run test`: Executes both unit and E2E suites sequentially (`pnpm run test:unit && pnpm run test:e2e`).

### Baseline Sanity Tests

Ensure baseline test files exist so test suites pass immediately upon project creation:

- **Unit Test**: `src/demo.test.ts`
  ```ts
  import { describe, expect, it } from 'vitest';

  describe('sanity test', () => {
    it('verifies vitest test runner', () => {
      expect(1 + 1).toBe(2);
    });
  });
  ```

- **E2E Test**: `e2e/demo.test.ts`
  ```ts
  import { expect, test } from '@playwright/test';

  test('homepage renders navigation and auth controls', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
  });
  ```

---

## 3. Biome Linter & Formatter Alignment

Biome formats and checks test files without requiring third-party ESLint plugins. Test output directories are ignored in `biome.json`:
```json
"ignore": [
  "playwright-report/**",
  "test-results/**"
]
```

---

## 4. Dev Server Lifecycle & Collision Prevention

Default starter templates configure Playwright with:
```typescript
webServer: {
  command: 'pnpm run build && pnpm run preview',
  port: 4173
}
```

### The Collision Problem (`500 ENOENT: stat $types.d.ts` and `.vite-temp`)
When an AI agent or developer runs `pnpm run test:e2e` while `vite dev` is running concurrently in the background, `vite build` wipes `.svelte-kit/output` and unlinks `.svelte-kit/types/` and `.svelte-kit/generated/` (and `.vite-temp/`).
The active dev server's file watcher catches the deletion and tries to stat `.svelte-kit/types/src/routes/$types.d.ts` or temporary Vite files at the exact microsecond `vite build` unlinked them, crashing the dev server with `500 ENOENT: stat $types.d.ts`.

### The Process Tree Hang Problem (`pnpm -> portless -> vite`)
When Playwright's `webServer` executes `pnpm run dev`, the process hierarchy is:
`Playwright` $\to$ `pnpm` $\to$ `portless` $\to$ `vite dev`.
Playwright sends `SIGTERM` to `pnpm` when tests complete. However, `pnpm` does **not** reliably forward termination signals down to grandchild processes (`portless` and `vite`).
The dev server survives holding the ephemeral port, causing Playwright to hang indefinitely waiting for the `webServer` process tree to exit.

### The Mandatory Solution: Reusing Active Dev Server with Portless
1. Always run the dev server as a persistent background daemon (`IsDaemon: true`).
2. Configure `playwright.config.ts` with `reuseExistingServer: true`, bound to `baseURL` (Portless `https://<project-name>.localhost` or `process.env.PORTLESS_URL`):

```typescript
// playwright.config.ts
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
    reuseExistingServer: true, // Always reuse persistent Portless daemon; prevents Playwright from spawning/leaking child processes
    timeout: 60 * 1000,
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
```

And in `vite.config.ts`, ensure `strictPort: true` and `allowedHosts: true` so the Portless proxy on `*.localhost` can communicate with Vite:
```typescript
// vite.config.ts
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

### Dev Server Lifecycle Hygiene (`portless prune`)
If an interrupted test run, crashed session, or terminated subagent leaves dangling dev servers behind:
```bash
portless prune
# or force termination:
portless prune --force
```
This scans `~/.portless/routes.json`, reaps dead CLI routes, and sends `SIGTERM`/`SIGKILL` to any surviving orphaned child dev servers (`vite dev`) holding previous ephemeral ports.

---

## 5. Interactive Testing & Verification with Playwright CLI

Agents should verify live application behavior and capture visual evidence without writing throwaway browser scripts, using the bundled **Playwright CLI script** (`skills/playwright/scripts/playwright-cli.ts`):

### A. Health & Console Probe
Verify zero unhandled runtime exceptions, reactivity warnings, or failed network requests occurred:
```bash
node skills/playwright/scripts/playwright-cli.ts probe https://<project-name>.localhost
```

### B. Authenticated Session Setup
Provisions a test user and captures authenticated storageState to `playwright/.clerk/user.json`:
```bash
node skills/playwright/scripts/playwright-cli.ts auth-setup --save-session
```
*Result*: Provisions `test-agent@example.com`, exchanges the single-use ticket URL (`__clerk_ticket`), and saves session cookies to `playwright/.clerk/user.json`.

### C. Capture High-Definition Visual Proof
Capture screenshots of protected routes for walkthrough artifacts:
```bash
node skills/playwright/scripts/playwright-cli.ts screenshot https://<project-name>.localhost \
  --auth playwright/.clerk/user.json \
  -o /home/bryant/.gemini/antigravity/brain/<conversation-id>/dashboard-preview.png
```

---

## 6. Headless Test User Provisioning (`create-test-user.ts`)

For fully automated, headless testing without captcha, MFA, or manual credential entry, the project provides `templates/create-test-user.ts` (installed into `scripts/create-test-user.ts`).

### How It Works:
1. **Reads Clerk Credentials**: Loads `CLERK_SECRET_KEY` from `.env.local` or process environment.
2. **Finds or Creates User**: Calls the Clerk REST API (`POST https://api.clerk.com/v1/users`) with `skip_password_checks: true` and `skip_password_requirement: true` for `test-agent@example.com`.
3. **Generates Sign-In Ticket Token**: Calls `POST https://api.clerk.com/v1/sign_in_tokens` (valid for 24 hours).
4. **Constructs 1-Click Sign-In URL**:
   `https://<project-name>.localhost/sign-in?__clerk_ticket=<ticketToken>`
5. **Captures `storageState` (`--save-session`)**:
   When `--save-session` is passed, launches headless Chromium via Playwright, navigates to the ticket URL, allows Clerk to exchange the token and set session cookies, and saves the authenticated state to `playwright/.clerk/user.json`.

### Execution:
```bash
# Provision test user and save session cookies for Playwright
node scripts/create-test-user.ts --save-session
```

### Using in Automated Playwright Tests:
In `playwright.config.ts` or individual test files:
```typescript
import { test } from '@playwright/test';

test.use({ storageState: 'playwright/.clerk/user.json' });

test('authenticated user can view and create tasks', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^sign out$/i })).toBeVisible();
});
```


