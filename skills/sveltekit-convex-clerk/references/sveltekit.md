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

---

## Path Aliases Configuration: `svelte.config.js`

In SvelteKit, the default path alias is `$lib` pointing to `src/lib`. By default, the `convex/` backend directory resides in the project root alongside `src/`. SvelteKit's module resolver cannot resolve imports starting with `$convex/` unless configured explicitly in `kit.alias`:

```javascript
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      $convex: 'convex',
    },
  },
};

export default config;
```

### Why the `$convex` Alias is Required
Convex code generation outputs typed API definitions and schemas to `convex/_generated/api.js` and `convex/_generated/dataModel.d.ts`. When application loaders (`+page.ts`), server hooks (`src/hooks.server.ts`), or Svelte components import the typed API:
```ts
import { api } from '$convex/_generated/api';
```
Without `alias: { $convex: 'convex' }`, SvelteKit and Vite fail to locate the package with:
```
Cannot find package '$convex' imported from ...
```
Defining the alias establishes clean, type-safe path resolution throughout the entire application tree without brittle relative paths (`../../convex/_generated/api`).

---

## Svelte Context Boundary Constraint (`useClerkContext`)

In modern Svelte (Svelte 5), component context (`setContext` / `getContext`) is strictly scoped to the component lifecycle and hierarchy.

> [!IMPORTANT]
> **Svelte Context Boundary Constraint**:
> `<ClerkProvider>` initializes its client context internally via Svelte's `setClerkContext()`. Therefore, `useClerkContext()` **MUST** be invoked in a descendant component rendered inside `<ClerkProvider>` (such as `src/lib/components/ConvexAuth.svelte` or child route components), **never** in the root `+layout.svelte` `<script>` block alongside `<ClerkProvider>`. Calling `useClerkContext()` in the root layout `<script>` fails immediately with a runtime error because the context has not yet been initialized.

### Correct Context Hierarchy in `+layout.svelte`:
```svelte
<script lang="ts">
  import '../app.css';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';
  import ConvexAuth from '$lib/components/ConvexAuth.svelte';
  import { setupConvex } from 'convex-svelte';
  import { ClerkProvider } from 'svelte-clerk';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';

  const { data, children }: { data: LayoutData; children: Snippet } = $props();

  // 1. Initialize Convex client context
  setupConvex(PUBLIC_CONVEX_URL);
</script>

<!-- 2. ClerkProvider establishes Clerk context -->
<ClerkProvider initialState={data.initialState}>
  <!-- 3. ConvexAuth (descendant) safely calls useClerkContext() -->
  <ConvexAuth initialState={{ isAuthenticated: data.isAuthenticated }}>
    {@render children?.()}
  </ConvexAuth>
</ClerkProvider>
```

---

## SvelteKit SSR & Hydration Pipeline

Seamless SSR without unauthenticated loading flashes requires coordination between universal client hooks, server handle hooks, layout loaders, and route loaders. Detailed implementation references are in [convex.md](convex.md) and [clerk.md](clerk.md).

```
Server Request
   │
   ▼
1. src/hooks.server.ts
   ├── withClerkHandler()         ── Validates session cookies, attaches event.locals.auth()
   ├── convexAuth Handle          ── Fetches JWT: await auth.getToken({ template: 'convex' })
   │                              ── Executes withServerConvexToken(token, () => resolve(event))
   └── convexLoadHydration        ── Injects preloaded query hydration scripts into HTML
   │
   ▼
2. src/routes/+layout.server.ts
   └── LayoutServerLoad           ── Returns { ...buildClerkProps(auth), isAuthenticated: Boolean(auth.userId) }
   │
   ▼
3. src/routes/+page.ts (Universal Load)
   └── PageLoad ({ fetch, parent }) ── Reads isAuthenticated from parent()
                                  ── Awaits convexLoad(api.tasks.list, isAuthenticated ? {} : 'skip', { fetch })
   │
   ▼
4. src/hooks.ts (Universal Hook)
   ├── initConvex(PUBLIC_CONVEX_URL) ── Universal client initialization
   └── export const transport     ── Serializes/deserializes ConvexLoadResult across SSR boundary
   │
   ▼
5. Client Hydration (+layout.svelte & ConvexAuth.svelte)
   ├── setupConvex(PUBLIC_CONVEX_URL) ── Binds client to Svelte context
   ├── <ClerkProvider>            ── Hydrates initial auth state instantly from data.initialState
   └── <ConvexAuth>               ── Synchronizes tokens with setupAuth(), passes initialState,
                                     calls invalidateAll() on auth transitions
   │
   ▼
6. Reactive Page Component (src/routes/+page.svelte)
   └── const tasks = $derived(data.tasks) ── Accesses tasks.isLoading, tasks.data, tasks.error directly (no $)
```

### Key Rules of the Pipeline:
1. **Pass `{ fetch }` to `convexLoad`**: Universal `PageLoad` functions must pass SvelteKit's injected `fetch` (`{ fetch }`) to `convexLoad(...)`. This allows SvelteKit to intercept server-side HTTP requests, deduplicate fetches, and serialize results for the client.
2. **Conditional Skipping (`'skip'`)**: When unauthenticated, pass `'skip'` as the query argument in `convexLoad(api.tasks.list, isAuthenticated ? {} : 'skip', { fetch })` to avoid triggering 401 unauthenticated errors on private queries during SSR.
3. **No Svelte Stores in Svelte 5**: In `convex-svelte@0.15.1`, data returned by `convexLoad` and `useQuery` are reactive rune objects, NOT stores. Use `tasks.isLoading` and `tasks.data` directly—never use `$tasks`.


