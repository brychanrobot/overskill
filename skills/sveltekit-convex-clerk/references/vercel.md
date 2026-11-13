# Vercel Deployment Reference

Official Documentation Index: https://vercel.com/docs/llms.txt

## 1. Runtime Prerequisites: Node.js 22+

> [!IMPORTANT]
> **Node.js 22.x Runtime Prerequisite (`convex@1.49+`)**:
> `convex@1.49.0` and newer dropped support for Node.js 20 and strictly requires **Node.js 22+**. Before deploying:
> 1. In **Vercel Project Settings** $\to$ **General** $\to$ **Node.js Version**, ensure the runtime is set to **`22.x`** (or newer).
> 2. Ensure `package.json` contains `"engines": { "node": ">=22" }` so Vercel build runners automatically select Node.js 22:
>    ```json
>    {
>      "engines": {
>        "node": ">=22"
>      }
>    }
>    ```

---

## 2. Pre-Deployment Verification Gate

Always verify that linter, typecheck, and unit/E2E test suites pass cleanly before deploying:

```bash
# 1. Typecheck and lint validation
pnpm run check

# 2. Run unit tests
pnpm run test:unit

# 3. Run E2E tests
pnpm run test:e2e
```

---

## 3. Convex Production Backend Deployment

Before deploying the frontend application to Vercel, deploy your Convex database schema, functions, and auth config to production:

```bash
# 1. Deploy Convex functions and schema to production
pnpm convex deploy

# 2. Configure Clerk Frontend API URL on production Convex deployment
pnpm convex env set CLERK_FRONTEND_API_URL https://<your-fapi-url>.clerk.accounts.dev --prod
```

This ensures your production database tables, indexes, and JWT authentication rules are live before Vercel serves traffic.

---

## 4. Headless Vercel CLI Deployment Workflow

### Step 1: Authentication Check
Verify your Vercel CLI authentication:
```bash
pnpm dlx vercel whoami
```

### Step 2: Install Vercel CLI & Initial Deployment
Install Vercel CLI as a dev dependency and trigger the initial project linking and build:
```bash
pnpm add -D vercel
pnpm vercel --prod --yes
```

### Step 3: Synchronize Production Environment Variables
Set the exact required production environment variables using the Vercel CLI:
```bash
# Add Public Convex URL
pnpm vercel env add PUBLIC_CONVEX_URL production

# Add Public Clerk Publishable Key
pnpm vercel env add PUBLIC_CLERK_PUBLISHABLE_KEY production

# Add Clerk Secret Key
pnpm vercel env add CLERK_SECRET_KEY production
```

### Step 4: Trigger Final Production Build
Re-deploy to build with the active environment variables:
```bash
pnpm vercel --prod --yes
```

---

## 5. Remote GitHub Integration & Continuous Deployment

When paired with `gh repo create`:
```bash
# Public repository (includes MIT license)
gh repo create <repo-name> --public --source=. --push

# Private repository
gh repo create <repo-name> --private --source=. --push
```

Link the repository in the Vercel Dashboard (or via `vercel link`) so every subsequent push to `main` triggers an automatic production build with preview branch deployments on pull requests.
