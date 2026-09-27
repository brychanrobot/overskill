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

  // 2. Synchronize Clerk session token reactively with Convex
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

<ClerkProvider>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
          <span class="text-xl">⚡</span>
          <span>My App</span>
        </a>
        <nav class="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal" class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 transition-colors cursor-pointer">
              Sign In
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>

    <main class="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
      {@render children?.()}
    </main>

    <footer class="border-t border-border/40 py-6 text-center text-sm text-muted-foreground">
      <p>Built with SvelteKit, Convex, Clerk & Tailwind CSS</p>
    </footer>
  </div>
</ClerkProvider>
