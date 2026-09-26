# Clerk Authentication Reference for SvelteKit

Official Resource: https://clerk.com/SKILL.md
Svelte Community SDK: https://github.com/clerk-community/svelte-clerk

## Core Concepts

In SvelteKit applications, Clerk handles user authentication and session management using:
1. **Server Handler**: `withClerkHandler()` in `src/hooks.server.ts` intercepts incoming requests, validates session cookies, and attaches the `auth()` method to `event.locals`.
2. **Server Loader**: `buildClerkProps(locals.auth())` in `src/routes/+layout.server.ts` hydrates server-rendered user state so client hydration is instant.
3. **Client Provider**: `<ClerkProvider>` wraps the root layout, exposing user context and reactive runes.
4. **Client Context**: `useClerkContext()` from `svelte-clerk/client` provides reactive runes (`ctx.session`, `ctx.user`, `ctx.auth`).
5. **Token Generation**: To authenticate backend services like Convex, tokens are retrieved using:
   ```ts
   const token = await ctx.session.getToken({ template: 'convex' });
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

# Deploy to production
pnpm dlx clerk deploy
```

> [!NOTE]
> Strictly avoid `npx clerk`. In accordance with `overskill` rules, always use `pnpm dlx clerk`.
