import { PUBLIC_CONVEX_URL } from '$env/static/public';
import {
  decodeConvexLoad,
  decodeConvexLoadPaginated,
  encodeConvexLoad,
  encodeConvexLoadPaginated,
  initConvex,
} from 'convex-svelte/sveltekit';

initConvex(PUBLIC_CONVEX_URL);

export const transport = {
  ConvexLoadResult: {
    encode: encodeConvexLoad,
    decode: decodeConvexLoad,
  },
  ConvexLoadPaginatedResult: {
    encode: encodeConvexLoadPaginated,
    decode: decodeConvexLoadPaginated,
  },
};
