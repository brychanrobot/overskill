# Clerk Setup Reference (`pnpm dlx clerk init`)

Reference derived from official Clerk specifications (`https://github.com/clerk/skills` and `https://clerk.com/SKILL.md`).

---

## 1. Quickstart with `pnpm dlx clerk init`

Run the Clerk CLI initializer in an existing project:

```bash
pnpm dlx clerk@latest init
```

The CLI:
1. Detects your framework (Next.js, React, SvelteKit, Astro, Nuxt, Vue, etc.) and package manager (`pnpm`).
2. Installs the appropriate SDK (e.g. `@clerk/nextjs`, `svelte-clerk`, `@clerk/react`).
3. Provisions temporary development keys if accountless mode is active, or prompts to select an application if authenticated.
4. Generates or updates environment files (`.env.local`).

---

## 2. Accountless vs Authenticated Setup

| Mode | Trigger | Behavior |
| :--- | :--- | :--- |
| **Accountless** | User is not logged into Clerk CLI | Generates a claimable sandbox instance with temporary `pk_test_...` keys. Keys remain valid for 24-48 hours until claimed with `pnpm dlx clerk auth login`. |
| **Authenticated** | User has run `pnpm dlx clerk auth login` | Links directly to an existing Clerk application or creates a permanent development instance. |

---

## 3. Framework Quickstart Slugs

When `clerk init` reports partial or manual setup, consult the official framework markdown documentation:
`https://clerk.com/docs/<slug>/getting-started/quickstart.md?manual=1`

- Next.js: `nextjs`
- React: `react`
- Svelte / SvelteKit: Community SDK (`svelte-clerk`)
- Astro: `astro`
- Nuxt: `nuxt`
- Vue: `vue`
- React Router: `react-router`
- TanStack Start: `tanstack-react-start`
- Expo: `expo`
- Express: `expressjs`
- Fastify: `fastify`
