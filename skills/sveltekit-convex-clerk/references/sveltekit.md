# SvelteKit & Svelte 5 Reference

Official Documentation Indexes:
- **Root LLM Hub**: https://svelte.dev/llms.txt
- **Svelte 5 Runes & Core**: https://svelte.dev/docs/svelte/llms.txt
- **SvelteKit (Routing, Loaders, Hooks)**: https://svelte.dev/docs/kit/llms.txt
- **Svelte CLI (`sv`)**: https://svelte.dev/docs/cli/llms.txt
- **Tiered Reference**: https://svelte.dev/llms-small.txt (minimal) | https://svelte.dev/llms-full.txt (complete)

## Live Freshness Protocol for Agents
When generating or modifying Svelte components or SvelteKit routes:
1. Fetch `https://svelte.dev/docs/svelte/llms.txt` to verify current rune syntax (`$state`, `$derived`, `$effect`, `$props`, snippets).
2. Fetch `https://svelte.dev/docs/kit/llms.txt` for server loaders, actions, hooks, and routing behavior.
3. **Strictly avoid Svelte 4 legacy patterns**:
   - ❌ `export let foo;` $\to$ ✅ `let { foo }: { foo: string } = $props();`
   - ❌ `$: double = count * 2;` $\to$ ✅ `const double = $derived(count * 2);`
   - ❌ `<slot />` or `<slot name="..." />` $\to$ ✅ `Snippet` and `{@render children?.()}`
   - ❌ `on:click={...}` $\to$ ✅ `onclick={...}`

## Key Architectural Patterns

1. **Scaffolding**:
   ```bash
   pnpm dlx sv create . --template minimal --types ts --no-add-ons
   ```
2. **Svelte 5 Runes**:
   - `$state(initialValue)` for local reactive state.
   - `$state.raw(initialValue)` for immutable or performance-sensitive state.
   - `$derived(expression)` for computed reactive values.
   - `$effect(() => { ... })` for side effects and subscriptions.
   - `Snippet` and `{@render snippet()}` for slot/children composition.
3. **Environment Variables**:
   - Client-accessible public variables must start with `PUBLIC_` and be imported from `$env/static/public` or `$env/dynamic/public`.
   - Secret variables (e.g. `CLERK_SECRET_KEY`) must only be imported in server files from `$env/static/private` or `$env/dynamic/private`.
4. **Vercel Adapter**:
   - `@sveltejs/adapter-auto` automatically detects Vercel deployment environments and optimizes serverless functions and edge middleware.

