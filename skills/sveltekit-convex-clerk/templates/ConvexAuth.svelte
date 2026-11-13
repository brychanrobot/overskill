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
