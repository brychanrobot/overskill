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

## Setup Workflows: CLI Automation vs. Manual Dashboard

Clerk can be provisioned and configured either headlessly via the Clerk CLI (`pnpm dlx clerk`) or through click-by-click instructions in the Clerk Dashboard.

### Option A: Fast Terminal Setup with Clerk CLI (`pnpm dlx clerk`)

For automated, terminal-driven setup:

```bash
# 1. Authenticate CLI session or initialize accountless dev instance
pnpm dlx clerk auth login
# Alternatively, initialize an interactive or accountless dev project:
pnpm dlx clerk init

# 2. Check active user session and linked project
pnpm dlx clerk whoami

# 3. List available Clerk applications
pnpm dlx clerk apps list --json

# 4. Create mandatory 'convex' JWT template with aud: "convex"
pnpm dlx clerk api jwt_templates create \
  --name convex \
  --claims '{"aud": "convex", "email": "{{user.primary_email_address}}", "name": "{{user.full_name}}", "picture": "{{user.image_url}}"}'

# 5. Verify Clerk integration health
pnpm dlx clerk doctor

# 6. Test or forward webhooks (when integrating event webhooks)
pnpm dlx clerk webhooks

# 7. Deploy settings to production
pnpm dlx clerk deploy
```

> [!NOTE]
> Strictly avoid `npx clerk`. In accordance with `overskill` rules, always use `pnpm dlx clerk`.

---

### Option B: Click-by-Click Guide in Clerk Dashboard (For Non-SWEs)

Guide non-SWE creators and users with clear, friendly steps in their browser:

1. **Create Clerk Application**:
   - Open [https://dashboard.clerk.com](https://dashboard.clerk.com) in your browser.
   - Click **Add application** (or **Create application**), name your application, and select authentication providers (e.g. Google, Email/Password).
   - Click **Create Application**.
2. **Retrieve API Keys**:
   - In the **API Keys** section, copy the **Publishable Key** (starts with `pk_test_...`) and the **Secret Key** (starts with `sk_test_...`).
   - Paste them into your local `.env.local` file:
     ```env
     PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
     CLERK_SECRET_KEY=sk_test_...
     ```
3. **Configure the Convex JWT Template**:
   - On the left sidebar in Clerk Dashboard, click **JWT Templates**.
   - Click **New Template** $\to$ select the pre-built **Convex** template.
   - Verify the template name is `convex` and the **Audience** (`aud`) field is set to `convex`.
   - Save the template.
4. **Copy Frontend API URL & Configure Convex**:
   - Copy the **Issuer** / **Frontend API URL** from the template (looks like `https://verb-noun-00.clerk.accounts.dev`).
   - Configure it on your Convex deployment:
     ```bash
     pnpm convex env set CLERK_FRONTEND_API_URL <user-fapi-url>
     ```

---

## Troubleshooting & Common Pitfalls

### 1. Convex Queries Reject with `Unauthenticated` Despite Being Signed In
- **Symptom**: The client UI displays `<SignedIn>` content, `clerk.user` is populated, but Convex mutations and queries throw `Error: Unauthenticated` or `ctx.auth.getUserIdentity()` returns `null`.
- **Root Cause**:
  1. **Missing `"aud": "convex"` Claim**: `convex/auth.config.ts` declares `applicationID: 'convex'`. Convex validates that the incoming JWT includes `"aud": "convex"`. If the JWT template was created without this claim, Convex rejects the token.
  2. **Mismatched Issuer URL**: The `domain` specified in `convex/auth.config.ts` does not match the Clerk Frontend API URL set via `CLERK_FRONTEND_API_URL`.
- **Resolution**:
  1. Ensure the template has `"aud": "convex"`:
     ```bash
     pnpm dlx clerk api jwt_templates create \
       --name convex \
       --claims '{"aud": "convex", "email": "{{user.primary_email_address}}", "name": "{{user.full_name}}", "picture": "{{user.image_url}}"}'
     ```
     Or in Clerk Dashboard $\to$ **JWT Templates** $\to$ **convex**, verify the Claims editor includes `"aud": "convex"`.
  2. Confirm the environment variable is set on Convex:
     ```bash
     pnpm convex env set CLERK_FRONTEND_API_URL https://<your-fapi-url>.clerk.accounts.dev
     ```

### 2. Svelte Context Boundary Constraint (`useClerkContext`)
- **Symptom**: `TypeError: Cannot read properties of undefined (reading 'session')` or runtime error during root layout initialization.
- **Root Cause**: Calling `useClerkContext()` inside the `<script>` of `src/routes/+layout.svelte` where `<ClerkProvider>` is rendered. `<ClerkProvider>` sets the context inside its own component lifecycle.
- **Resolution**: Always call `useClerkContext()` in a child descendant component (such as `src/lib/components/ConvexAuth.svelte`), rendered as a child of `<ClerkProvider>`.

