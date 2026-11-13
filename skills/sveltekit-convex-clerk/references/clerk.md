# Clerk Authentication Reference for SvelteKit

Official Resources & Agent Documentation:
- **Canonical Agent Runbook**: https://clerk.com/SKILL.md
- **Official Clerk Skills**: https://github.com/clerk/skills
- **Clerk LLM Index**: https://clerk.com/docs/llms.txt
- **Svelte Community SDK**: https://github.com/clerk-community/svelte-clerk

## Core Concepts

In SvelteKit applications, Clerk handles user authentication and session management using:
1. **Server Handler**: `withClerkHandler()` in `src/hooks.server.ts` intercepts incoming requests, validates session cookies, and attaches the `auth()` method to `event.locals`.
2. **Server Loader**: `buildClerkProps(locals.auth())` in `src/routes/+layout.server.ts` hydrates server-rendered user state so client hydration is instant, alongside returning `isAuthenticated: Boolean(auth.userId)`.
3. **Client Provider**: `<ClerkProvider>` wraps the root layout, exposing user context and reactive runes to its child component tree.
4. **Client Context & Svelte Context Constraint**: `useClerkContext()` from `svelte-clerk/client` provides reactive runes (`clerk.session`, `clerk.user`, `clerk.isLoaded`).
   > [!IMPORTANT]
   > **Svelte Context Boundary Constraint**:
   > `ClerkProvider.svelte` sets the context internally using Svelte's `setClerkContext()`. Therefore, `useClerkContext()` **MUST** be invoked in a descendant component rendered inside `<ClerkProvider>` (such as `src/lib/components/ConvexAuth.svelte` or child route components), **never** in the same root `+layout.svelte` `<script>` block alongside `<ClerkProvider>`. Calling `useClerkContext()` in the root layout `<script>` will fail because the context has not yet been initialized.
5. **Token Generation & Bridging**: To authenticate backend services like Convex, tokens are retrieved using the `convex` JWT template on both server and client.

## Server & Client Token Bridging for Convex SSR

To enable seamless server-side rendering (SSR) without unauthenticated flashes or client loading delays, auth tokens are retrieved on both server and client using the `convex` JWT template:

### 1. Server-Side SSR Token Bridge (`src/hooks.server.ts`)
`withClerkHandler()` populates `event.locals.auth()`. In `src/hooks.server.ts`, calling `await auth.getToken({ template: 'convex' })` retrieves the signed JWT for SSR prefetching. This JWT is passed into `withServerConvexToken()` inside `src/hooks.server.ts`, matching the client-side `clerk.session.getToken({ template: 'convex', skipCache: forceRefreshToken })` call inside `setupAuth()` so server-side `convexLoad()` queries are authenticated:

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

### 2. Client-Side Reactive Token Bridge (`src/lib/components/ConvexAuth.svelte`)
Because `useClerkContext()` requires `<ClerkProvider>` context, wrap the client token bridge in a dedicated descendant component rendered inside `<ClerkProvider>`. `setupAuth()` invokes `clerk.session.getToken({ template: 'convex', skipCache: forceRefreshToken })` matching the server-side JWT template:

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

## UI Components
- `<SignedIn>`: Renders children only when a user is authenticated.
- `<SignedOut>`: Renders children only when no user is logged in.
- `<SignInButton mode="modal">`: Triggers Clerk's sign-in flow.
- `<SignUpButton mode="modal">`: Triggers Clerk's sign-up flow.
- `<UserButton>`: Self-contained account profile menu and sign-out control.

## Required Environment Variables
```env
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

---

## Clerk CLI (`pnpm dlx clerk`)

Manage Clerk authentication directly from your terminal using the Clerk CLI:

```bash
# Authenticate CLI session
pnpm dlx clerk auth login

# Check authentication and linked project
pnpm dlx clerk whoami

# Check integration health
pnpm dlx clerk doctor

# List available Clerk apps
pnpm dlx clerk apps list --json

# Create Convex JWT template with aud: "convex"
pnpm dlx clerk api jwt_templates create \
  --name convex \
  --claims '{"aud": "convex", "email": "{{user.primary_email_address}}", "name": "{{user.full_name}}", "picture": "{{user.image_url}}"}'

# Deploy to production
pnpm dlx clerk deploy
```

> [!IMPORTANT]
> **Audience Claim (`aud: "convex"`)**:
> Convex token verification explicitly checks that the JWT contains `applicationID: "convex"` matching `convex/auth.config.ts`. If the JWT template does not specify `"aud": "convex"`, Convex will treat all client requests as unauthenticated.

> [!NOTE]
> Strictly avoid `npx clerk`. In accordance with `overskill` rules, always use `pnpm dlx clerk`.
