# Convex Reference for SvelteKit

Official Resources & Agent Documentation:
- **Convex LLM Index**: https://docs.convex.dev/llms.txt
- **Official Convex Agent Skills**: https://github.com/get-convex/agent-skills
- **Convex Svelte Guide**: https://docs.convex.dev/client/svelte/overview.md
- **Convex Clerk Integration**: https://docs.convex.dev/auth/clerk.md

> [!IMPORTANT]
> **Node.js 22+ Requirement (`convex@1.49+`)**:
> `convex@1.49.0` and newer dropped support for Node.js 20 and strictly requires **Node.js 22+** (e.g. 22.x LTS or newer). Ensure local toolchains (`mise`), project `package.json` (`"engines": { "node": ">=22" }`), and deployment targets (e.g. Vercel Node version) are configured for Node 22+.

## Live Freshness Protocol for Convex
Convex renders all documentation pages as clean, raw markdown by appending `.md` to the URL. When designing schemas, implementing advanced database features, or handling edge cases, fetch the live topic markdown via `read_url_content` or HTTP GET:
- Indexes & compound queries: `https://docs.convex.dev/database/reading-data/indexes.md`
- Svelte client integration: `https://docs.convex.dev/client/svelte/overview.md`
- Clerk authentication: `https://docs.convex.dev/auth/clerk.md`
- File storage: `https://docs.convex.dev/file-storage.md`
- Text search: `https://docs.convex.dev/text-search.md`
- Scheduled crons: `https://docs.convex.dev/scheduling/cron-jobs.md`
- Best practices: `https://docs.convex.dev/understanding/best-practices.md`

## Core Concepts & `convex-svelte@0.15.1` API

1. **Reactive Backend**: Convex automatically syncs query results to the browser over WebSocket connections.
2. **Universal SSR & Hydration Singleton (`initConvex` in `src/hooks.ts`)**:
   - SvelteKit `transport` serializes preloaded query data from server SSR to client hydration, paired with `initConvex(PUBLIC_CONVEX_URL)` for universal client initialization.
   - Export `transport` in `src/hooks.ts`:
     ```ts
     // src/hooks.ts
     import { PUBLIC_CONVEX_URL } from '$env/static/public';
     import {
       decodeConvexLoad,
       decodeConvexLoadPaginated,
       encodeConvexLoad,
       encodeConvexLoadPaginated,
       initConvex,
     } from 'convex-svelte/sveltekit';

     initConvex(PUBLIC_CONVEX_URL);

     export const transport = {
       ConvexLoadResult: {
         encode: encodeConvexLoad,
         decode: decodeConvexLoad,
       },
       ConvexLoadPaginatedResult: {
         encode: encodeConvexLoadPaginated,
         decode: decodeConvexLoadPaginated,
       },
     };
     ```
3. **Component Context Binding (`setupConvex` in `+layout.svelte`)**:
   - `setupConvex(PUBLIC_CONVEX_URL)` binds the client to Svelte component context (`setContext`).
   - Must be called in the root layout `<script lang="ts">`:
     ```svelte
     <script lang="ts">
       import { setupConvex } from 'convex-svelte';
       import { PUBLIC_CONVEX_URL } from '$env/static/public';

       setupConvex(PUBLIC_CONVEX_URL);
     </script>
     ```
4. **Reactive Queries (`useQuery` with Svelte 5 Runes)**:
   - `useQuery(api.module.fn, args)` subscribes to Convex queries and returns a **reactive object** (powered by Svelte 5 runes):
     * `query.data`: Query result, or `undefined` while loading.
     * `query.isLoading`: `boolean`, `true` while the initial query is pending.
     * `query.error`: Error thrown by the query, or `undefined`.
     * `query.isStale`: `boolean`, `true` when cached data is being refreshed in the background.
   - **NOT a Svelte Store**: Never prefix queries with `$` (do **NOT** use `$query.data` or `$tasks.isLoading`). Access properties directly on the returned object (e.g. `tasks.data`, `tasks.isLoading`).
   - **Reactive Arguments & Conditional Skipping**:
     * Pass a reactive getter function `() => args` to dynamically re-execute queries when reactive dependencies change.
     * Pass `'skip'` (or return `'skip'` from the getter) to conditionally disable the query (e.g., when the user is not authenticated):
       ```ts
       const tasks = useQuery(api.tasks.list, () => (auth.isAuthenticated ? {} : 'skip'));
       ```
5. **Universal SSR Prefetching (`convexLoad`)**:
   - `convexLoad(api.module.fn, args, { fetch })` executes inside universal load functions (`+page.ts` / `+layout.ts`) using SvelteKit's universal `fetch`.
   - Pre-populates the query cache on the server, eliminating client-side loading spinners and layout shift during initial page load.
   - Paired with `withServerConvexToken` and `convexLoadHydration` in `src/hooks.server.ts` to forward auth tokens and inject hydration scripts into SSR HTML.
   - Supports `'skip'` when unauthenticated:
     ```ts
     // src/routes/+page.ts
     export const load: PageLoad = async ({ fetch, parent }) => {
       const { isAuthenticated } = await parent();
       return {
         tasks: await convexLoad(api.tasks.list, isAuthenticated ? {} : 'skip', { fetch }),
       };
     };
     ```
6. **Mutations (`useMutation`)**:
   - `useMutation(api.module.fn)`: Returns an async function that invokes a backend mutation.
7. **Auth Provider Configuration (`setupAuth` & `useAuth`)**:
   - `setupAuth(() => ({ isLoading, isAuthenticated, fetchAccessToken }), { initialState })` configures authentication state synchronization.
   - `useAuth()` returns a reactive object `{ isLoading, isAuthenticated }` reflecting whether Convex itself has confirmed and verified the auth token with the backend (distinct from client auth provider state).
8. **Clerk JWT Verification**:
   - Convex verifies JWTs using `convex/auth.config.ts`.
   - Set the domain on your Convex deployment:
     ```bash
     pnpm convex env set CLERK_FRONTEND_API_URL https://<your-fapi-url>.clerk.accounts.dev
     ```
   - In mutations/queries, identify the user with:
     ```ts
     const identity = await ctx.auth.getUserIdentity();
     if (!identity) throw new Error('Unauthenticated');
     const userId = identity.subject;
     ```

## 4. Defense-in-Depth Authorization

Never rely exclusively on client-side routing or UI conditional rendering (`<SignedIn>`) for security. Every Convex query and mutation must independently authenticate the caller:

1. **Authenticate the caller**: Check `await ctx.auth.getUserIdentity()`.
2. **Verify resource ownership**: When mutating or deleting an existing document, look up the document and verify `doc.userId === identity.subject`.
   ```ts
   export const remove = mutation({
     args: { id: v.id('tasks') },
     handler: async (ctx, args) => {
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) throw new Error('Unauthenticated');

       const task = await ctx.db.get(args.id);
       if (!task || task.userId !== identity.subject) {
         throw new Error('Not authorized to delete this task');
       }

       await ctx.db.delete(args.id);
     },
   });
   ```

## 5. Compound Indexing for Filtered Queries

In-memory filtering (`q.filter(...)` or Array `.filter()`) wastes database bandwidth and compute. Define compound indexes in `convex/schema.ts` for common multi-field predicates:

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

Query with index bounds:
```ts
export const listCompleted = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query('tasks')
      .withIndex('by_user_completed', (q) =>
        q.eq('userId', identity.subject).eq('isCompleted', true)
      )
      .order('desc')
      .collect();
  },
});
```

## 6. End-to-End Clerk Authentication Bridge Architecture (`convex-svelte@0.15.1`)

In `convex-svelte@0.15.1`, synchronizing Clerk and Convex across both SSR and client hydration requires bridging auth tokens on the server (via `withServerConvexToken`) and on the client (via `setupAuth` inside a component nested in `<ClerkProvider>`).

### Architecture Overview

1. **`src/hooks.ts`**: Universal hook registering `transport` via `initConvex` for universal SSR/hydration data serialization.
2. **`src/hooks.server.ts`**: Server hook pipeline sequencing `withClerkHandler()`, `convexAuth` (extracting Clerk's JWT and wrapping downstream execution in `withServerConvexToken`), and `convexLoadHydration`.
3. **`src/routes/+layout.server.ts`**: Passes `isAuthenticated: Boolean(auth.userId)` alongside `buildClerkProps(auth)` to hydrate client auth state instantly.
4. **`src/lib/components/ConvexAuth.svelte`**: Rendered inside `<ClerkProvider>` so `useClerkContext()` has valid Svelte context; synchronizes tokens with `setupAuth()`, passes `initialState`, and calls `invalidateAll()` on auth state transitions.
5. **`src/routes/+page.ts` & `+page.svelte`**: SSR prefetching with `convexLoad` (or skipping if unauthenticated) and consuming reactive `tasks.isLoading` / `tasks.data` without Svelte stores.

---

### 1. Universal Hooks (`src/hooks.ts`)
```ts
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import {
  decodeConvexLoad,
  decodeConvexLoadPaginated,
  encodeConvexLoad,
  encodeConvexLoadPaginated,
  initConvex,
} from 'convex-svelte/sveltekit';

initConvex(PUBLIC_CONVEX_URL);

export const transport = {
  ConvexLoadResult: {
    encode: encodeConvexLoad,
    decode: decodeConvexLoad,
  },
  ConvexLoadPaginatedResult: {
    encode: encodeConvexLoadPaginated,
    decode: decodeConvexLoadPaginated,
  },
};
```

### 2. Server Hooks Pipeline (`src/hooks.server.ts`)
```ts
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { withServerConvexToken } from 'convex-svelte/sveltekit/server';
import { convexLoadHydration } from 'convex-svelte/sveltekit/server/hydration';
import { withClerkHandler } from 'svelte-clerk/server';

const convexAuth: Handle = async ({ event, resolve }) => {
  const auth = event.locals.auth?.();
  let token: string | undefined;

  if (auth?.userId) {
    try {
      token = (await auth.getToken({ template: 'convex' })) ?? undefined;
    } catch {
      token = undefined;
    }
  }

  return withServerConvexToken(token, () => resolve(event));
};

export const handle: Handle = sequence(withClerkHandler(), convexAuth, convexLoadHydration);
```

### 3. Server Layout Loader (`src/routes/+layout.server.ts`)
```ts
import { buildClerkProps } from 'svelte-clerk/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
  const auth = locals.auth();
  return {
    ...buildClerkProps(auth),
    isAuthenticated: Boolean(auth.userId),
  };
};
```

### 4. Client Auth Bridge Component (`src/lib/components/ConvexAuth.svelte`)
```svelte
<script lang="ts">
import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';
import { type SetupAuthOptions, setupAuth } from 'convex-svelte';
import { type Snippet, onDestroy, untrack } from 'svelte';
import { useClerkContext } from 'svelte-clerk/client';

const {
  children,
  initialState,
}: {
  children?: Snippet;
  initialState?: SetupAuthOptions['initialState'];
} = $props();

const clerk = useClerkContext();

let resolveClerkReady: (() => void) | undefined;
const clerkReady =
  !browser || clerk.isLoaded
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          resolveClerkReady = undefined;
          resolve();
        }, 6000);
        resolveClerkReady = () => {
          clearTimeout(timer);
          resolveClerkReady = undefined;
          resolve();
        };
      });

onDestroy(() => {
  resolveClerkReady?.();
});

setupAuth(
  () => ({
    isLoading: !clerk.isLoaded,
    isAuthenticated: Boolean(clerk.auth.userId),
    fetchAccessToken: async ({ forceRefreshToken }) => {
      await clerkReady;
      try {
        if (!clerk.session) return null;
        return (
          (await clerk.session.getToken({ template: 'convex', skipCache: forceRefreshToken })) ??
          null
        );
      } catch {
        return null;
      }
    },
  }),
  initialState ? { initialState } : undefined,
);

let previousSignedIn: boolean | undefined = untrack(() => initialState?.isAuthenticated);

$effect(() => {
  if (!clerk.isLoaded) return;
  resolveClerkReady?.();

  const isSignedIn = Boolean(clerk.auth.userId);
  if (previousSignedIn === undefined) {
    previousSignedIn = isSignedIn;
  } else if (isSignedIn !== previousSignedIn) {
    previousSignedIn = isSignedIn;
    void invalidateAll();
  }
});
</script>

{@render children?.()}
```

### 5. Root Layout Wiring (`src/routes/+layout.svelte`)
```svelte
<script lang="ts">
import '../app.css';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import ConvexAuth from '$lib/components/ConvexAuth.svelte';
import { setupConvex } from 'convex-svelte';
import type { Snippet } from 'svelte';
import { ClerkProvider } from 'svelte-clerk';
import type { LayoutData } from './$types';

const { data, children }: { data: LayoutData; children: Snippet } = $props();

setupConvex(PUBLIC_CONVEX_URL);
</script>

<ClerkProvider initialState={data.initialState}>
  <ConvexAuth initialState={{ isAuthenticated: data.isAuthenticated }}>
    {@render children?.()}
  </ConvexAuth>
</ClerkProvider>
```

### 6. SSR Loader & Page Consumption (`src/routes/+page.ts` & `src/routes/+page.svelte`)

Universal route loader (`src/routes/+page.ts`):
```ts
import { api } from '$convex/_generated/api';
import { convexLoad } from 'convex-svelte/sveltekit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
  const { isAuthenticated } = await parent();
  return {
    tasks: await convexLoad(
      api.tasks.list,
      isAuthenticated ? {} : 'skip',
      { fetch }
    ),
  };
};
```

Page component consuming preloaded SSR data (`src/routes/+page.svelte`):
```svelte
<script lang="ts">
import type { PageData } from './$types';
import { useAuth } from 'convex-svelte';

const { data }: { data: PageData } = $props();
const auth = useAuth();
const tasks = $derived(data.tasks);
</script>

{#if auth.isLoading}
  <p>Authenticating...</p>
{:else if tasks.isLoading}
  <p>Loading tasks...</p>
{:else if tasks.error}
  <p class="text-destructive">Error: {tasks.error.toString()}</p>
{:else if tasks.data}
  <ul>
    {#each tasks.data as task (task._id)}
      <li>{task.text}</li>
    {/each}
  </ul>
{/if}
```
- Direct property access on SSR data: `tasks.isLoading`, `tasks.data`, `tasks.error` (never `$tasks.isLoading` or `$tasks.data`).
- `useAuth()` tracks Convex backend authentication state.
- `convexLoad` preloads data during SSR with `{ fetch }`, eliminating flash-of-loading-content.

### 7. Client-Only Query Component (`useQuery`)

When prefetching during SSR is not required (e.g. in client-only dialogs, modals, or secondary views), use `useQuery`:

```svelte
<script lang="ts">
  import { useQuery, useAuth } from 'convex-svelte';
  import { api } from '$convex/_generated/api';

  const auth = useAuth();
  const tasks = useQuery(api.tasks.list, () => (auth.isAuthenticated ? {} : 'skip'));
</script>

{#if auth.isLoading}
  <p>Authenticating...</p>
{:else if tasks.isLoading}
  <p>Loading tasks...</p>
{:else if tasks.error}
  <p class="text-destructive">Error: {tasks.error.toString()}</p>
{:else if tasks.data}
  <ul>
    {#each tasks.data as task (task._id)}
      <li>{task.text}</li>
    {/each}
  </ul>
{/if}
```
