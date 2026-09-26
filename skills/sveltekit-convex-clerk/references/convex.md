# Convex Reference for SvelteKit

Official Resources:
- Convex LLM Index: https://docs.convex.dev/llms.txt
- Convex Svelte Guide: https://docs.convex.dev/client/svelte/overview.md
- Convex Clerk Integration: https://docs.convex.dev/auth/clerk.md

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
     npx convex env set CLERK_FRONTEND_API_URL https://<your-fapi-url>.clerk.accounts.dev
     ```
   - In mutations/queries, identify the user with:
     ```ts
     const identity = await ctx.auth.getUserIdentity();
     if (!identity) throw new Error("Unauthenticated");
     const userId = identity.subject;
     ```
