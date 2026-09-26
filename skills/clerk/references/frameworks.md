# Clerk Framework Patterns & Code Reference

Source reference from `https://github.com/clerk/skills`.

---

## 1. SvelteKit (`svelte-clerk`)

### Hooks (`src/hooks.server.ts`)
```ts
import { withClerkHandler } from 'svelte-clerk/server';

export const handle = withClerkHandler();
```

### Layout Loader (`src/routes/+layout.server.ts`)
```ts
import { buildClerkProps } from 'svelte-clerk/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    ...buildClerkProps(locals.auth()),
  };
};
```

### Layout (`src/routes/+layout.svelte`)
```svelte
<script lang="ts">
  import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from 'svelte-clerk';
  let { children } = $props();
</script>

<ClerkProvider>
  <header>
    <SignedOut>
      <SignInButton mode="modal" />
      <SignUpButton mode="modal" />
    </SignedOut>
    <SignedIn>
      <UserButton />
    </SignedIn>
  </header>
  {@render children()}
</ClerkProvider>
```

---

## 2. Next.js (App Router, Current SDK v7+)

### Root Layout (`app/layout.tsx`)
```tsx
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <header>
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
```

### Middleware (`middleware.ts`)
```ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

---

## 3. React (`@clerk/react`)

```tsx
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <header>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
    </ClerkProvider>
  );
}
```
