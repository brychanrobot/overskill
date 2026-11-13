# Vercel Deployment Reference

Official Documentation Index: https://vercel.com/docs/llms.txt

## Runtime Prerequisites

> [!IMPORTANT]
> **Node.js 22.x Runtime Prerequisite (`convex@1.49+`)**:
> `convex@1.49+` dropped support for Node.js 20 and strictly requires **Node.js 22+**. Before deploying:
> 1. In **Vercel Project Settings** $\to$ **General** $\to$ **Node.js Version**, ensure the runtime is set to **`22.x`** (or newer).
> 2. Ensure `package.json` contains `"engines": { "node": ">=22" }` so Vercel build runners automatically select Node.js 22.

## Headless CLI Deployment Workflow

1. **Authentication Check**:
   ```bash
   pnpm dlx vercel whoami
   ```
2. **Install Vercel CLI & Deploy Headlessly**:
   ```bash
   pnpm add -D vercel
   pnpm vercel --prod --yes
   ```
3. **Environment Variable Provisioning**:
   ```bash
   pnpm vercel env add PUBLIC_CONVEX_URL production
   pnpm vercel env add PUBLIC_CLERK_PUBLISHABLE_KEY production
   pnpm vercel env add CLERK_SECRET_KEY production
   ```
4. **Trigger Production Build**:
   ```bash
   pnpm vercel --prod --yes
   ```
5. **Git Integration**: When paired with `gh repo create --source=. --push`, Vercel can automatically link to the GitHub repository for continuous deployments on subsequent commits.
