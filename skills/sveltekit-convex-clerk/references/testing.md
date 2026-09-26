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
