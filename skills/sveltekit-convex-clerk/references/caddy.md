# Caddy Reverse Proxy & Local Domain Routing Reference

In `overskill`, all local development environments **require Caddy** for local domain and subdomain routing.

---

## Why Caddy is Required

1. **Zero Port Contention**:
   Instead of juggling and colliding on raw port numbers (`:5173`, `:5174`, `:3000`, `:4173`) across concurrent projects and services, every project receives a clean, dedicated domain:
   - **Base Domain**: `http://<project-name>.localhost`
   - **Auxiliary Endpoints as Subdomains**: `http://<endpoint>.<project-name>.localhost` (e.g. `api.<project-name>.localhost`, `preview.<project-name>.localhost`, `ws.<project-name>.localhost`).
2. **Cookie & LocalStorage Isolation**:
   When developing on `http://localhost:<port>`, browsers share cookies and local storage across all ports. This causes authentication sessions (e.g. Clerk, session cookies) from Project A to corrupt or overwrite Project B. Dedicated `<project-name>.localhost` domains provide separate, isolated cookie jars.
3. **Multi-Service Project Tidiness**:
   Frontend, backend, API, and preview servers coexist seamlessly under the same root project name without arbitrary port drift.
4. **Native Loopback Resolution (Zero Sudo / No `/etc/hosts` Editing)**:
   Under **RFC 6761**, all domain names ending in `.localhost` (including multi-level subdomains like `<endpoint>.<project-name>.localhost`) automatically resolve to loopback (`127.0.0.1` and `::1`) in modern web browsers and OS network resolvers. **No `/etc/hosts` modification or administrator/sudo privileges are required.**

---

## 1. Toolchain Installation with `mise`

Caddy is installed into `~/.local/bin` using `mise`:

```bash
# Install latest Caddy binary
mise use --global caddy@latest

# Verify installation
caddy version
```

---

## 2. Project Caddyfile Architecture

Place `Caddyfile` in the project root:

```caddy
# ==============================================================================
# Caddyfile: Local Domain & Subdomain Routing for <project-name>
# ==============================================================================

# Primary application frontend
http://{$PROJECT_NAME:app}.localhost, {$PROJECT_NAME:app}.localhost {
    reverse_proxy localhost:{$PORT:5173}
}

# Backend API endpoint (if applicable)
http://api.{$PROJECT_NAME:app}.localhost, api.{$PROJECT_NAME:app}.localhost {
    reverse_proxy localhost:{$API_PORT:3000}
}

# Production build preview endpoint
http://preview.{$PROJECT_NAME:app}.localhost, preview.{$PROJECT_NAME:app}.localhost {
    reverse_proxy localhost:{$PREVIEW_PORT:4173}
}
```

---

## 3. RFC 6761 Loopback Resolution

Because `*.localhost` is reserved by RFC 6761:
- `http://<project-name>.localhost` immediately resolves to `127.0.0.1`.
- `http://api.<project-name>.localhost` immediately resolves to `127.0.0.1`.
- `http://preview.<project-name>.localhost` immediately resolves to `127.0.0.1`.

There is **no need** to modify `/etc/hosts` or invoke `sudo`. Both command-line tools (e.g. `curl`, Playwright) and graphical browsers (Chrome, Firefox, Safari) route traffic to loopback automatically.

---

## 4. Vite 6 Host Header Configuration (`allowedHosts`)

By default, Vite 6 blocks incoming HTTP requests whose `Host` header does not match `localhost`. When reverse proxying from Caddy, configure `vite.config.ts`:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const port = Number(process.env.PORT) || 5173;

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    port,
    strictPort: true,
    allowedHosts: true, // Allow Caddy reverse proxy via *.localhost
  },
});
```

---

## 5. Lifecycle Commands for Agents

| Action | Command | Description |
| :--- | :--- | :--- |
| **Start Caddy in Background** | `caddy start` | Spawns Caddy daemon in background using local `Caddyfile`. |
| **Reload Configuration** | `caddy reload` | Applies changes made to `Caddyfile` with zero downtime. |
| **Stop Caddy** | `caddy stop` | Stops the running background Caddy process. |
| **Inspect Status & Logs** | `caddy run` (or logs) | Runs in foreground for troubleshooting. |
