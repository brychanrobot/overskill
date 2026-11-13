import { api } from '$convex/_generated/api';
import { convexLoad } from 'convex-svelte/sveltekit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
  const { isAuthenticated } = await parent();
  return {
    tasks: await convexLoad(api.tasks.list, isAuthenticated ? {} : 'skip', { fetch }),
  };
};
