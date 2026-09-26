import type { AuthConfig } from 'convex/server';

export default {
  providers: [
    {
      // CLERK_FRONTEND_API_URL or CLERK_JWT_ISSUER_DOMAIN set on the Convex dashboard / CLI
      domain: process.env.CLERK_FRONTEND_API_URL || process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig;
