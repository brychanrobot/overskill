<script lang="ts">
  import '../app.css';
  import type { Snippet } from 'svelte';
  import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from 'svelte-clerk';
  import { useClerkContext } from 'svelte-clerk/client';
  import { setupConvex } from 'convex-svelte';
  import { PUBLIC_CONVEX_URL } from '$env/static/public';

  const { children }: { children: Snippet } = $props();

  // 1. Initialize Convex client
  const client = setupConvex(PUBLIC_CONVEX_URL);

  // 2. Synchronize Clerk session token with Convex
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
  <div class="app-shell">
    <header class="navbar">
      <div class="nav-content">
        <a href="/" class="brand-link">
          <span class="brand-icon">⚡</span>
          <span class="brand-title">My App</span>
        </a>
        <nav class="auth-controls">
          <SignedOut>
            <SignInButton mode="modal" class="btn btn-primary">Sign In</SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>

    <main class="container">
      {@render children?.()}
    </main>

    <footer class="app-footer">
      <p>Built with SvelteKit & Convex</p>
    </footer>
  </div>
</ClerkProvider>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .navbar {
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .nav-content {
    max-width: 860px;
    margin: 0 auto;
    padding: 0.875rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .brand-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: var(--color-text);
    font-weight: 700;
    font-size: 1.125rem;
  }

  .brand-icon {
    font-size: 1.25rem;
  }

  .auth-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .app-footer {
    margin-top: auto;
    text-align: center;
    padding: 2rem 1rem;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    border-top: 1px solid var(--color-border);
  }
</style>
