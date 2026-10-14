---
name: playwright
description: Interactively beta-test web applications, click elements, fill forms, execute compound operations (create, form, assert, smoke), run arbitrary Playwright scripts, inspect live browser console logs and errors, capture high-definition screenshots, and verify Clerk authentication flows using the bundled Playwright CLI script (skills/playwright/scripts/playwright-cli.ts). Use when testing local dev servers, validating UI workflows, capturing visual proof, or debugging client-side runtime errors.
---

# Ergonomic Browser Automation & Compound Testing (`playwright`)

This skill defines the standard procedure for agents and developers to perform **manual beta testing**, **browser automation**, **compound user flow testing**, **visual inspection**, **console debugging**, and **authenticated verification** using the bundled **Playwright CLI script** (`skills/playwright/scripts/playwright-cli.ts`).

Rather than relying on a persistent MCP daemon that can lock browser sessions or require environment restarts, `overskill` provides an ergonomic, standalone CLI utility designed with:
1. **Smart User-Centric Locators**: Auto-detects buttons, links, inputs, and labels by natural text (e.g. `"Add Item"` or `"Email"`), role, placeholder, or CSS.
2. **Helpful Failure Diagnostics**: If a selector fails, the CLI scans the live DOM and prints all visible interactive buttons, inputs, and links so the agent can self-correct immediately, while automatically saving a failure screenshot.
3. **Ergonomic Compound Workflows**: Single-line commands for frequent operations:
   - `create`: Fills input, submits, asserts real-time render, and captures screenshot.
   - `form`: Fills multiple fields and submits in one pass.
   - `assert`: Runs multi-condition page assertions (has-text, visible, count, missing).
   - `smoke`: Multi-route health probe and screenshot gallery.
   - `run`: Multi-step action chains (`--click`, `--fill`, `--press`, `--wait-for`, `--screenshot`).
4. **Full Script Flexibility (`exec`)**: Full access to `(page, context, browser)` for executing arbitrary Playwright code or external `.ts` test scripts.

---

## 1. Script Location & Execution

The CLI is located directly inside this skill:

```bash
# Executable via Node:
node skills/playwright/scripts/playwright-cli.ts <command> [options]

# Or executed directly:
./skills/playwright/scripts/playwright-cli.ts <command> [options]
```

---

## 2. Smart Locators Reference

You do not need to guess fragile CSS classes. The CLI automatically resolves:

| Target String | Resolution Strategy | Example |
| :--- | :--- | :--- |
| **Plain Text** | Matches button, link, label, or text with that name | `"Add Task"`, `"Sign In"` |
| `role=<role>[name='...']` | Accessible role locator | `"role=button[name='Submit']"` |
| `placeholder='...'` | Accessible input placeholder | `"placeholder='Add a new item...'"` |
| `label='...'` | Associated form `<label>` text | `"label='Email Address'"` |
| `testid='...'` | Playwright test ID attribute | `"testid='task-item'"` |
| `text='...'` | Substring text match | `"text='Congratulations'"` |
| **CSS Selector** | Standard DOM selector | `"button.primary"`, `"#submit"` |

> [!TIP]
> **Self-Healing Locator Diagnostics**:
> If a button or input cannot be found, the CLI will output:
> ```text
> ❌ Action Failed: Could not perform click element 'Add Task'
> 💡 Visible interactive elements on page right now:
>    • Button: "Add"
>    • Button: "Clear Completed"
>    • Input: placeholder="Add a new item..."
>    • Link: "Sign In"
> 📸 Saved failure screenshot: .playwright/failures/failure-1718000000.png
> ```
> This allows the agent to immediately spot the correct element name without guessing.

---

## 3. Ergonomic Compound Commands

### A. Compound `create` (Add Item + Verify Real-Time Sync)

Fills an input, submits, waits for the new item to appear (confirming Convex WebSocket reactivity), and saves visual proof in a single command:

```bash
node skills/playwright/scripts/playwright-cli.ts create https://my-app.localhost \
  --input "Add a new item..." \
  --value "Buy fresh sourdough" \
  --submit "Add" \
  --expect "Buy fresh sourdough" \
  -o /home/bryant/.gemini/antigravity/brain/<conversation-id>/task-created.png
```

---

### B. Compound `form` (Multi-Field Submission)

Fill multiple inputs and submit in one pass:

```bash
node skills/playwright/scripts/playwright-cli.ts form https://my-app.localhost/sign-in \
  --fields "email=test-agent@example.com, password=TestPassword123!" \
  --submit "Sign In" \
  --expect "Dashboard" \
  -o /home/bryant/.gemini/antigravity/brain/<conversation-id>/logged-in.png
```

---

### C. Compound `assert` (Multi-Condition Page Checks)

Assert that required elements and text are present, and errors are absent:

```bash
node skills/playwright/scripts/playwright-cli.ts assert https://my-app.localhost \
  --has-text "My Recipe Box" \
  --missing-text "500 Internal Error" \
  --visible "button:has-text('Add')" \
  --count "ul > li, 3"
```

Exits with code `0` if all assertions pass, or code `1` with a failure screenshot if any condition fails.

---

### D. Compound `smoke` (Multi-Route Health & Gallery)

Verify multiple routes across the application in one command:

```bash
node skills/playwright/scripts/playwright-cli.ts smoke https://my-app.localhost \
  --routes "/, /sign-in, /pricing" \
  --out-dir .playwright/smoke
```

---

### E. Chained Action Sequences (`run`)

Chain arbitrary steps in a single browser session:

```bash
node skills/playwright/scripts/playwright-cli.ts run \
  --goto https://my-app.localhost \
  --click "button:has-text('Add Item')" \
  --fill "input[placeholder='New item...'],Buy oat milk" \
  --press Enter \
  --assert-text "Buy oat milk" \
  --screenshot /home/bryant/.gemini/antigravity/brain/<conversation-id>/item-added.png
```

---

### F. Arbitrary Playwright Code Execution (`exec`)

Execute raw Playwright code when advanced logic (loops, canvas, custom evaluations) is required:

```bash
node skills/playwright/scripts/playwright-cli.ts exec "
  await page.goto('https://my-app.localhost');
  const items = page.locator('ul > li');
  console.log('Count:', await items.count());

  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByPlaceholder('Add a new item...').fill('Learn Svelte 5');
  await page.keyboard.press('Enter');
  await page.waitForSelector('text=Learn Svelte 5');
  await page.screenshot({ path: 'preview.png', fullPage: true });
"
```

---

## 4. Authenticated Testing & Test User Accounts (Clerk)

When beta-testing pages protected by authentication (e.g. `<SignedIn>` / `<SignedOut>`), bypass bot protection, MFA, and OTP emails using `auth-setup`:

```bash
node skills/playwright/scripts/playwright-cli.ts auth-setup --save-session
```

*Under the hood, this command:*
1. Reads `CLERK_SECRET_KEY` from `.env.local`.
2. Checks if `test-agent@example.com` exists in Clerk; creates it if missing.
3. Generates a 24-hour single-use sign-in ticket token via `POST /v1/sign_in_tokens`.
4. Launches headless Chromium to consume the ticket and saves the authenticated session to `playwright/.clerk/user.json` (`storageState`).

Now run any compound command pre-authenticated using `--auth`:
```bash
node skills/playwright/scripts/playwright-cli.ts create https://my-app.localhost/dashboard \
  --auth playwright/.clerk/user.json \
  --input "Add a new item..." \
  --value "Protected Task" \
  --submit "Add" \
  -o /home/bryant/.gemini/antigravity/brain/<conversation-id>/protected-task.png
```

---

## 5. Summary of Commands

| Command | Best Used For |
| :--- | :--- |
| `create <url>` | Adding items, real-time sync checks, creating records |
| `form <url>` | Multi-input submissions, registration, profile forms |
| `assert <url>` | Multi-condition assertions, smoke gates |
| `smoke <url>` | Route crawling, screenshot gallery generation |
| `run [flags...]` | Custom multi-step interaction chains |
| `exec <code>` | Custom Playwright scripts and complex page interactions |
| `probe <url>` | Quick console health and runtime exception check |
| `screenshot <url>` | On-demand full-page visual proof |
| `snapshot <url>` | Text-based accessibility tree inspection |
| `auth-setup` | Clerk test user generation & ticket token sign-in |
