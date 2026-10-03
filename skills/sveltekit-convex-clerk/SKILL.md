---
name: sveltekit-convex-clerk
description: Scaffolds, configures, wires, creates a GitHub repository for, and deploys full-stack SvelteKit applications with modern Svelte 5 runes, Vite build engine, Tailwind CSS v4, shadcn-svelte, strict pnpm, Biome linting, Vitest unit testing, Playwright E2E testing, Convex reactive database, Clerk authentication, and Vercel hosting. Use when creating, scaffolding, or deploying a new SvelteKit project with Convex and Clerk.
---

# SvelteKit Full-Stack Pipeline (Vite + Tailwind v4 + Convex + Clerk + Biome + Vitest + Playwright + Vercel)

This skill provides an automated, end-to-end recipe for scaffolding, wiring, and deploying a modern full-stack web application. It enforces strict architectural and tooling constraints to guarantee speed, reactivity, code quality, automated testing, and reliable deployments.

## Architecture & Technology Stack

| Layer | Technology | Key Capabilities / Rules |
| :--- | :--- | :--- |
| **Toolchain & CLI Runtime** | [`mise`](https://mise.jdx.dev) (Recommended) | Fast toolchain manager in `~/.local/bin`. Installs and manages `node` (LTS), `pnpm`, `gh`, and `caddy` in user space without sudo. |
| **Local Reverse Proxy & Domains** | [Caddy](https://caddyserver.com) (`Caddyfile`) | **MANDATORY**: Maps `<project-name>.localhost` and subdomains `<endpoint>.<project-name>.localhost` to local services, eliminating port contention and cookie conflicts. |
| **Framework & UI** | [SvelteKit](https://svelte.dev) + TypeScript | Modern Svelte 5 runes (`$state`, `$derived`, `$effect`, `Snippet`, `{@render}`), minimal template. |
| **Build Engine & Bundler** | [Vite](https://vite.dev) (`vite.config.ts`) | Instant HMR dev server, official `@tailwindcss/vite` compiler plugin, Vitest runner, production SSR bundling. |
| **Styling & UI Components** | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn-svelte](https://shadcn-svelte.com) | `@tailwindcss/vite`, CSS-first design system, accessible Bits UI component primitives, dark mode ready. |
| **Package Manager** | Strict [`pnpm`](https://pnpm.io) | Fast, space-efficient, deterministic. **FORBIDDEN: NEVER use `npx`, `npm`, `yarn`, or `bun`. Use ONLY `pnpm dlx` for ad-hoc execution and `pnpm <cmd>` for project packages.** |
| **Code Quality** | [Biome](https://biomejs.dev) (`@biomejs/biome`) | Unified Rust-powered linter and formatter. **STRICTLY NO** ESLint or Prettier. |
| **Testing** | [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) | Unit, component, and in-memory Convex testing via Vitest; robust E2E testing via Playwright. |
| **Database & Realtime** | [Convex](https://convex.dev) (`convex`, `convex-svelte`) | Real-time reactive queries over WebSocket, TypeScript schema, server functions. |
| **Authentication** | [Clerk](https://clerk.com) (`svelte-clerk`) | Secure auth, JWT session templates, reactive runes, prebuilt UI controls. |
| **VCS & Hosting** | [GitHub CLI](https://cli.github.com) + [Vercel](https://vercel.com) | Automated repository creation (`gh repo create`) and headless zero-config deployments (`vercel --prod`). |

---

## Non-SWE Friendly Principles & Agent Communication

When executing this skill for non-software engineers, solo creators, or beginners, you MUST adhere to these conversational rules:

1. **Zero Jargon & No Raw Stack Traces**:
   - **Never** paste raw compiler errors, TypeScript codes (e.g. `TS2322`), or stack traces into the chat.
   - Fix issues silently and autonomously. If user input is needed, speak in plain, reassuring English (*"I noticed a small layout alignment issue while testing your page, and I'm updating it now."*).
2. **Interactive Idea-to-App Modeling**:
   - Do **NOT** assume the user only wants a generic todo list.
   - Ask them in plain English what their app is about, and automatically customize the Convex schema, mutations, queries, and Svelte UI for their specific idea (recipes, book logs, trip planners, habits, etc.).
3. **Click-by-Click Guidance for Keys**:
   - Guide the user step-by-step with direct clickable links when setting up Clerk and Convex. Never use terms like "JWT issuer domain" without explaining where to click.
4. **Milestone Celebrations & Clickable Links**:
   - Always present a clickable local preview link using Caddy: `http://<project-name>.localhost` (with subdomains `<endpoint>.<project-name>.localhost` for auxiliary endpoints), keeping all services tidy without port collisions.
   - Always present the live mobile-friendly Vercel production link: `https://<app>.vercel.app` with instructions on how to test logging in on their phone.
5. **Proactive Toolchain Setup Offer with `mise`**:
   - If `node`, `pnpm`, `gh`, or `caddy` are missing, never fail or leave the user stranded with a missing command error.
   - Gently offer to set up the entire toolchain using `mise` in `~/.local/bin` (`node@lts`, `pnpm@latest`, `gh@latest`, `caddy@latest` — no sudo or admin privileges required).
6. **Strictly Forbid `npx` (Only `pnpm dlx`)**:
   - **Never** invoke or suggest `npx`. All one-off CLIs must run via `pnpm dlx` (e.g., `pnpm dlx sv create`, `pnpm dlx vercel whoami`, `pnpm dlx convex dev`). Project packages run via `pnpm <command>`.
7. **Mandatory Caddy Local Routing (`<project-name>.localhost` & Subdomains)**:
   - **Require Caddy** for local development. Every project **must** configure a local `Caddyfile`.
   - The primary application endpoint must be served at `http://<project-name>.localhost`.
   - Auxiliary services (e.g. backend API, preview server, websocket server) **must** use dedicated subdomains: `http://<endpoint>.<project-name>.localhost` (e.g. `api.<project-name>.localhost`, `preview.<project-name>.localhost`).
   - Under RFC 6761, `*.localhost` domains natively resolve to loopback (`127.0.0.1`) without editing `/etc/hosts` or needing elevated privileges.
   - Never expose raw colliding port numbers (`:5173`, `:5174`, `:3000`) or rely on raw `localhost:<port>` where cookies and local storage collide across different apps.

---

## Live Documentation Freshness Protocol (MANDATORY)

To prevent code staleness and API drift across fast-moving frameworks (Svelte 5, Tailwind CSS v4, Convex, Clerk), agents **MUST** actively consult official machine-readable agent documentation endpoints (`llms.txt`, markdown documentation feeds, and official skills) rather than relying solely on training weights or static memory.

### Relationship Between Templates & Live Documentation
- **Templates in `templates/`**: Provide proven baseline scaffolding and fail-safe fixes for known environment gotchas (e.g. Playwright dev server reuse preventing `500 ENOENT: stat $types.d.ts`, Tailwind v4 `hsl(...)` color wrappers preventing Clerk modal transparency, and strict `pnpm dlx` enforcement). Use them for project initialization.
- **Live Upstream Documentation**: The **authoritative source of truth** for all project-specific schema designs, function signatures, Svelte 5 runes, and service integrations. Before implementing novel features, complex queries, or custom auth logic, fetch the relevant live endpoint via `read_url_content` or HTTP GET.

### Official Upstream Agent Endpoints

| Framework / Service | Live Endpoint / Resource | Purpose & When to Fetch |
| :--- | :--- | :--- |
| **Svelte 5 Runes & Core** | [`https://svelte.dev/docs/svelte/llms.txt`](https://svelte.dev/docs/svelte/llms.txt) | Fetch before authoring component reactivity (`$state`, `$derived`, `$effect`, snippets). Never use deprecated Svelte 4 syntax (`export let`, `$:`, `<slot />`). |
| **SvelteKit** | [`https://svelte.dev/docs/kit/llms.txt`](https://svelte.dev/docs/kit/llms.txt) | Fetch when writing server loaders (`+layout.server.ts`, `+page.server.ts`), form actions, server hooks, or routing logic. |
| **Svelte CLI (`sv`)** | [`https://svelte.dev/docs/cli/llms.txt`](https://svelte.dev/docs/cli/llms.txt) | Fetch for official `sv add` and `sv create` flags and options. |
| **Convex Database & API** | [`https://docs.convex.dev/llms.txt`](https://docs.convex.dev/llms.txt)<br>Append `.md` to any doc URL (e.g. `https://docs.convex.dev/<path>.md`) | Fetch the index, then retrieve specific topic markdown (e.g. `https://docs.convex.dev/database/reading-data/indexes.md`, `https://docs.convex.dev/client/svelte/overview.md`). |
| **Convex Agent Skills** | [`https://github.com/get-convex/agent-skills`](https://github.com/get-convex/agent-skills) | Official Convex skills for agents (`/convex-docs`, `/convex-authz`, `/convex-design`, `/convex-test`, `/convex-reviewer`). |
| **Clerk Single-File Runbook** | [`https://clerk.com/SKILL.md`](https://clerk.com/SKILL.md) | Canonical single-file agent guide for wiring Clerk SDKs, auth flows, and configurations. |
| **Clerk Skills Repository** | [`https://github.com/clerk/skills`](https://github.com/clerk/skills) | Official modular Clerk skills (`clerk-setup`, `clerk-cli`, `clerk-custom-ui`, `clerk-backend-api`). |
| **Vercel** | [`https://vercel.com/docs/llms.txt`](https://vercel.com/docs/llms.txt) | Machine-readable index for Vercel CLI, deployment configurations, and project settings. |
| **shadcn-svelte** | [`https://shadcn-svelte.com/docs`](https://shadcn-svelte.com/docs) | Bits UI primitives, component additions via `pnpm dlx shadcn-svelte@latest add <component>`. |
| **Biome Standards** | [`https://biomejs.dev/`](https://biomejs.dev/) | Biome linter, formatter, and configuration reference. |
| **Mise Documentation** | [`https://mise.jdx.dev`](https://mise.jdx.dev) | Polyglot toolchain runtime manager for `~/.local/bin`. |


---

## Execution Workflow

```mermaid
flowchart TD
    S1["1. Toolchain & Idea Discovery"] --> S2["2. Scaffolding Automation (sv + Tailwind v4 + Biome)"]
    S2 --> S3["3. Testing Setup (Vitest + Playwright)"]
    S3 --> S4["4. UI Components Setup (shadcn-svelte)"]
    S4 --> S5["5. Backend & Custom Schema (Convex)"]
    S5 --> S6["6. Reactive UI & Auth Wiring (Clerk + Svelte 5)"]
    S6 --> S7["7. Local Verification & Visual Proof (Screenshots + GIF)"]
    S7 --> S8["8. Remote GitHub Repo Creation & Licensing"]
    S8 --> S9["9. Production Deployment & Live Phone Link (Vercel)"]
```

---

### Step 1: System Prerequisites & Idea Discovery

#### 1. Toolchain & CLI Availability Check (Node, pnpm, gh, caddy with mise)
Verify that the core runtime tools (`node`, `pnpm`, `gh`, `caddy`) are installed on the host:

```bash
# Check presence of required toolchains
command -v node
command -v pnpm
command -v gh
command -v caddy
```

> [!IMPORTANT]
> **Proactive Toolchain Setup Offer with `mise`**:
> If any of these tools (`node`, `pnpm`, `gh`, or `caddy`) are missing, the agent MUST offer to set up the toolchain automatically using `mise` in `~/.local/bin`:
> > *"I noticed some required tools ([missing tools, e.g. Node.js, pnpm, GitHub CLI, or Caddy]) aren't installed yet. Would you like me to install them for you automatically using **mise** in `~/.local/bin`? It's fast, doesn't require administrator/sudo access, and keeps everything cleanly in your user directory."*
>
> If the user accepts (or in autonomous agent mode), execute:
> ```bash
> # 1. Install mise to ~/.local/bin if not already present
> if ! command -v mise >/dev/null 2>&1 && [ ! -x "$HOME/.local/bin/mise" ]; then
>   curl -fsSL https://mise.run | sh
> fi
>
> # 2. Ensure ~/.local/bin and mise shims are available in PATH
> export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"
>
> # 3. Install required toolchain (Node.js LTS, pnpm, GitHub CLI, and Caddy)
> "$HOME/.local/bin/mise" use --global node@lts pnpm@latest gh@latest caddy@latest
>
> # 4. Activate mise for the current shell session
> eval "$("$HOME/.local/bin/mise" activate bash)"
> ```

#### 2. Verify Developer CLI Authentication States
Before creating any files, verify that local developer CLI tools are authenticated and available.
**STRICT RULE: NEVER USE `npx`. ALWAYS USE `pnpm dlx`!**

```bash
# 1. Verify GitHub CLI authentication
gh auth status

# 2. Verify pnpm is installed and check version
pnpm --version

# 3. Verify Vercel CLI is authenticated (FORBIDDEN: NEVER use npx vercel)
pnpm dlx vercel whoami

# 4. Verify Convex CLI is authenticated (FORBIDDEN: NEVER use npx convex)
pnpm dlx convex whoami

# 5. Verify Clerk CLI is authenticated (FORBIDDEN: NEVER use npx clerk)
pnpm dlx clerk whoami
```

> [!IMPORTANT]
> If any tool reports unauthenticated status, assist the user calmly:
> - For GitHub: Run `gh auth login`
> - For Vercel: Run `pnpm dlx vercel login` (FORBIDDEN: never `npx vercel login`)
> - For Convex: Run `pnpm dlx convex login` (FORBIDDEN: never `npx convex login`)
> - For Clerk: Run `pnpm dlx clerk auth login` (FORBIDDEN: never `npx clerk login`)

#### 3. The Idea Interview (For Non-SWEs & Creators)
Ask the user in plain English what they would like to build:
> *"What kind of app would you like to build today, and what kinds of things do you want people to save, view, or track?"*

Common examples to inspire them:
- **Recipe Box**: Save family recipes, ingredients, and cooking times.
- **Reading Journal**: Track books, ratings, favorites, and notes.
- **Habit or Workout Tracker**: Daily logs, checklists, and streaks.
- **Trip Planner**: Itineraries, packing lists, and locations.

**Agent Action**: Take their plain-English description and design the Convex schema, mutations, queries, and Svelte UI for *their specific idea* rather than just a generic todo list!

---

### Step 2: Scaffolding Automation (SvelteKit + Tailwind CSS v4 + Vitest + Playwright)

Initialize a minimal SvelteKit project with TypeScript using Svelte's official CLI (`sv`) via `pnpm dlx`, and install official add-ons for **Tailwind CSS v4**, **Vitest**, and **Playwright**:

```bash
# 1. Run SvelteKit scaffolding inside the project root
pnpm dlx sv create . --template minimal --types ts --no-add-ons

# 2. Add Tailwind CSS v4, Vitest, and Playwright using official sv add-ons
pnpm dlx sv add tailwindcss vitest="usages:unit,component" playwright --install pnpm

# 3. Install Playwright browser engines
pnpm exec playwright install --with-deps chromium
```

> [!CRITICAL]
> **Playwright & Dev Server Lifecycle Configuration (Preventing ENOENT 500 Crashes)**:
> Default starter templates configure Playwright with `webServer: { command: 'pnpm run build && pnpm run preview', port: 4173 }`.
> When an agent or developer runs tests while `vite dev` is active in the background, `vite build` wipes `.svelte-kit/output` and unlinks `.svelte-kit/types/` and `.svelte-kit/generated/`. The active `vite dev` server crashes with `500 ENOENT: stat $types.d.ts`.
>
> **Mandatory Architecture Rule**:
> 1. Overwrite `playwright.config.ts` to reuse the active dev server, bind to dynamic `PORT`, and support local domain:
>    ```ts
>    // playwright.config.ts
>    import { defineConfig, devices } from '@playwright/test';
>
>    const port = Number(process.env.PORT) || 5173;
>    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ||
>      (process.env.LOCAL_DOMAIN ? `http://${process.env.LOCAL_DOMAIN}` : `http://localhost:${port}`);
>
>    export default defineConfig({
>      testDir: './e2e',
>      webServer: {
>        command: 'pnpm run dev',
>        url: baseURL,
>        reuseExistingServer: !process.env.CI,
>      },
>      use: {
>        baseURL,
>        trace: 'on-first-retry',
>      },
>      projects: [
>        {
>          name: 'chromium',
>          use: { ...devices['Desktop Chrome'] },
>        },
>      ],
>    });
>    ```
> 2. Ensure `vite.config.ts` includes `strictPort: true` to prevent port drift, and `allowedHosts: true` to allow Caddy proxying:
>    ```ts
>    // vite.config.ts
>    import { sveltekit } from '@sveltejs/kit/vite';
>    import tailwindcss from '@tailwindcss/vite';
>    import { defineConfig } from 'vite';
>
>    const port = Number(process.env.PORT) || 5173;
>
>    export default defineConfig({
>      plugins: [tailwindcss(), sveltekit()],
>      server: {
>        port,
>        strictPort: true,
>        allowedHosts: true, // Allow Caddy reverse proxy via *.localhost (e.g. <project-name>.localhost)
>      },
>    });
>    ```
> *Result*: Instant test execution (<50ms startup), zero redundant rebuilds, zero filesystem collisions, and multi-agent isolation via `PORT=XXXX`.

#### 3. Mandatory Caddy Configuration (`<project-name>.localhost` & Subdomains)

All local development in `overskill` requires Caddy to serve the app under a base name of `<project-name>.localhost` and subdomains `<endpoint>.<project-name>.localhost`, completely eliminating port contention and cookie conflicts.

1. **Generate `Caddyfile`**:
   Create `Caddyfile` in the project root:
   ```caddy
   # Primary application frontend
   http://<project-name>.localhost, <project-name>.localhost {
       reverse_proxy localhost:5173
   }

   # Auxiliary backend API endpoint (if applicable)
   http://api.<project-name>.localhost, api.<project-name>.localhost {
       reverse_proxy localhost:3000
   }

   # Production build preview endpoint
   http://preview.<project-name>.localhost, preview.<project-name>.localhost {
       reverse_proxy localhost:4173
   }
   ```

2. **Native RFC 6761 Loopback (Zero Sudo / No `/etc/hosts` Editing)**:
   Under RFC 6761, all `*.localhost` domains and subdomains automatically resolve to `127.0.0.1` and `::1` across all modern web browsers and OS network resolvers. **No `/etc/hosts` changes or administrator/sudo privileges are required.**

3. **Start or Reload Caddy in the Background**:
   ```bash
   caddy start
   ```

Ensure no legacy configuration files or dependencies were introduced. If any `.eslintrc*`, `.prettier*`, or `eslint*` dependencies exist, remove them immediately:

```bash
# Verify no eslint or prettier dependencies exist
rm -f .eslintrc* .prettier* prettier.config.* eslint.config.*
```

---

### Step 3: Tooling & Code Quality with Biome

Install Biome as a development dependency and configure unified linting and formatting:

```bash
# 1. Install Biome
pnpm add -D @biomejs/biome

# 2. Initialize Biome configuration
pnpm dlx @biomejs/biome init
```

#### Configure `biome.json`

Overwrite `biome.json` with recommended rules tailored for SvelteKit and TypeScript:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": false,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": [
      ".svelte-kit/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      ".convex/**",
      "src/convex/_generated/**",
      "convex/_generated/**"
    ]
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "semicolons": "always",
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "warn"
      },
      "style": {
        "useConst": "error"
      }
    }
  }
}
```

#### Add Scripts to `package.json`

Add the following unified scripts to `package.json`:

```json
"scripts": {
  "dev": "vite dev",
  "build": "vite build",
  "preview": "vite preview",
  "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json && biome check .",
  "lint": "biome lint .",
  "format": "biome format --write .",
  "lint:fix": "biome check --write .",
  "test": "pnpm run test:unit && pnpm run test:e2e",
  "test:unit": "vitest run",
  "test:e2e": "playwright test"
}
```

#### Baseline Test Setup

Ensure baseline test files are in place so continuous testing passes immediately:

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
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
  ```

---

### Step 4: Backend & Database Wiring (Convex)

Install Convex and the reactive Svelte client:

```bash
pnpm add convex convex-svelte svelte-clerk
```

> [!TIP]
> **Live Convex Documentation Lookup (Prevent Stale APIs)**:
> When designing custom schemas, indexing, file storage, full-text search, or scheduled crons beyond the starter template, fetch the relevant Convex guide directly in markdown format by appending `.md` to the URL via `read_url_content` or HTTP GET:
> - Indexes & compound queries: `https://docs.convex.dev/database/reading-data/indexes.md`
> - Svelte client guide: `https://docs.convex.dev/client/svelte/overview.md`
> - Auth & Clerk guide: `https://docs.convex.dev/auth/clerk.md`
> - Best practices: `https://docs.convex.dev/understanding/best-practices.md`
> - Complete index: `https://docs.convex.dev/llms.txt`
> - Official Agent Skills: [`get-convex/agent-skills`](https://github.com/get-convex/agent-skills)

#### 1. Configure Convex Auth: `convex/auth.config.ts`

Create `convex/auth.config.ts` to validate Clerk JWT session tokens against your Clerk Frontend API URL:

```ts
import type { AuthConfig } from 'convex/server';

export default {
  providers: [
    {
      // Matches the Frontend API URL configured in Clerk Dashboard -> Convex Integration
      domain: process.env.CLERK_FRONTEND_API_URL || process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig;
```

#### 2. Define Data Schema: `convex/schema.ts`

Create `convex/schema.ts` with user-scoped relational tables and compound indexes:

```ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    userId: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_user_completed', ['userId', 'isCompleted']),
});
```

> [!IMPORTANT]
> **Defense in Depth & Compound Indexing**:
> 1. **Defense in Depth**: Authorization checks must never exist solely in frontend Svelte routes. Every Convex mutation (`create`, `toggle`, `remove`, `clearCompleted`) and query (`list`) must independently verify `identity && isEmailAuthorized(identity.email)`.
> 2. **Compound Indexing for State Queries**: Rather than filtering completed tasks in JavaScript after fetching all user records, add compound indexes (`.index('by_user_completed', ['userId', 'isCompleted'])`) to execute index-bounded queries (`q.eq('userId', id).eq('isCompleted', true)`).

#### 3. Implement Authenticated Functions: `convex/tasks.ts`

Create `convex/tasks.ts` verifying user identity via `ctx.auth.getUserIdentity()`:

```ts
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query('tasks')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
  },
});

export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated: Must be logged in to create tasks');
    }
    return await ctx.db.insert('tasks', {
      text: args.text,
      isCompleted: false,
      userId: identity.subject,
    });
  },
});

export const toggle = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== identity.subject) {
      throw new Error('Task not found or unauthorized');
    }
    await ctx.db.patch(args.id, { isCompleted: !task.isCompleted });
  },
});

export const remove = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    const task = await ctx.db.get(args.id);
    if (!task || task.userId !== identity.subject) {
      throw new Error('Task not found or unauthorized');
    }
    await ctx.db.delete(args.id);
  },
});

export const clearCompleted = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated');
    }
    // Efficiently query using the compound index instead of in-memory JS filtering
    const completedTasks = await ctx.db
      .query('tasks')
      .withIndex('by_user_completed', (q) =>
        q.eq('userId', identity.subject).eq('isCompleted', true)
      )
      .collect();

    for (const task of completedTasks) {
      await ctx.db.delete(task._id);
    }
  },
});
```

---

### Step 5: Authentication & Frontend Wiring (Clerk + Convex + Svelte 5)

> [!TIP]
> **Live Svelte 5, SvelteKit & Clerk Documentation Lookup**:
> Always ensure UI components use modern Svelte 5 runes rather than deprecated Svelte 4 syntax (`export let`, `$:`, `<slot />`):
> - Svelte 5 Runes & Reactivity: [`https://svelte.dev/docs/svelte/llms.txt`](https://svelte.dev/docs/svelte/llms.txt) (`$state`, `$derived`, `$effect`, `Snippet`, `{@render children?.()}`).
> - SvelteKit Loaders & Hooks: [`https://svelte.dev/docs/kit/llms.txt`](https://svelte.dev/docs/kit/llms.txt) (`LayoutServerLoad`, `PageServerLoad`, `hooks.server.ts`).
> - Clerk Agent Runbook: [`https://clerk.com/SKILL.md`](https://clerk.com/SKILL.md) and [`github.com/clerk/skills`](https://github.com/clerk/skills).

#### 1. Server Handler: `src/hooks.server.ts`

Create `src/hooks.server.ts` using `svelte-clerk/server` to handle sessions on incoming requests:

```ts
import { withClerkHandler } from 'svelte-clerk/server';

export const handle = withClerkHandler();
```

#### 2. Environment Types: `src/app.d.ts`

Update `src/app.d.ts` to include Clerk environment types:

```ts
/// <reference types="svelte-clerk/env" />

declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
```

#### 3. Server Loader for SSR: `src/routes/+layout.server.ts`

Pass initial authentication state to the client layout for instant hydration:

```ts
import { buildClerkProps } from 'svelte-clerk/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
  return {
    ...buildClerkProps(locals.auth()),
  };
};
```

#### 4. Styling & UI Components: Tailwind CSS v4 & shadcn-svelte

Tailwind CSS v4 is configured with the official `@tailwindcss/vite` plugin, and `shadcn-svelte` provides accessible, copy-pasteable component primitives built on Bits UI.

##### Configure `vite.config.ts`

Ensure `vite.config.ts` includes the `@tailwindcss/vite` plugin:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
});
```

##### Configure `components.json`

Create `components.json` in the project root:

```json
{
  "$schema": "https://shadcn-svelte.com/schema.json",
  "style": "default",
  "tailwind": {
    "config": "",
    "css": "src/app.css",
    "baseColor": "zinc"
  },
  "aliases": {
    "components": "$lib/components",
    "utils": "$lib/utils",
    "ui": "$lib/components/ui",
    "hooks": "$lib/hooks"
  },
  "typescript": true
}
```

##### Initialize shadcn-svelte & Core Components

Install core utility packages and add foundational UI primitives:

```bash
# 1. Install helper dependencies
pnpm add clsx tailwind-merge bits-ui

# 2. Add accessible UI components on demand
pnpm dlx shadcn-svelte@latest add button card dialog input badge
```

##### Configure `src/app.css`

Define Tailwind v4 base styles, shadcn color variables, and the `@theme` token mappings.

> [!IMPORTANT]
> **Preventing Clerk Modal Transparency with Tailwind CSS v4**:
> In Tailwind CSS v4, root design variables like `--card`, `--background`, and `--popover` must be defined as valid, executable CSS color values (e.g. `hsl(0 0% 100%)`) rather than bare color channels (`0 0% 100%`).
> When `@clerk/ui` applies `style="background-color: var(--card)"`, bare channel values cause the browser to mark the property invalid and fall back to transparent, making modal dialogs and backdrops completely invisible. Wrapping tokens in `hsl(...)` ensures solid, beautiful dialog rendering.

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: hsl(0 0% 100%);
    --foreground: hsl(240 10% 3.9%);
    --card: hsl(0 0% 100%);
    --card-foreground: hsl(240 10% 3.9%);
    --popover: hsl(0 0% 100%);
    --popover-foreground: hsl(240 10% 3.9%);
    --primary: hsl(240 5.9% 10%);
    --primary-foreground: hsl(0 0% 98%);
    --secondary: hsl(240 4.8% 95.9%);
    --secondary-foreground: hsl(240 5.9% 10%);
    --muted: hsl(240 4.8% 95.9%);
    --muted-foreground: hsl(240 3.8% 46.1%);
    --accent: hsl(240 4.8% 95.9%);
    --accent-foreground: hsl(240 5.9% 10%);
    --destructive: hsl(0 84.2% 60.2%);
    --destructive-foreground: hsl(0 0% 98%);
    --border: hsl(240 5.9% 90%);
    --input: hsl(240 5.9% 90%);
    --ring: hsl(240 5.9% 10%);
    --radius: 0.5rem;
  }

  .dark {
    --background: hsl(240 10% 3.9%);
    --foreground: hsl(0 0% 98%);
    --card: hsl(240 10% 3.9%);
    --card-foreground: hsl(0 0% 98%);
    --popover: hsl(240 10% 3.9%);
    --popover-foreground: hsl(0 0% 98%);
    --primary: hsl(0 0% 98%);
    --primary-foreground: hsl(240 5.9% 10%);
    --secondary: hsl(240 3.7% 15.9%);
    --secondary-foreground: hsl(0 0% 98%);
    --muted: hsl(240 3.7% 15.9%);
    --muted-foreground: hsl(240 5% 64.9%);
    --accent: hsl(240 3.7% 15.9%);
    --accent-foreground: hsl(0 0% 98%);
    --destructive: hsl(0 62.8% 30.6%);
    --destructive-foreground: hsl(0 0% 98%);
    --border: hsl(240 3.7% 15.9%);
    --input: hsl(240 3.7% 15.9%);
    --ring: hsl(240 4.9% 83.9%);
  }

  * {
    border-color: var(--border);
  }

  body {
    background-color: var(--background);
    color: var(--foreground);
    font-feature-settings: "rlig" 1, "calt" 1;
    min-height: 100vh;
  }
}

@theme {
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

#### 5. Root Layout: `src/routes/+layout.svelte`

Initialize Convex, import `../app.css`, and pass Clerk session tokens to Convex reactively:

```svelte
<script lang="ts">
  import '../app.css';
  import type { Snippet } from 'svelte';
  import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from 'svelte-clerk';
  import { useClerkContext } from 'svelte-clerk/client';
  import { setupConvex } from 'convex-svelte';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';

  const { children }: { children: Snippet } = $props();

  const client = setupConvex(PUBLIC_CONVEX_URL);
  const ctx = useClerkContext();

  $effect(() => {
    client.setAuth(async (forceRefreshToken?: boolean) => {
      try {
        if (!ctx.isLoaded || !ctx.session) return null;
        return (await ctx.session.getToken({ template: 'convex', skipCache: forceRefreshToken })) ?? null;
      } catch {
        return null;
      }
    }, {
      isLoading: () => !ctx.isLoaded,
    });
  });
</script>

<ClerkProvider>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
          <span class="text-xl">⚡</span>
          <span>My App</span>
        </a>
        <nav class="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal" class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 transition-colors cursor-pointer">
              Sign In
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>

    <main class="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
      {@render children?.()}
    </main>

    <footer class="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
      <p>Built with SvelteKit, Convex, Clerk & Tailwind CSS</p>
    </footer>
  </div>
</ClerkProvider>
```

#### 6. Custom Reactive View: `src/routes/+page.svelte`

Tailor this page to the user's specific idea (e.g. recipes, journals, tasks) using Tailwind CSS utility classes and modern card layouts:

```svelte
<script lang="ts">
  import { useQuery, useMutation } from 'convex-svelte';
  import { api } from '$convex/_generated/api';
  import { SignedIn, SignedOut, SignInButton } from 'svelte-clerk';

  const tasks = useQuery(api.tasks.list, {});
  const createTask = useMutation(api.tasks.create);
  const toggleTask = useMutation(api.tasks.toggle);

  let newTaskText = $state('');
  let isSubmitting = $state(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const text = newTaskText.trim();
    if (!text || isSubmitting) return;

    isSubmitting = true;
    try {
      await createTask({ text });
      newTaskText = '';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<SignedOut>
  <div class="rounded-xl border border-border bg-card p-12 text-center text-card-foreground shadow-sm max-w-xl mx-auto my-12">
    <h1 class="text-3xl font-extrabold tracking-tight mb-3">Welcome to Your App</h1>
    <p class="text-muted-foreground text-base mb-8">Sign in to start creating and saving your items with instant real-time sync.</p>
    <SignInButton mode="modal" class="inline-flex items-center justify-center rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 transition-colors cursor-pointer shadow-sm">
      Sign In to Get Started
    </SignInButton>
  </div>
</SignedOut>

<SignedIn>
  <section class="rounded-xl border border-border bg-card p-6 md:p-8 text-card-foreground shadow-sm">
    <div class="flex items-center justify-between mb-1">
      <h2 class="text-2xl font-bold tracking-tight">Your Saved Items</h2>
      <span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
        Live Sync
      </span>
    </div>
    <p class="text-sm text-muted-foreground mb-6">Anything you add updates instantly across your phone and computer.</p>

    <form onsubmit={handleSubmit} class="flex gap-2 mb-6">
      <input
        type="text"
        bind:value={newTaskText}
        placeholder="Add a new item..."
        disabled={isSubmitting}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isSubmitting || !newTaskText.trim()}
        class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer shrink-0"
      >
        {isSubmitting ? 'Adding...' : 'Add'}
      </button>
    </form>

    {#if $tasks.isLoading}
      <div class="rounded-lg border border-border/50 bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        <p>Loading your items...</p>
      </div>
    {:else if $tasks.error}
      <div class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive">
        <p>Could not load items: {$tasks.error.toString()}</p>
      </div>
    {:else if $tasks.data?.length === 0}
      <div class="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        <p>No items yet. Type something above and click Add!</p>
      </div>
    {:else}
      <ul class="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {#each $tasks.data ?? [] as task (task._id)}
          <li class="p-4 hover:bg-muted/30 transition-colors">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={task.isCompleted}
                onchange={() => toggleTask({ id: task._id })}
                class="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
              />
              <span class="text-sm font-medium transition-all {task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}">
                {task.text}
              </span>
            </label>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</SignedIn>
```

---

### Step 6: Backend Provisioning & Click-by-Click Auth Setup

#### 1. Provision Convex Dev Backend Headlessly
Run headless Convex provisioning:
```bash
pnpm convex dev --once
```
This generates the deployment URL and updates `.env.local` with `CONVEX_DEPLOYMENT` and `PUBLIC_CONVEX_URL`.

#### 2. Clerk Setup: CLI Automation or Click-by-Click Guide

You can configure Clerk either seamlessly via the terminal using the Clerk CLI (referencing the bundled `clerk` skill or `https://clerk.com/SKILL.md`), or via click-by-click instructions in the Clerk Dashboard.

##### Option A: Fast Terminal Setup with Clerk CLI (`pnpm dlx clerk`)
If the user prefers terminal-based authentication without leaving the console:
```bash
# 1. Authenticate with Clerk (or use accountless dev mode via pnpm dlx clerk init)
pnpm dlx clerk auth login

# 2. Inspect available applications
pnpm dlx clerk apps list --json

# 3. Create the mandatory 'convex' JWT Template with audience 'convex'
pnpm dlx clerk api jwt_templates create \
  --name convex \
  --claims '{"aud": "convex", "email": "{{user.primary_email_address}}", "name": "{{user.full_name}}", "picture": "{{user.image_url}}"}'

# 4. Verify Clerk integration health
pnpm dlx clerk doctor
```

> [!IMPORTANT]
> **Mandatory Audience Claim (`aud: "convex"`)**:
> Convex backend token verification (`ctx.auth.getUserIdentity()`) validates that the JWT payload contains `applicationID: "convex"` matching `convex/auth.config.ts`. If the JWT template lacks `"aud": "convex"`, Convex will reject queries and mutations with an unauthenticated error even if the user is signed in to Clerk! Always ensure the template defines `"aud": "convex"`.

##### Option B: Click-by-Click Guide in Clerk Dashboard (For Non-SWEs)
Guide the user with clear, friendly steps to obtain their keys:

> 1. Open [https://dashboard.clerk.com](https://dashboard.clerk.com) in your browser.
> 2. Click **Add application** (or **Create application**), enter your app's name, and pick how users can sign in (e.g. Google, Email).
> 3. Click **Create Application**.
> 4. In the **API Keys** section, copy the **Publishable Key** (starts with `pk_test_...`) and the **Secret Key** (starts with `sk_test_...`).
> 5. On the left sidebar in Clerk, click **JWT Templates** $\to$ **New Template** $\to$ select the **Convex** template.
> 6. Ensure the template name is `convex` and the **Audience** (`aud`) field is set to `convex`.
> 7. Copy the **Issuer** / **Frontend API URL** (it looks like `https://verb-noun-00.clerk.accounts.dev`).

Once the user provides the Frontend API URL, configure it on Convex:
```bash
pnpm convex env set CLERK_FRONTEND_API_URL <user-fapi-url>
```

#### 3. Verify Code Quality & Unit Tests
```bash
pnpm run lint
pnpm run format
pnpm run test:unit
```

#### 4. Visual Proof & Walkthrough Media (Screenshots & Animated GIFs)

Non-SWE creators and users benefit immensely from seeing visual proof of their working application. Use the standalone walkthrough recorder `scripts/record-demo.ts` to automatically capture high-definition screenshots and an animated demo GIF:

```bash
# 1. Place the walkthrough recorder in scripts/
mkdir -p scripts
cp templates/record-demo.ts scripts/record-demo.ts 2>/dev/null || true

# 2. Run the recorder with the dev server running (via Caddy http://<project-name>.localhost)
LOCAL_DOMAIN="<project-name>.localhost" node scripts/record-demo.ts
```

> [!TIP]
> **Walkthrough Artifact Media**:
> When composing your `walkthrough.md` artifact:
> 1. Copy the generated `static/demo.gif` and screenshots to your Antigravity conversation artifact directory (`<appDataDir>/brain/<conversation-id>/`).
> 2. Embed them in `walkthrough.md`:
>    ```markdown
>    ## Interactive Flow Demo
>    ![Live Demo](file:///home/bryant/.gemini/antigravity/brain/<conversation-id>/demo.gif)
>
>    ### Screenshots
>    | Initial Screen | Real-Time Sync |
>    | :---: | :---: |
>    | ![Step 1](file:///path/to/step-1-initial.png) | ![Step 2](file:///path/to/step-2-completed.png) |
>    ```

---

### Step 7: Remote GitHub Repository Creation & Licensing

Every new application scaffolded by this skill must have its remote GitHub repository provisioned and pushed using the GitHub CLI (`gh`).

#### 1. Inquire Repository Visibility & Apply License
Before creating the repository, ask the user whether the repository should be **public** or **private**:

- **If Public**:
  The project **MUST** include an MIT license.
  Generate `LICENSE` with the current year and the author/organization name (retrieved via `gh api user -q .name` or `git config user.name`):

  ```bash
  YEAR=$(date +%Y)
  AUTHOR=$(gh api user -q '.name // .login' 2>/dev/null || git config user.name || echo "The Author")
  cat << EOF > LICENSE
  MIT License

  Copyright (c) $YEAR $AUTHOR

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  EOF
  ```

- **If Private**:
  No public open-source license is required unless requested.

#### 2. Initialize Git and Commit
```bash
# 1. Initialize git if not already present
git init -b main

# 2. Stage and commit all baseline files and license
git add -A
git commit -m "feat: initial scaffold with sveltekit, convex, clerk, and biome"
```

#### 3. Provision Remote Repository on GitHub
```bash
# For Public:
gh repo create <repo-name> --public --source=. --push

# For Private:
gh repo create <repo-name> --private --source=. --push
```

Verify that the remote tracking branch is established:
```bash
gh repo view
```

---

### Step 8: Headless Vercel Deployment & Environment Variable Sync

1. **Pre-Deployment Verification Gate (Lints & Tests)**:
   Always verify lints, typechecks, and tests pass before initiating deployment:
   ```bash
   pnpm run check
   pnpm run test:unit
   pnpm run test:e2e
   ```

2. **Install Vercel CLI & Deploy Headlessly**:
   ```bash
   # Ensure Vercel CLI is installed in devDependencies
   pnpm add -D vercel

   # Initial deployment
   pnpm vercel --prod --yes
   ```

3. **Synchronize Production Environment Variables on Vercel**:
   Set the exact required production environment variables using the Vercel CLI:
   ```bash
   # Add Public Convex URL
   pnpm vercel env add PUBLIC_CONVEX_URL production

   # Add Public Clerk Publishable Key
   pnpm vercel env add PUBLIC_CLERK_PUBLISHABLE_KEY production

   # Add Clerk Secret Key
   pnpm vercel env add CLERK_SECRET_KEY production
   ```

4. **Trigger Final Production Build**:
   ```bash
   pnpm vercel --prod --yes
   ```

---

### Step 9: Celebration & Shareable Links Handoff

Present the completed application to the user with enthusiasm, clear instructions, and shareable links:

1. **Local Preview Link**:
   > *"💻 **Local Preview:** You can test your app right now on your computer at: `http://<project-name>.localhost` (served via Caddy — zero port collisions or messy numbers!)."*

2. **Live Mobile & Web Share Link**:
   > *"🎉 **Your App is Live on the Internet!**"*
   > *"Here is your shareable link: `https://<your-project>.vercel.app`"*
   > *"Open it in your phone browser, test creating an account, and text it to family and friends!"*

3. **Suggested Next Steps**:
   Suggest 2–3 fun improvements they can ask you to build next:
   - *"Would you like to add search and filtering for your items?"*
   - *"Would you like to add photo or image uploads?"*
   - *"Would you like to customize the colors and fonts to your favorite style?"*

---

## Completion Verification Checklist

- [ ] `pnpm --version` confirmed `pnpm` is strictly used (no `npm` or `yarn` lockfiles created).
- [ ] Tailwind CSS v4 configured with `@tailwindcss/vite`; `shadcn-svelte` components and `src/app.css` configured.
- [ ] No `eslint` or `prettier` packages or configuration files exist in the project root.
- [ ] `biome.json` is configured and `pnpm run check` passes without warnings or formatting errors.
- [ ] Caddyfile configured with `<project-name>.localhost` base domain and subdomains, and Caddy running.
- [ ] Vitest unit tests and Playwright E2E tests are configured and pass (`pnpm run test`).
- [ ] Visual proof captured (screenshots and demo GIF via Playwright + ffmpeg) and embedded in walkthrough artifact.
- [ ] `convex/auth.config.ts` matches Clerk's Frontend API URL.
- [ ] `src/routes/+layout.svelte` establishes reactive token passing from `useClerkContext()` to `setupConvex()`.
- [ ] Remote GitHub repository created via `gh repo create` (with MIT license if public).
- [ ] Project successfully deployed to Vercel with production environment variables verified.
- [ ] Live shareable Vercel URL and local preview URL (`http://<project-name>.localhost`) presented clearly to the user.


