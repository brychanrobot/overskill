<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from 'svelte-clerk';
  import { useClerkContext } from 'svelte-clerk/client';
  import { setupConvex } from 'convex-svelte';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';

  const { children }: { children: Snippet } = $props();

  // 1. Initialize the Convex client for Svelte 5
  const client = setupConvex(PUBLIC_CONVEX_URL);

  // 2. Synchronize Clerk session JWT with Convex client
  const ctx = useClerkContext();

  $effect(() => {
    client.setAuth(async () => {
      try {
        if (!ctx.session) return null;
        return (await ctx.session.getToken({ template: 'convex' })) ?? null;
      } catch {
        return null;
      }
    });
  });
</script>

<ClerkProvider>
  <div class="app-layout">
    <header class="app-header">
      <div class="brand">
        <span class="logo">⚡</span>
        <strong>SvelteKit + Convex</strong>
      </div>
      <nav class="auth-nav">
        <SignedOut>
          <SignInButton mode="modal" class="btn-signin">Sign In</SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </header>

    <main class="app-main">
      {@render children?.()}
    </main>
  </div>
</ClerkProvider>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
      sans-serif;
    color: #1f2937;
    background-color: #f9fafb;
  }

  .app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.125rem;
  }

  .auth-nav {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  :global(.btn-signin) {
    background-color: #2563eb;
    color: #ffffff;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  :global(.btn-signin:hover) {
    background-color: #1d4ed8;
  }

  .app-main {
    flex: 1;
    max-width: 900px;
    width: 100%;
    margin: 2rem auto;
    padding: 0 1rem;
    box-sizing: border-box;
  }
</style>
