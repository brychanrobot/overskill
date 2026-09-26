# SvelteKit & Svelte 5 Reference

Official Documentation Index: https://svelte.dev/llms.txt

## Key Architectural Patterns

1. **Scaffolding**:
   ```bash
   pnpm dlx sv create . --template minimal --types ts --no-add-ons
   ```
2. **Svelte 5 Runes**:
   - `$state(initialValue)` for local reactive state.
   - `$derived(expression)` for computed reactive values.
   - `$effect(() => { ... })` for side effects and subscriptions.
   - `Snippet` and `{@render snippet()}` for slot/children composition.
3. **Environment Variables**:
   - Client-accessible public variables must start with `PUBLIC_` and be imported from `$env/static/public` or `$env/dynamic/public`.
   - Secret variables (e.g. `CLERK_SECRET_KEY`) must only be imported in server files from `$env/static/private` or `$env/dynamic/private`.
4. **Vercel Adapter**:
   - `@sveltejs/adapter-auto` automatically detects Vercel deployment environments and optimizes serverless functions and edge middleware.
