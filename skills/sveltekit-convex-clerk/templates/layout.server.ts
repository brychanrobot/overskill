import { buildClerkProps } from 'svelte-clerk/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
  const auth = locals.auth();
  return {
    ...buildClerkProps(auth),
    isAuthenticated: Boolean(auth.userId),
  };
};
