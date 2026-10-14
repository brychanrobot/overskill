#!/usr/bin/env node
/**
 * Playwright CLI (skills/playwright/scripts/playwright-cli.ts)
 * ==========================================================
 * A versatile, ergonomic, headless browser automation, testing,
 * inspection, and debugging CLI crafted for Antigravity agents and developers.
 *
 * Core Features:
 * - Smart Locators: Auto-resolves by role, text, label, placeholder, testid, or CSS
 * - Helpful Failure Feedback: Lists visible interactive elements on selector misses
 * - Compound Operations: `create`, `form`, `assert`, `smoke`, and chained `run`
 * - Arbitrary Playwright Code Execution via `exec` (inline or script file)
 * - Page Health & Console Probing (`probe`)
 * - High-Def Screenshots & Accessibility Tree Snapshots (`screenshot`, `snapshot`)
 * - Clerk Test User Provisioning & Session Persistence (`auth-setup`)
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

// ANSI colors for clean terminal output
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

/**
 * Dynamically resolves and loads Playwright from project or parent node_modules.
 */
async function loadPlaywright() {
  const candidates = [
    '@playwright/test',
    'playwright',
    path.resolve(process.cwd(), 'node_modules', '@playwright/test'),
    path.resolve(process.cwd(), 'node_modules', 'playwright'),
    path.resolve(import.meta.dirname, '..', '..', '..', 'node_modules', 'playwright'),
  ];

  for (const candidate of candidates) {
    try {
      const mod = await import(candidate);
      if (mod.chromium) return mod;
    } catch {}
  }

  throw new Error(
    "Playwright was not found in the local environment.\n" +
    "Install it in your project with: pnpm add -D playwright\n" +
    "and ensure browser binaries exist: pnpm exec playwright install chromium"
  );
}

/**
 * Loads .env.local and .env key-value pairs into process.env without external dependencies.
 */
function loadEnv() {
  const envFiles = [path.resolve('.env.local'), path.resolve('.env')];
  for (const envFile of envFiles) {
    if (!existsSync(envFile)) continue;
    try {
      const content = readFileSync(envFile, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    } catch {}
  }
}

/**
 * Detects local project name and default Portless domain.
 */
function getDefaultUrl(): string {
  if (process.env.PORTLESS_URL) return process.env.PORTLESS_URL;
  if (process.env.LOCAL_DOMAIN) return `https://${process.env.LOCAL_DOMAIN}`;

  let projectName = 'app';
  try {
    const pkgPath = path.resolve('package.json');
    if (existsSync(pkgPath)) {
      projectName = JSON.parse(readFileSync(pkgPath, 'utf-8')).name || 'app';
    }
  } catch {}

  return `https://${projectName}.localhost`;
}

/**
 * Smart Locator Resolver:
 * Accepts CSS selectors, text, roles, labels, placeholders, or plain natural strings.
 */
async function resolveLocator(page: any, target: string) {
  const trimmed = target.trim();

  // 1. Explicit prefixes:
  if (trimmed.startsWith('role=')) {
    const roleMatch = trimmed.match(/^role=([a-z]+)(\[(.*)\])?$/i);
    if (roleMatch) {
      const role = roleMatch[1];
      const optsStr = roleMatch[3] || '';
      const nameMatch = optsStr.match(/name=['"](.*?)['"]/);
      const name = nameMatch ? nameMatch[1] : undefined;
      return page.getByRole(role as any, { name });
    }
  }
  if (trimmed.startsWith('text=')) {
    return page.getByText(trimmed.slice(5), { exact: false });
  }
  if (trimmed.startsWith('label=')) {
    return page.getByLabel(trimmed.slice(6));
  }
  if (trimmed.startsWith('placeholder=')) {
    return page.getByPlaceholder(trimmed.slice(12));
  }
  if (trimmed.startsWith('testid=')) {
    return page.getByTestId(trimmed.slice(7));
  }

  // 2. CSS Selectors (classes, IDs, attributes, child combinators):
  if (
    trimmed.startsWith('.') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('[') ||
    trimmed.includes('>') ||
    trimmed.includes(':') ||
    trimmed.includes(' ')
  ) {
    return page.locator(trimmed);
  }

  // 3. Smart user-centric fallback for plain text strings (e.g. "Add", "Sign In", "Email"):
  try {
    const buttonLoc = page.getByRole('button', { name: trimmed });
    if ((await buttonLoc.count().catch(() => 0)) > 0) return buttonLoc.first();

    const linkLoc = page.getByRole('link', { name: trimmed });
    if ((await linkLoc.count().catch(() => 0)) > 0) return linkLoc.first();

    const placeholderLoc = page.getByPlaceholder(trimmed);
    if ((await placeholderLoc.count().catch(() => 0)) > 0) return placeholderLoc.first();

    const labelLoc = page.getByLabel(trimmed);
    if ((await labelLoc.count().catch(() => 0)) > 0) return labelLoc.first();

    const textLoc = page.getByText(trimmed);
    if ((await textLoc.count().catch(() => 0)) > 0) return textLoc.first();
  } catch {}

  return page.locator(trimmed);
}

/**
 * Scans page for visible interactive elements to provide helpful suggestions when a locator fails.
 */
async function getVisibleElementsGuide(page: any): Promise<string[]> {
  try {
    return await page.evaluate(() => {
      const items: string[] = [];
      const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"]');
      buttons.forEach((b) => {
        const text = (b.textContent || (b as HTMLInputElement).value || b.getAttribute('aria-label') || '').trim();
        if (text && (b as HTMLElement).offsetParent !== null) {
          items.push(`Button: "${text}"`);
        }
      });

      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]), textarea');
      inputs.forEach((i) => {
        const el = i as HTMLInputElement;
        const desc = el.placeholder
          ? `placeholder="${el.placeholder}"`
          : el.name
            ? `name="${el.name}"`
            : el.id
              ? `id="${el.id}"`
              : el.type;
        if (el.offsetParent !== null) {
          items.push(`Input: ${desc}`);
        }
      });

      const links = document.querySelectorAll('a[href]');
      links.forEach((a) => {
        const text = (a.textContent || a.getAttribute('aria-label') || '').trim();
        if (text && (a as HTMLElement).offsetParent !== null) {
          items.push(`Link: "${text}"`);
        }
      });

      return items.slice(0, 15);
    });
  } catch {
    return [];
  }
}

/**
 * Saves a failure screenshot and returns helpful locator diagnostics.
 */
async function handleActionFailure(page: any, actionDesc: string, targetSelector: string, error: any) {
  console.error(`\n${RED}${BOLD}❌ Action Failed:${RESET} Could not perform ${actionDesc}`);
  console.error(`   Target selector: ${CYAN}${targetSelector}${RESET}`);
  console.error(`   Error message  : ${error.message || String(error)}`);

  // 1. Suggest available elements
  const suggestions = await getVisibleElementsGuide(page);
  if (suggestions.length > 0) {
    console.error(`\n${YELLOW}${BOLD}💡 Visible interactive elements on page right now:${RESET}`);
    for (const sug of suggestions) {
      console.error(`   ${DIM}•${RESET} ${sug}`);
    }
  }

  // 2. Capture automatic failure screenshot
  try {
    const failDir = path.resolve('.playwright/failures');
    if (!existsSync(failDir)) mkdirSync(failDir, { recursive: true });
    const failPath = path.join(failDir, `failure-${Date.now()}.png`);
    await page.screenshot({ path: failPath, fullPage: true });
    console.error(`\n${CYAN}📸 Saved failure screenshot:${RESET} ${failPath}`);
    console.error(`   ${DIM}file://${failPath}${RESET}`);
  } catch {}

  console.error('');
}

function showHelp() {
  console.log(`
${BOLD}Playwright CLI (overskill)${RESET}
Ergonomic browser automation, compound testing, and diagnostics for Antigravity.

${BOLD}USAGE${RESET}
  node skills/playwright/scripts/playwright-cli.ts <command> [options]

${BOLD}COMPOUND WORKFLOWS (Ergonomic Shortcuts)${RESET}
  ${CYAN}create <url>${RESET}           Input text, submit form, and verify new item appears in real time.
                         e.g. create --input "Add item..." --value "Buy bread" --submit "Add" --expect "Buy bread"
  ${CYAN}form <url>${RESET}             Fill multiple form fields and submit in one go.
                         e.g. form --fields "email=test@example.com, password=Secret123!" --submit "Log in"
  ${CYAN}assert <url>${RESET}           Run multi-condition page assertions (has-text, visible, count, missing).
  ${CYAN}smoke <url>${RESET}            Automated smoke test across multiple routes with screenshot gallery.
  ${CYAN}run [steps...]${RESET}         Execute a chained sequence of actions in a single browser session.

${BOLD}CORE TESTING & DIAGNOSTICS${RESET}
  ${CYAN}probe <url>${RESET}            Health check: captures console errors, warnings, runtime exceptions.
  ${CYAN}exec <code>|<file>${RESET}     Execute arbitrary Playwright code snippet or script file with (page).
  ${CYAN}click <url> <sel>${RESET}      Smart click element matching selector, role, text, or label.
  ${CYAN}fill <url> <sel> <val>${RESET} Smart fill input field with specified value.
  ${CYAN}screenshot <url>${RESET}       Capture high-definition full-page or element screenshot.
  ${CYAN}snapshot <url>${RESET}         Dump structured accessibility tree (headings, buttons, inputs).
  ${CYAN}auth-setup${RESET}             Provision Clerk test user, print ticket URL, and save storageState.

${BOLD}SMART SELECTORS (Auto-Detected)${RESET}
  Plain text:   "Add Task"             (matches button, link, or label with that text)
  Role:         "role=button[name='Add']"
  Placeholder:  "placeholder='Search...'" or "placeholder=Search..."
  Label:        "label='Email'"
  Text match:   "text='Success'"
  CSS:          "button.primary", "#submit", "[data-testid='task-item']"

${BOLD}ACTION FLAGS (for 'run')${RESET}
  ${YELLOW}--goto <url>${RESET}           Navigate to URL
  ${YELLOW}--click <selector>${RESET}     Click element matching smart selector
  ${YELLOW}--fill <sel,val>${RESET}       Fill input with value (format: "selector,value")
  ${YELLOW}--type <sel,text>${RESET}      Type text sequentially with keyboard events
  ${YELLOW}--press <key>${RESET}          Press key (e.g. Enter, Escape, Tab, ArrowDown)
  ${YELLOW}--check <selector>${RESET}     Check a checkbox
  ${YELLOW}--uncheck <selector>${RESET}   Uncheck a checkbox
  ${YELLOW}--select <sel,val>${RESET}     Select dropdown option by label or value
  ${YELLOW}--wait-for <text|sel>${RESET}  Wait for element or text to appear
  ${YELLOW}--assert-text <text>${RESET}   Assert text is visible on page
  ${YELLOW}--assert-visible <sel>${RESET} Assert element is visible on page
  ${YELLOW}--screenshot <file>${RESET}    Capture screenshot at current point in sequence
  ${YELLOW}--eval <code>${RESET}          Evaluate JavaScript snippet in page context

${BOLD}GLOBAL OPTIONS${RESET}
  ${YELLOW}--auth <path>${RESET}          Path to storageState JSON (e.g. playwright/.clerk/user.json)
  ${YELLOW}-o, --output <file>${RESET}    Output file path for screenshot
  ${YELLOW}--full-page${RESET}           Capture full scrollable page (default: true for screenshot)
  ${YELLOW}--viewport <WxH>${RESET}      Viewport size in pixels (default: 1280x800)
  ${YELLOW}--fail-on-warning${RESET}    Exit with code 1 if console warnings are detected
  ${YELLOW}--json${RESET}                Output structured JSON results
  ${YELLOW}-h, --help${RESET}            Show this help reference

${BOLD}EXAMPLES${RESET}
  # 1. Compound 'create' action (input + submit + verify + screenshot in 1 line):
  node skills/playwright/scripts/playwright-cli.ts create https://my-app.localhost \\
    --input "Add a new item..." --value "Buy fresh sourdough" --submit "Add" \\
    --expect "Buy fresh sourdough" -o artifacts/task-created.png

  # 2. Multi-field form submission:
  node skills/playwright/scripts/playwright-cli.ts form https://my-app.localhost/sign-in \\
    --fields "email=test-agent@example.com, password=TestPassword123!" \\
    --submit "Sign In" --expect "Dashboard" -o artifacts/logged-in.png

  # 3. Assert page conditions:
  node skills/playwright/scripts/playwright-cli.ts assert https://my-app.localhost \\
    --has-text "My Recipe Box" --missing-text "500 Internal Error" --visible "button:has-text('Add')"

  # 4. Multi-route smoke test with screenshot gallery:
  node skills/playwright/scripts/playwright-cli.ts smoke https://my-app.localhost \\
    --routes "/, /sign-in, /pricing" --out-dir artifacts/smoke
`);
}

/**
 * Creates an instrumented browser context with console/error capture and Portless HTTPS bypass.
 */
async function createSession(options: {
  authPath?: string;
  viewport?: { width: number; height: number };
}) {
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ headless: true });

  const contextOptions: any = {
    ignoreHTTPSErrors: true, // Native support for Portless self-signed local certs
    viewport: options.viewport || { width: 1280, height: 800 },
  };

  if (options.authPath && existsSync(options.authPath)) {
    contextOptions.storageState = options.authPath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  const consoleMessages: Array<{ type: string; text: string; location?: string }> = [];
  const pageErrors: Array<{ message: string; stack?: string }> = [];
  const failedRequests: Array<{ url: string; failure: string }> = [];

  page.on('console', (msg: any) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()?.url ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
    });
  });

  page.on('pageerror', (err: any) => {
    pageErrors.push({
      message: err.message,
      stack: err.stack,
    });
  });

  page.on('requestfailed', (req: any) => {
    failedRequests.push({
      url: req.url(),
      failure: req.failure()?.errorText || 'Unknown failure',
    });
  });

  return {
    browser,
    context,
    page,
    consoleMessages,
    pageErrors,
    failedRequests,
  };
}

// ============================================================================
// Compound Command: CREATE (Input + Submit + Expect + Screenshot)
// ============================================================================
async function runCompoundCreate(url: string, args: Record<string, string | boolean>) {
  const inputSelector = (args.input as string) || (args.field as string);
  const value = (args.value as string) || (args.text as string) || (args.val as string);
  const submitTarget = (args.submit as string) || (args.button as string) || 'button[type="submit"]';
  const expectedText = (args.expect as string) || value;
  const outputPath = (args.output as string) || (args.o as string);
  const authPath = (args.auth as string) || '';

  if (!inputSelector || !value) {
    console.error(`${RED}Error: 'create' requires --input <selector|placeholder> and --value <text>.${RESET}`);
    console.error('Example: create --input "Add item..." --value "Buy milk" --submit "Add" --expect "Buy milk"');
    process.exit(1);
  }

  const session = await createSession({ authPath });
  const { browser, page, consoleMessages, pageErrors } = session;

  console.log(`\n${BOLD}Playwright Compound Action:${RESET} Create item on ${CYAN}${url}${RESET}`);
  console.log('------------------------------------------------------------');

  try {
    console.log(`1. 🌐 Navigating to ${CYAN}${url}${RESET}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    console.log(`2. ✍️  Locating input '${CYAN}${inputSelector}${RESET}' and typing "${value}"...`);
    try {
      const inputLocator = await resolveLocator(page, inputSelector);
      await inputLocator.waitFor({ state: 'visible', timeout: 15000 });
      await inputLocator.fill(value);
    } catch (err) {
      await handleActionFailure(page, `fill input '${inputSelector}'`, inputSelector, err);
      process.exit(1);
    }

    console.log(`3. 👆 Submitting via '${CYAN}${submitTarget}${RESET}'...`);
    try {
      if (submitTarget.toLowerCase() === 'enter') {
        await page.keyboard.press('Enter');
      } else {
        const submitLocator = await resolveLocator(page, submitTarget);
        if ((await submitLocator.count().catch(() => 0)) > 0) {
          await submitLocator.first().click();
        } else {
          // Fallback to pressing enter
          await page.keyboard.press('Enter');
        }
      }
    } catch (err) {
      await handleActionFailure(page, `click submit '${submitTarget}'`, submitTarget, err);
      process.exit(1);
    }

    if (expectedText) {
      console.log(`4. ⏳ Waiting for expected item '${CYAN}${expectedText}${RESET}' to appear...`);
      try {
        await page.waitForSelector(`text=${expectedText}`, { timeout: 15000 });
        console.log(`   ${GREEN}✔ Confirmed item rendered in real-time!${RESET}`);
      } catch (err) {
        console.error(`${RED}✖ Expected text "${expectedText}" did not appear within 15 seconds.${RESET}`);
        await handleActionFailure(page, `find rendered text '${expectedText}'`, `text=${expectedText}`, err);
        process.exit(1);
      }
    }

    if (outputPath) {
      const resolvedOutput = path.resolve(outputPath);
      const parentDir = path.dirname(resolvedOutput);
      if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
      await page.screenshot({ path: resolvedOutput, fullPage: true });
      console.log(`5. ${GREEN}📸 Visual proof saved:${RESET} ${CYAN}${resolvedOutput}${RESET}`);
    }

    const errors = consoleMessages.filter((m) => m.type === 'error');
    if (errors.length > 0 || pageErrors.length > 0) {
      console.log(`\n${RED}⚠️  Warning: ${errors.length + pageErrors.length} error(s) detected in browser console:${RESET}`);
      for (const pe of pageErrors) console.log(`  ${RED}✖${RESET} ${pe.message}`);
      for (const ce of errors) console.log(`  ${RED}✖${RESET} ${ce.text}`);
    } else {
      console.log(`\n${GREEN}${BOLD}✔ Flow completed cleanly with 0 console errors!${RESET}\n`);
    }
  } finally {
    await browser.close();
  }
}

// ============================================================================
// Compound Command: FORM (Multi-Field Fill & Submit)
// ============================================================================
async function runCompoundForm(url: string, args: Record<string, string | boolean>) {
  const fieldsRaw = (args.fields as string) || (args.data as string);
  const submitTarget = (args.submit as string) || 'button[type="submit"]';
  const expectedText = args.expect as string;
  const outputPath = (args.output as string) || (args.o as string);
  const authPath = (args.auth as string) || '';

  if (!fieldsRaw) {
    console.error(`${RED}Error: 'form' requires --fields "field1=val1, field2=val2".${RESET}`);
    process.exit(1);
  }

  // Parse comma-separated fields: "email=user@test.com, password=SecretPassword123!"
  const fields = fieldsRaw.split(',').map((f) => {
    const eqIdx = f.indexOf('=');
    return {
      key: f.slice(0, eqIdx).trim(),
      val: f.slice(eqIdx + 1).trim(),
    };
  });

  const session = await createSession({ authPath });
  const { browser, page, consoleMessages, pageErrors } = session;

  console.log(`\n${BOLD}Playwright Form Workflow:${RESET} Filling ${fields.length} field(s) on ${CYAN}${url}${RESET}`);
  console.log('------------------------------------------------------------');

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    for (const f of fields) {
      console.log(`✍️  Filling '${CYAN}${f.key}${RESET}' -> "${f.val}"...`);
      try {
        const loc = await resolveLocator(page, f.key);
        await loc.waitFor({ state: 'visible', timeout: 15000 });
        await loc.fill(f.val);
      } catch (err) {
        await handleActionFailure(page, `fill field '${f.key}'`, f.key, err);
        process.exit(1);
      }
    }

    if (submitTarget) {
      console.log(`👆 Submitting via '${CYAN}${submitTarget}${RESET}'...`);
      try {
        const submitLoc = await resolveLocator(page, submitTarget);
        await submitLoc.click();
      } catch (err) {
        await handleActionFailure(page, `click submit button '${submitTarget}'`, submitTarget, err);
        process.exit(1);
      }
    }

    if (expectedText) {
      console.log(`⏳ Waiting for confirmation '${CYAN}${expectedText}${RESET}'...`);
      try {
        await page.waitForSelector(`text=${expectedText}`, { timeout: 15000 });
        console.log(`   ${GREEN}✔ Confirmed expected response!${RESET}`);
      } catch (err) {
        await handleActionFailure(page, `wait for confirmation '${expectedText}'`, `text=${expectedText}`, err);
        process.exit(1);
      }
    }

    if (outputPath) {
      const resolvedOutput = path.resolve(outputPath);
      const parentDir = path.dirname(resolvedOutput);
      if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
      await page.screenshot({ path: resolvedOutput, fullPage: true });
      console.log(`${GREEN}📸 Screenshot saved:${RESET} ${CYAN}${resolvedOutput}${RESET}`);
    }

    console.log(`\n${GREEN}${BOLD}✔ Form submitted successfully!${RESET}\n`);
  } finally {
    await browser.close();
  }
}

// ============================================================================
// Compound Command: ASSERT (Multi-Condition Page Checks)
// ============================================================================
async function runCompoundAssert(url: string, args: Record<string, string | boolean>) {
  const hasText = (args['has-text'] as string) || (args.text as string);
  const missingText = args['missing-text'] as string;
  const visibleSel = args.visible as string;
  const countSpec = args.count as string; // format: "selector,3"
  const authPath = (args.auth as string) || '';

  const session = await createSession({ authPath });
  const { browser, page } = session;

  console.log(`\n${BOLD}Playwright Assertions:${RESET} Validating ${CYAN}${url}${RESET}`);
  console.log('------------------------------------------------------------');

  let allPassed = true;

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    if (hasText) {
      const found = await page.getByText(hasText).count();
      if (found > 0) {
        console.log(`${GREEN}✔ Text Present:${RESET} "${hasText}" (matched ${found} element(s))`);
      } else {
        console.log(`${RED}✖ Text Missing:${RESET} "${hasText}" was not found on the page`);
        allPassed = false;
      }
    }

    if (missingText) {
      const found = await page.getByText(missingText).count();
      if (found === 0) {
        console.log(`${GREEN}✔ Text Absent:${RESET} "${missingText}" (correctly absent)`);
      } else {
        console.log(`${RED}✖ Text Unexpectedly Present:${RESET} "${missingText}" was found on page`);
        allPassed = false;
      }
    }

    if (visibleSel) {
      const loc = await resolveLocator(page, visibleSel);
      const isVis = await loc.first().isVisible().catch(() => false);
      if (isVis) {
        console.log(`${GREEN}✔ Element Visible:${RESET} "${visibleSel}"`);
      } else {
        console.log(`${RED}✖ Element Not Visible:${RESET} "${visibleSel}"`);
        allPassed = false;
      }
    }

    if (countSpec && countSpec.includes(',')) {
      const [sel, expectedCountStr] = countSpec.split(',');
      const expectedCount = Number(expectedCountStr.trim());
      const actualCount = await page.locator(sel.trim()).count();
      if (actualCount === expectedCount) {
        console.log(`${GREEN}✔ Element Count:${RESET} "${sel.trim()}" = ${actualCount}`);
      } else {
        console.log(`${RED}✖ Count Mismatch:${RESET} "${sel.trim()}" expected ${expectedCount}, got ${actualCount}`);
        allPassed = false;
      }
    }

    console.log('------------------------------------------------------------');
    console.log(`Result: ${allPassed ? `${GREEN}${BOLD}ALL PASSED${RESET}` : `${RED}${BOLD}FAILED${RESET}`}\n`);

    if (!allPassed) {
      const failDir = path.resolve('.playwright/failures');
      if (!existsSync(failDir)) mkdirSync(failDir, { recursive: true });
      const failPath = path.join(failDir, `assert-failed-${Date.now()}.png`);
      await page.screenshot({ path: failPath, fullPage: true });
      console.log(`📸 Failure state captured: ${CYAN}${failPath}${RESET}\n`);
    }

    process.exit(allPassed ? 0 : 1);
  } finally {
    await browser.close();
  }
}

// ============================================================================
// Compound Command: SMOKE (Multi-Route Health & Screenshot Gallery)
// ============================================================================
async function runCompoundSmoke(baseUrl: string, args: Record<string, string | boolean>) {
  const routesRaw = (args.routes as string) || '/';
  const outDir = (args['out-dir'] as string) || (args.output as string) || '.playwright/smoke';
  const authPath = (args.auth as string) || '';

  const routes = routesRaw.split(',').map((r) => r.trim()).filter(Boolean);
  const resolvedOutDir = path.resolve(outDir);
  if (!existsSync(resolvedOutDir)) mkdirSync(resolvedOutDir, { recursive: true });

  const session = await createSession({ authPath });
  const { browser, page, consoleMessages, pageErrors, failedRequests } = session;

  console.log(`\n${BOLD}Playwright Smoke Test:${RESET} Checking ${routes.length} route(s) on ${CYAN}${baseUrl}${RESET}`);
  console.log(`Gallery destination: ${resolvedOutDir}`);
  console.log('------------------------------------------------------------');

  let passedRoutes = 0;

  try {
    for (const route of routes) {
      const fullUrl = new URL(route, baseUrl).toString();
      const slug = route === '/' ? 'home' : route.replace(/[^a-z0-9]/gi, '-').replace(/^-|-$/g, '');
      const shotPath = path.join(resolvedOutDir, `${slug}.png`);

      // Reset logs for this route
      consoleMessages.length = 0;
      pageErrors.length = 0;
      failedRequests.length = 0;

      process.stdout.write(`• Checking ${CYAN}${route}${RESET}... `);
      try {
        const resp = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
        const status = resp?.status() || 200;
        await page.screenshot({ path: shotPath, fullPage: true });

        const errors = consoleMessages.filter((m) => m.type === 'error');
        if (errors.length > 0 || pageErrors.length > 0 || status >= 400) {
          console.log(`${RED}FAILED${RESET} (status: ${status}, errors: ${errors.length + pageErrors.length})`);
        } else {
          console.log(`${GREEN}OK${RESET} (status: ${status}) 📸 ${slug}.png`);
          passedRoutes++;
        }
      } catch (err: any) {
        console.log(`${RED}ERROR: ${err.message}${RESET}`);
      }
    }

    console.log('------------------------------------------------------------');
    console.log(`Summary: ${passedRoutes}/${routes.length} route(s) healthy.`);
    console.log(`Gallery saved to: ${CYAN}${resolvedOutDir}${RESET}\n`);

    process.exit(passedRoutes === routes.length ? 0 : 1);
  } finally {
    await browser.close();
  }
}

// ============================================================================
// Command: RUN (Chained Multi-Step Automation with Smart Locators)
// ============================================================================
interface ActionStep {
  type: string;
  value?: string;
  selector?: string;
  param?: string;
}

async function runChained(actions: ActionStep[], globalOptions: Record<string, string | boolean>) {
  if (actions.length === 0) {
    console.error(`${RED}Error: 'run' requires at least one action flag (e.g. --goto <url>, --click <selector>).${RESET}`);
    process.exit(1);
  }

  const authPath = (globalOptions.auth as string) || '';
  const session = await createSession({ authPath });
  const { browser, page, consoleMessages, pageErrors } = session;

  console.log(`\n${BOLD}Playwright Runner: Executing ${actions.length} action(s)...${RESET}`);
  console.log('------------------------------------------------------------');

  try {
    for (let i = 0; i < actions.length; i++) {
      const step = actions[i];
      const stepNum = `${DIM}[${i + 1}/${actions.length}]${RESET}`;

      try {
        switch (step.type) {
          case 'goto': {
            console.log(`${stepNum} 🌐 Navigate: ${CYAN}${step.value}${RESET}`);
            await page.goto(step.value!, { waitUntil: 'networkidle', timeout: 30000 });
            break;
          }
          case 'click': {
            console.log(`${stepNum} 👆 Click: ${CYAN}${step.selector}${RESET}`);
            const locator = await resolveLocator(page, step.selector!);
            await locator.waitFor({ state: 'visible', timeout: 15000 });
            await locator.click();
            break;
          }
          case 'fill': {
            console.log(`${stepNum} ✍️  Fill: ${CYAN}${step.selector}${RESET} with "${step.param}"`);
            const locator = await resolveLocator(page, step.selector!);
            await locator.waitFor({ state: 'visible', timeout: 15000 });
            await locator.fill(step.param || '');
            break;
          }
          case 'type': {
            console.log(`${stepNum} ⌨️  Type: ${CYAN}${step.selector}${RESET} -> "${step.param}"`);
            const locator = await resolveLocator(page, step.selector!);
            await locator.waitFor({ state: 'visible', timeout: 15000 });
            await locator.pressSequentially(step.param || '', { delay: 30 });
            break;
          }
          case 'press': {
            console.log(`${stepNum} ↵ Press Key: ${CYAN}${step.value}${RESET}`);
            await page.keyboard.press(step.value!);
            break;
          }
          case 'check': {
            console.log(`${stepNum} ☑️  Check: ${CYAN}${step.selector}${RESET}`);
            const locator = await resolveLocator(page, step.selector!);
            await locator.check();
            break;
          }
          case 'uncheck': {
            console.log(`${stepNum} ⬜ Uncheck: ${CYAN}${step.selector}${RESET}`);
            const locator = await resolveLocator(page, step.selector!);
            await locator.uncheck();
            break;
          }
          case 'select': {
            console.log(`${stepNum} ▾ Select: ${CYAN}${step.selector}${RESET} -> "${step.param}"`);
            const locator = await resolveLocator(page, step.selector!);
            await locator.selectOption(step.param!);
            break;
          }
          case 'waitFor': {
            console.log(`${stepNum} ⏳ Wait For: ${CYAN}${step.value}${RESET}`);
            if (step.value!.startsWith('text=')) {
              await page.waitForSelector(step.value!, { timeout: 15000 });
            } else {
              const loc = await resolveLocator(page, step.value!);
              await loc.waitFor({ state: 'visible', timeout: 15000 });
            }
            break;
          }
          case 'assertText': {
            console.log(`${stepNum} 🔍 Assert Text: "${CYAN}${step.value}${RESET}"`);
            const count = await page.getByText(step.value!).count();
            if (count === 0) throw new Error(`Assertion failed: text "${step.value}" is not visible on page.`);
            break;
          }
          case 'assertVisible': {
            console.log(`${stepNum} 🔍 Assert Visible: ${CYAN}${step.selector}${RESET}`);
            const loc = await resolveLocator(page, step.selector!);
            if (!(await loc.first().isVisible())) throw new Error(`Assertion failed: element "${step.selector}" is not visible.`);
            break;
          }
          case 'wait': {
            const secs = Number(step.value || 1);
            console.log(`${stepNum} ⏸️  Pause for ${secs}s...`);
            await page.waitForTimeout(secs * 1000);
            break;
          }
          case 'screenshot': {
            const outPath = path.resolve(step.value || 'preview.png');
            const parentDir = path.dirname(outPath);
            if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
            await page.screenshot({ path: outPath, fullPage: true });
            console.log(`${stepNum} ${GREEN}📸 Screenshot saved:${RESET} ${CYAN}${outPath}${RESET}`);
            break;
          }
          case 'eval': {
            console.log(`${stepNum} ⚡ Evaluate: ${DIM}${step.value}${RESET}`);
            await page.evaluate(step.value!);
            break;
          }
        }
      } catch (stepErr: any) {
        await handleActionFailure(page, `step ${i + 1} (${step.type})`, step.selector || step.value || '', stepErr);
        process.exit(1);
      }
    }

    console.log('------------------------------------------------------------');
    console.log(`${GREEN}${BOLD}✔ All ${actions.length} action(s) completed successfully!${RESET}`);

    const errors = consoleMessages.filter((m) => m.type === 'error');
    if (errors.length > 0 || pageErrors.length > 0) {
      console.log(`\n${RED}⚠️  Note: ${errors.length + pageErrors.length} console/page error(s) occurred during execution.${RESET}`);
      for (const pe of pageErrors) console.log(`  ${RED}✖ Runtime Error:${RESET} ${pe.message}`);
      for (const ce of errors) console.log(`  ${RED}✖ Console Error:${RESET} ${ce.text}`);
    }
    console.log('');
  } finally {
    await browser.close();
  }
}

// ============================================================================
// Command: EXEC (Arbitrary Playwright Code / Script File)
// ============================================================================
async function runExec(codeOrFile: string, globalOptions: Record<string, string | boolean>) {
  if (!codeOrFile) {
    console.error(`${RED}Error: 'exec' requires code string or script file path.${RESET}`);
    process.exit(1);
  }

  let codeToRun = codeOrFile;
  const authPath = (globalOptions.auth as string) || '';

  const resolvedFile = path.resolve(codeOrFile);
  if (existsSync(resolvedFile)) {
    console.log(`📜 Loading script file: ${CYAN}${resolvedFile}${RESET}`);
    codeToRun = readFileSync(resolvedFile, 'utf-8');
  }

  const session = await createSession({ authPath });
  const { browser, context, page, consoleMessages, pageErrors } = session;

  console.log(`\n${BOLD}Playwright Exec:${RESET} Running custom Playwright automation...`);
  console.log('------------------------------------------------------------');

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction('page', 'context', 'browser', codeToRun);

    const result = await fn(page, context, browser);

    console.log('------------------------------------------------------------');
    console.log(`${GREEN}${BOLD}✔ Script execution completed successfully!${RESET}`);
    if (result !== undefined) {
      console.log(`Result:`, result);
    }

    const errors = consoleMessages.filter((m) => m.type === 'error');
    if (errors.length > 0 || pageErrors.length > 0) {
      console.log(`\n${YELLOW}Warnings: Detected ${errors.length + pageErrors.length} error(s) in browser console:${RESET}`);
      for (const err of errors) console.log(`  ${RED}✖${RESET} ${err.text}`);
      for (const pe of pageErrors) console.log(`  ${RED}✖${RESET} ${pe.message}`);
    }
    console.log('');
  } catch (err: any) {
    console.error(`\n${RED}${BOLD}❌ Execution Failed:${RESET} ${err.message || String(err)}\n`);
    if (err.stack) console.error(`${DIM}${err.stack}${RESET}\n`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// ============================================================================
// Command: CLICK (Direct Action with Smart Locator)
// ============================================================================
async function runClick(url: string, selector: string, options: Record<string, string | boolean>) {
  if (!selector) {
    console.error(`${RED}Error: 'click' requires <url> and <selector>.${RESET}`);
    process.exit(1);
  }
  await runChained(
    [
      { type: 'goto', value: url },
      { type: 'click', selector },
      ...(options.output || options.o ? [{ type: 'screenshot', value: (options.output || options.o) as string }] : []),
    ],
    options
  );
}

// ============================================================================
// Command: FILL (Direct Action with Smart Locator)
// ============================================================================
async function runFill(url: string, selector: string, value: string, options: Record<string, string | boolean>) {
  if (!selector) {
    console.error(`${RED}Error: 'fill' requires <url>, <selector>, and <value>.${RESET}`);
    process.exit(1);
  }
  await runChained(
    [
      { type: 'goto', value: url },
      { type: 'fill', selector, param: value || '' },
      ...(options.output || options.o ? [{ type: 'screenshot', value: (options.output || options.o) as string }] : []),
    ],
    options
  );
}

// ============================================================================
// Command: PROBE (Console & Health Check)
// ============================================================================
async function runProbe(url: string, args: Record<string, string | boolean>) {
  const waitUntil = (args['wait-until'] as any) || 'networkidle';
  const authPath = (args.auth as string) || '';
  const waitSeconds = Number(args.wait || 0);
  const failOnWarning = Boolean(args['fail-on-warning']);
  const asJson = Boolean(args.json);

  const session = await createSession({ authPath });
  const { browser, page, consoleMessages, pageErrors, failedRequests } = session;

  let pageTitle = '';
  let finalUrl = url;
  let navigationError: string | null = null;

  try {
    await page.goto(url, { waitUntil, timeout: 30000 });
    if (waitSeconds > 0) {
      await page.waitForTimeout(waitSeconds * 1000);
    }
    pageTitle = await page.title();
    finalUrl = page.url();
  } catch (err: any) {
    navigationError = err.message || String(err);
  } finally {
    await browser.close();
  }

  const errors = consoleMessages.filter((m) => m.type === 'error');
  const warnings = consoleMessages.filter((m) => m.type === 'warning');
  const logs = consoleMessages.filter((m) => m.type !== 'error' && m.type !== 'warning');

  const hasErrors = errors.length > 0 || pageErrors.length > 0 || Boolean(navigationError);
  const hasWarnings = warnings.length > 0;
  const passed = !hasErrors && (!failOnWarning || !hasWarnings);

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          url: finalUrl,
          title: pageTitle,
          passed,
          navigationError,
          errorsCount: errors.length + pageErrors.length,
          warningsCount: warnings.length,
          logsCount: logs.length,
          pageErrors,
          consoleErrors: errors,
          consoleWarnings: warnings,
          failedRequests,
        },
        null,
        2
      )
    );
    process.exit(passed ? 0 : 1);
  }

  console.log(`\n${BOLD}Playwright Probe Report:${RESET} ${CYAN}${finalUrl}${RESET}`);
  console.log(`Title: ${pageTitle ? `"${pageTitle}"` : '(none)'}`);
  console.log('------------------------------------------------------------');

  if (navigationError) {
    console.log(`${RED}❌ Navigation Error:${RESET} ${navigationError}`);
  }

  if (pageErrors.length > 0) {
    console.log(`\n${RED}${BOLD}Unhandled Runtime Exceptions (${pageErrors.length}):${RESET}`);
    for (const pe of pageErrors) {
      console.log(`  ${RED}✖${RESET} ${pe.message}`);
      if (pe.stack) {
        console.log(`    ${DIM}${pe.stack.split('\n').slice(0, 3).join('\n    ')}${RESET}`);
      }
    }
  }

  if (errors.length > 0) {
    console.log(`\n${RED}${BOLD}Console Errors (${errors.length}):${RESET}`);
    for (const err of errors) {
      console.log(`  ${RED}✖${RESET} ${err.text}`);
      if (err.location) console.log(`    ${DIM}at ${err.location}${RESET}`);
    }
  }

  if (failedRequests.length > 0) {
    console.log(`\n${RED}${BOLD}Failed Network Requests (${failedRequests.length}):${RESET}`);
    for (const req of failedRequests) {
      console.log(`  ${RED}✖${RESET} ${req.url} (${req.failure})`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\n${YELLOW}${BOLD}Console Warnings (${warnings.length}):${RESET}`);
    for (const w of warnings) {
      console.log(`  ${YELLOW}▲${RESET} ${w.text}`);
    }
  }

  if (!hasErrors && warnings.length === 0) {
    console.log(`${GREEN}✔ Zero console errors, zero runtime exceptions, zero failed requests.${RESET}`);
  }

  console.log('------------------------------------------------------------');
  console.log(`Result: ${passed ? `${GREEN}${BOLD}PASSED${RESET}` : `${RED}${BOLD}FAILED${RESET}`}\n`);

  process.exit(passed ? 0 : 1);
}

// ============================================================================
// Command: SCREENSHOT
// ============================================================================
async function runScreenshot(url: string, args: Record<string, string | boolean>) {
  const outputPath = (args.output as string) || (args.o as string) || 'preview.png';
  const authPath = (args.auth as string) || '';
  const fullPage = args['full-page'] !== false;
  const waitSeconds = Number(args.wait || 0);
  const selector = (args.selector as string) || '';

  let width = 1280;
  let height = 800;
  if (typeof args.viewport === 'string' && args.viewport.includes('x')) {
    const [w, h] = args.viewport.split('x').map(Number);
    if (w && h) {
      width = w;
      height = h;
    }
  }

  const session = await createSession({ authPath, viewport: { width, height } });
  const { browser, page } = session;

  try {
    console.log(`🌐 Navigating to ${CYAN}${url}${RESET}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    if (waitSeconds > 0) {
      console.log(`⏳ Waiting ${waitSeconds}s for settling...`);
      await page.waitForTimeout(waitSeconds * 1000);
    }

    const resolvedOutput = path.resolve(outputPath);
    const parentDir = path.dirname(resolvedOutput);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    if (selector) {
      const element = await resolveLocator(page, selector);
      await element.screenshot({ path: resolvedOutput });
    } else {
      await page.screenshot({ path: resolvedOutput, fullPage });
    }

    console.log(`${GREEN}✔ Screenshot saved:${RESET} ${resolvedOutput}`);
    console.log(`   Embed link: ${CYAN}file://${resolvedOutput}${RESET}`);
  } finally {
    await browser.close();
  }
}

// ============================================================================
// Command: SNAPSHOT (Accessibility Tree)
// ============================================================================
async function runSnapshot(url: string, args: Record<string, string | boolean>) {
  const authPath = (args.auth as string) || '';
  const session = await createSession({ authPath });
  const { browser, page } = session;

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const snapshot = await page.accessibility.snapshot();

    console.log(`\n${BOLD}Accessibility Tree:${RESET} ${CYAN}${url}${RESET}`);
    console.log('------------------------------------------------------------');

    function printNode(node: any, depth = 0) {
      if (!node) return;
      const indent = '  '.repeat(depth);
      const role = node.role ? `[${node.role}]` : '';
      const name = node.name ? `"${node.name}"` : '';
      const value = node.value ? `value="${node.value}"` : '';
      console.log(`${indent}${CYAN}${role}${RESET} ${BOLD}${name}${RESET} ${value}`);
      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          printNode(child, depth + 1);
        }
      }
    }

    printNode(snapshot);
    console.log('------------------------------------------------------------\n');
  } finally {
    await browser.close();
  }
}

// ============================================================================
// Command: AUTH-SETUP (Clerk Test User & Ticket Link)
// ============================================================================
async function runAuthSetup(args: Record<string, string | boolean>) {
  loadEnv();

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error(`${RED}❌ Error: CLERK_SECRET_KEY is not defined in your environment or .env.local.${RESET}`);
    console.error('   Please run `pnpm dlx clerk whoami` or define CLERK_SECRET_KEY in .env.local.');
    process.exit(1);
  }

  const email = (args.email as string) || 'test-agent@example.com';
  const password = (args.password as string) || 'TestPassword123!';
  const firstName = (args.name as string)?.split(' ')[0] || 'Test';
  const lastName = (args.name as string)?.split(' ')[1] || 'Agent';
  const defaultUrl = (args.url as string) || getDefaultUrl();
  const saveSession = Boolean(args['save-session'] || args.s);
  const sessionPath =
    typeof args['save-session'] === 'string'
      ? (args['save-session'] as string)
      : path.resolve('playwright/.clerk/user.json');

  const clerkHeaders = {
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  };

  console.log(`🔍 Checking if test user '${email}' exists in Clerk...`);
  let userId: string | null = null;

  try {
    const searchRes = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
      { headers: clerkHeaders }
    );
    if (searchRes.ok) {
      const users = (await searchRes.json()) as any[];
      if (users.length > 0 && users[0]?.id) {
        userId = users[0].id;
        console.log(`   Found existing test user: ${userId}`);
      }
    }
  } catch (err) {
    console.warn(`   Notice: Could not search users: ${String(err)}`);
  }

  if (!userId) {
    console.log(`✨ Creating new test user '${email}' in Clerk...`);
    const createRes = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: clerkHeaders,
      body: JSON.stringify({
        email_address: [email],
        first_name: firstName,
        last_name: lastName,
        password,
        skip_password_checks: true,
        skip_password_requirement: true,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error(`${RED}❌ Failed to create test user: ${createRes.status} ${errText}${RESET}`);
      process.exit(1);
    }

    const newUser = (await createRes.json()) as any;
    userId = newUser.id;
    console.log(`   Created test user: ${userId}`);
  }

  console.log(`🔑 Generating 24-hr sign-in ticket token for ${userId}...`);
  const tokenRes = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: clerkHeaders,
    body: JSON.stringify({
      user_id: userId,
      expires_in_seconds: 86400,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error(`${RED}❌ Failed to create sign-in token: ${tokenRes.status} ${errText}${RESET}`);
    process.exit(1);
  }

  const tokenData = (await tokenRes.json()) as any;
  const ticketToken = tokenData.token;
  const signInUrl = `${defaultUrl}/sign-in?__clerk_ticket=${ticketToken}`;

  console.log('\n============================================================');
  console.log(`${GREEN}${BOLD}✅ Clerk Test User Ready!${RESET}`);
  console.log(`   User ID : ${userId}`);
  console.log(`   Email   : ${email}`);
  console.log('------------------------------------------------------------');
  console.log(`${BOLD}🔗 Single-Use Sign-In Ticket URL:${RESET}`);
  console.log(`   ${CYAN}${signInUrl}${RESET}`);
  console.log('------------------------------------------------------------');

  if (saveSession) {
    try {
      console.log('🎭 Launching headless browser to capture authenticated session...');
      const session = await createSession({});
      const { browser, page } = session;

      await page.goto(signInUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const stateDir = path.dirname(path.resolve(sessionPath));
      if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });

      await page.context().storageState({ path: sessionPath });
      await browser.close();

      console.log(`${GREEN}💾 Saved session storageState:${RESET} ${sessionPath}`);
      console.log('   Use in Playwright CLI:');
      console.log(`   ${DIM}--auth ${sessionPath}${RESET}`);
    } catch (err) {
      console.warn(`${YELLOW}⚠️  Could not automatically save storageState: ${String(err)}${RESET}`);
    }
  }

  console.log('============================================================\n');
}

// ============================================================================
// CLI Argument Parsing (Sequential Actions + Global Options)
// ============================================================================
function parseArgv(argv: string[]) {
  const positionals: string[] = [];
  const options: Record<string, string | boolean> = {};
  const actions: ActionStep[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    // Chained action flags
    if (arg === '--goto' || arg === '--nav') {
      actions.push({ type: 'goto', value: argv[++i] });
    } else if (arg === '--click') {
      actions.push({ type: 'click', selector: argv[++i] });
    } else if (arg === '--fill') {
      const paramVal = argv[++i] || '';
      const [sel, val] = paramVal.includes(',') ? paramVal.split(/,(.+)/) : [paramVal, ''];
      actions.push({ type: 'fill', selector: sel, param: val });
    } else if (arg === '--type') {
      const paramVal = argv[++i] || '';
      const [sel, val] = paramVal.includes(',') ? paramVal.split(/,(.+)/) : [paramVal, ''];
      actions.push({ type: 'type', selector: sel, param: val });
    } else if (arg === '--press') {
      actions.push({ type: 'press', value: argv[++i] });
    } else if (arg === '--check') {
      actions.push({ type: 'check', selector: argv[++i] });
    } else if (arg === '--uncheck') {
      actions.push({ type: 'uncheck', selector: argv[++i] });
    } else if (arg === '--select') {
      const paramVal = argv[++i] || '';
      const [sel, val] = paramVal.includes(',') ? paramVal.split(/,(.+)/) : [paramVal, ''];
      actions.push({ type: 'select', selector: sel, param: val });
    } else if (arg === '--wait-for') {
      actions.push({ type: 'waitFor', value: argv[++i] });
    } else if (arg === '--assert-text') {
      actions.push({ type: 'assertText', value: argv[++i] });
    } else if (arg === '--assert-visible') {
      actions.push({ type: 'assertVisible', selector: argv[++i] });
    } else if (arg === '--wait') {
      actions.push({ type: 'wait', value: argv[++i] });
    } else if (arg === '--screenshot') {
      actions.push({ type: 'screenshot', value: argv[++i] });
    } else if (arg === '--eval') {
      actions.push({ type: 'eval', value: argv[++i] });
    }
    // Generic options
    else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key.includes('=')) {
        const [k, v] = key.split('=');
        options[k] = v;
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        options[key] = argv[++i];
      } else {
        options[key] = true;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        options[key] = argv[++i];
      } else {
        options[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }

  return { positionals, options, actions };
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const { positionals, options, actions } = parseArgv(rawArgs);

  if (options.help || options.h || (positionals.length === 0 && actions.length === 0)) {
    showHelp();
    process.exit(0);
  }

  const command = positionals[0] || (actions.length > 0 ? 'run' : '');

  try {
    switch (command) {
      case 'create':
      case 'add': {
        const url = positionals[1] || getDefaultUrl();
        await runCompoundCreate(url, options);
        break;
      }
      case 'form':
      case 'submit-form': {
        const url = positionals[1] || getDefaultUrl();
        await runCompoundForm(url, options);
        break;
      }
      case 'assert': {
        const url = positionals[1] || getDefaultUrl();
        await runCompoundAssert(url, options);
        break;
      }
      case 'smoke': {
        const url = positionals[1] || getDefaultUrl();
        await runCompoundSmoke(url, options);
        break;
      }
      case 'run':
        await runChained(actions, options);
        break;
      case 'exec': {
        const codeOrFile = positionals.slice(1).join(' ') || (options.code as string);
        await runExec(codeOrFile, options);
        break;
      }
      case 'click': {
        const url = positionals[1] || getDefaultUrl();
        const selector = positionals[2];
        await runClick(url, selector, options);
        break;
      }
      case 'fill': {
        const url = positionals[1] || getDefaultUrl();
        const selector = positionals[2];
        const val = positionals.slice(3).join(' ');
        await runFill(url, selector, val, options);
        break;
      }
      case 'probe':
      case 'console': {
        const targetUrl = positionals[1] || getDefaultUrl();
        await runProbe(targetUrl, options);
        break;
      }
      case 'screenshot':
      case 'shot': {
        const targetUrl = positionals[1] || getDefaultUrl();
        if (positionals[2]) options.output = positionals[2];
        await runScreenshot(targetUrl, options);
        break;
      }
      case 'snapshot': {
        const targetUrl = positionals[1] || getDefaultUrl();
        await runSnapshot(targetUrl, options);
        break;
      }
      case 'auth-setup':
      case 'test-user':
        await runAuthSetup(options);
        break;
      default:
        console.error(`${RED}Unknown command '${command}'.${RESET}`);
        showHelp();
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`\n${RED}${BOLD}Fatal Error:${RESET} ${err.message || String(err)}\n`);
    process.exit(1);
  }
}

main();
