# Portless (by Vercel Labs) Reference

In `overskill`, all local development environments **mandate Portless** for local domain routing, automatic port allocation, and multi-project isolation.

---

## Why Portless is Required

1. **Zero Port Roulette & Automatic Port Allocation**:
   Instead of hardcoding, guessing, or colliding on port numbers (`:5173`, `:5174`, `:3000`), Portless requests a free ephemeral port (4000–4999) from the OS kernel at launch time, sets `$PORT` in the environment, and automatically registers the route.
2. **Stable, Named `.localhost` URLs**:
   Every project receives a predictable, clean URL:
   - **Base Domain**: `https://<project-name>.localhost`
   - **Auxiliary Endpoints as Subdomains**: `https://<endpoint>.<project-name>.localhost` (e.g. `https://api.<project-name>.localhost`, `https://preview.<project-name>.localhost`).
3. **Cookie & LocalStorage Isolation**:
   Browsers scope cookies and `localStorage` by origin (including ports). Hardcoded ports cause authentication sessions (e.g. Clerk, session cookies) from Project A to corrupt or overwrite Project B. Dedicated `.localhost` domains provide isolated cookie jars.
4. **Native RFC 6761 Loopback**:
   Under **RFC 6761**, all domain names ending in `.localhost` automatically resolve to loopback (`127.0.0.1` and `::1`) in modern web browsers and OS network resolvers without modifying `/etc/hosts`.
5. **Native Automatic HTTPS & HTTP/2**:
   Portless generates a trusted local CA and serves over HTTPS with HTTP/2 multiplexing by default. WebSockets (used for Vite HMR and Convex realtime) work seamlessly over both HTTP/1.1 Upgrade and HTTP/2 extended CONNECT (RFC 8441).
6. **Vite Framework Auto-Detection**:
   Portless automatically detects Vite and auto-injects `--port <assigned-port>` and `--host` into the command line when serving.

---

## 1. Installation

Install Portless globally (recommended by maintainers for a shared proxy daemon):

```bash
# Global install via pnpm (recommended)
pnpm add -g portless

# Or via npm
npm install -g portless

# Verify installation
portless --version
```

Alternatively, install as a project devDependency:
```bash
pnpm add -D portless
```

---

## 2. Initializing & Trusting the Local CA Certificate

To enable automatic, zero-warning local HTTPS (`https://<project-name>.localhost`), initialize and trust the local Certificate Authority (CA) on your system:

```bash
# 1. Generate and install the local CA into your OS trust store (prompts once for sudo)
portless trust

# 2. Verify certificate trust and configuration
portless doctor
```

Once trusted, all certificates for `*.localhost` domains are signed and trusted automatically by your operating system and browsers (Chrome, Firefox, Safari, Edge) with a green lock.

---

## 3. Recommended `package.json` Integration

Embed Portless directly into `package.json` so running `pnpm run dev` handles everything:

```json
{
  "name": "my-app",
  "scripts": {
    "dev": "portless run vite dev",
    "preview": "portless preview.my-app vite preview"
  }
}
```

Or using Portless's native configuration key (monorepo & multi-script friendly):

```json
{
  "name": "my-app",
  "scripts": {
    "dev": "portless",
    "dev:app": "vite dev"
  },
  "portless": {
    "name": "my-app",
    "script": "dev:app"
  }
}
```

When running `pnpm run dev`:
1. Portless checks if the local proxy daemon is running (and auto-starts it if needed).
2. It claims a random, unused port (4000–4999) from the OS.
3. It injects the port and launches `vite dev`.
4. Your application is immediately accessible at `https://my-app.localhost`.

---

## 3. Subdomains for Auxiliary Endpoints

For multi-service projects, organize auxiliary services using subdomains:

```bash
# Primary web application
portless run vite dev
# -> https://my-app.localhost

# Backend API server
portless api.my-app pnpm run start:api
# -> https://api.my-app.localhost

# Production build preview
portless preview.my-app vite preview
# -> https://preview.my-app.localhost
```

---

## 4. Vite 6 Host Header Configuration (`allowedHosts`)

By default, Vite 6 blocks incoming HTTP requests whose `Host` header does not match `localhost`. When proxying through Portless, configure `vite.config.ts`:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    strictPort: true,
    allowedHosts: true, // Allow Portless proxy on *.localhost
  },
});
```

---

## 5. Git Worktree Automatic Subdomains

If you use `git worktree`, Portless automatically detects the worktree and prepends the branch name as a subdomain:

```bash
# In linked worktree on branch "feature-ui"
portless run vite dev
# -> https://feature-ui.my-app.localhost
```

No configuration changes are needed; every worktree runs concurrently without port collisions.

---

## 6. Helpful Lifecycle Commands

| Action | Command | Description |
| :--- | :--- | :--- |
| **Inspect Active Routes** | `portless list` | Shows all currently active applications, domains, and assigned ports. |
| **Run Diagnostics** | `portless doctor` | Checks TLS certificates, CA trust, and proxy health. |
| **Trust Certificate Authority** | `portless trust` | Adds the Portless local CA to the system trust store. |
| **Stop Proxy Daemon** | `portless proxy stop` | Stops the background proxy daemon. |
| **Bypass Portless** | `PORTLESS=0 pnpm dev` | Runs the dev command directly on standard localhost. |
