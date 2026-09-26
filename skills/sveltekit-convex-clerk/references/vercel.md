# Vercel Deployment Reference

Official Documentation Index: https://vercel.com/docs/llms.txt

## Headless CLI Deployment Workflow

1. **Authentication Check**:
   ```bash
   npx vercel whoami
   ```
2. **Headless Project Linking & Production Deployment**:
   ```bash
   npx vercel --prod --yes
   ```
3. **Environment Variable Provisioning**:
   ```bash
   npx vercel env add PUBLIC_CONVEX_URL production
   npx vercel env add PUBLIC_CLERK_PUBLISHABLE_KEY production
   npx vercel env add CLERK_SECRET_KEY production
   ```
4. **Git Integration**: When paired with `gh repo create --source=. --push`, Vercel can automatically link to the GitHub repository for continuous deployments on subsequent commits.
