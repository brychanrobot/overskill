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
