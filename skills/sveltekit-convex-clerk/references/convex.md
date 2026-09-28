# Convex Reference for SvelteKit

Official Resources & Agent Documentation:
- **Convex LLM Index**: https://docs.convex.dev/llms.txt
- **Official Convex Agent Skills**: https://github.com/get-convex/agent-skills
- **Convex Svelte Guide**: https://docs.convex.dev/client/svelte/overview.md
- **Convex Clerk Integration**: https://docs.convex.dev/auth/clerk.md

## Live Freshness Protocol for Convex
Convex renders all documentation pages as clean, raw markdown by appending `.md` to the URL. When designing schemas, implementing advanced database features, or handling edge cases, fetch the live topic markdown via `read_url_content` or HTTP GET:
- Indexes & compound queries: `https://docs.convex.dev/database/reading-data/indexes.md`
- Svelte client integration: `https://docs.convex.dev/client/svelte/overview.md`
- Clerk authentication: `https://docs.convex.dev/auth/clerk.md`
- File storage: `https://docs.convex.dev/file-storage.md`
- Text search: `https://docs.convex.dev/text-search.md`
- Scheduled crons: `https://docs.convex.dev/scheduling/cron-jobs.md`
- Best practices: `https://docs.convex.dev/understanding/best-practices.md`

## Core Concepts


1. **Reactive Backend**: Convex automatically syncs query results to the browser over WebSocket connections.
2. **`convex-svelte`**:
   - `setupConvex(PUBLIC_CONVEX_URL)`: Initializes the application-scoped `ConvexClient` in Svelte context.
   - `useQuery(api.module.fn, args)`: Subscribes to queries and returns a store with `$query.data`, `$query.isLoading`, `$query.error`.
   - `useMutation(api.module.fn)`: Returns an async function that invokes a backend mutation.
3. **Clerk JWT Verification**:
   - Convex verifies JWTs using `convex/auth.config.ts`.
   - Set the domain on your Convex deployment:
     ```bash
     pnpm convex env set CLERK_FRONTEND_API_URL https://<your-fapi-url>.clerk.accounts.dev
     ```
   - In mutations/queries, identify the user with:
     ```ts
     const identity = await ctx.auth.getUserIdentity();
     if (!identity) throw new Error("Unauthenticated");
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

## 6. Client Layout Auth Binding (`setupAuth`)

In root `+layout.svelte`, synchronize Clerk's reactive auth state with Convex:

```svelte
<script lang="ts">
  import { useClerkContext } from 'svelte-clerk/client';
  import { setupConvex } from 'convex-svelte';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';

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
```
- Providing `isLoading: () => !ctx.isLoaded` prevents unauthenticated flashes during initial load.
- Passing `skipCache: forceRefreshToken` ensures Convex receives fresh tokens on rotation.

