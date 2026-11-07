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

Install Portless globally (recommended for a shared proxy daemon across all projects):

```bash
# Global install via mise (recommended — keeps Portless synced with mise's active Node)
mise use --global npm:portless@latest

# Or global install via pnpm
pnpm add -g portless

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

Once trusted, all certificates for `*.localhost` domains are signed and trusted automatically by your operating system and browsers with a green lock.

### Linux Browser Trust (Chrome, Chromium, Brave, Flatpak)

On macOS and Windows, `portless trust` automatically registers the CA in the system keychain and root store used by all browsers.

On **Linux**, `portless trust` updates the OS certificate store (`/etc/pki/ca-trust` or `/etc/ssl/certs`). However, **Chrome and Chromium do not read the Linux OS certificate store**—they manage trust independently via **NSS databases (`nssdb`)**:
- **Native Chrome / Chromium** uses `~/.pki/nssdb` (or `~/.local/share/pki/nssdb`).
- **Flatpak Chrome** runs sandboxed and uses `~/.var/app/com.google.Chrome/data/pki/nssdb`.

#### Option A: One-line CLI Import with `certutil` (Recommended)
Install NSS tools (`sudo dnf install nss-tools` on Fedora/RHEL or `sudo apt install libnss3-tools` on Ubuntu/Debian), then import the Portless CA:

```bash
# Import into native Chrome / Chromium NSS database
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "portless Local CA" -i "$HOME/.portless/ca.pem"
[ -d "$HOME/.local/share/pki/nssdb" ] && certutil -d sql:$HOME/.local/share/pki/nssdb -A -t "C,," -n "portless Local CA" -i "$HOME/.portless/ca.pem"

# If using Flatpak Chrome, import into the Flatpak sandbox NSS database
[ -d "$HOME/.var/app/com.google.Chrome/data/pki/nssdb" ] && \
  certutil -d sql:$HOME/.var/app/com.google.Chrome/data/pki/nssdb -A -t "C,," -n "portless Local CA" -i "$HOME/.portless/ca.pem"
```

*Note: Completely restart Chrome after running `certutil` for the updated database to take effect.*

#### Option B: Chrome GUI Import (Zero Tools Needed)
If you prefer not to install `nss-tools`:
1. In Chrome, navigate to `chrome://certificate-manager/` (or `chrome://settings/certificates`).
2. Under **Local certificates**, select **Authorities** (or **Custom / User**).
3. Click **Import** (or Add).
4. Select `$HOME/.portless/ca.pem` *(in the file picker, press `Ctrl + H` if hidden files are not shown)*.
5. Check **"Trust this certificate for identifying websites"** and click **OK**.
6. Restart Chrome.

---

## 3. Background Proxy Management: System Service, User Service, or CLI Daemon

Portless routes traffic to port 443. Depending on your OS and security configuration (SELinux), there are three ways to manage the background proxy daemon:

### Option A: Built-in Systemd Service (`portless service install`)
Portless provides native service installation that sets up `/etc/systemd/system/portless.service` to bind port 443 at system startup:

```bash
# Install and start systemd service (prompts for sudo)
portless service install

# If using custom domains alongside localhost (e.g. <your-domain.com> for Cloudflare Tunnels), include them:
portless service install --tld localhost --tld <your-domain.com>
# Or dynamically lookup your Cloudflare domain:
portless service install --tld localhost --tld $(node scripts/cloudflare-domain.ts)

# Check service status
portless service status

# Uninstall service
portless service uninstall
```

> [!NOTE]
> **Boot-Time Systemd Proxy TLD Synchronization**:
> If `portless` runs a boot-time `systemd` proxy service on port 443, the service unit requires `Environment="PORTLESS_TLD=localhost,<your-domain.com>"` (or `--tld localhost --tld <your-domain.com>` in its CLI arguments, or dynamically `Environment="PORTLESS_TLD=$(node scripts/cloudflare-domain.ts --tld)"`) so it routes requests across all configured top-level domains matching the user shell environment.

> [!TIP]
> **Fedora / RHEL SELinux Allowlisting (Resolving Upstream Issue #368)**:
> When Node.js is managed in user space (e.g. `~/.local/share/mise/installs/node/...`), SELinux in `enforcing` mode blocks systemd (`init_t`) from executing user home binaries, causing `portless.service` to fail with `status=203/EXEC`.
>
> To allow systemd to execute mise-managed Node without disabling SELinux or switching to permissive mode, assign the `bin_t` file context rule to all mise Node binaries and restore the context:
>
> ```bash
> # 1. Allowlist all mise Node versions for systemd execution
> sudo semanage fcontext -a -t bin_t "$HOME/\.local/share/mise/installs/node/[^/]*/bin/node"
>
> # 2. Relabel the directory
> sudo restorecon -v -R "$HOME/.local/share/mise/installs/node"
>
> # 3. Install and start the service
> portless service install
> ```
>
> Once labeled, `portless.service` starts cleanly and binds port 443 with 0 SELinux denials.

### Option B: Systemd User Service (`systemd --user`)
To run Portless under your own user account without SELinux denials, allow unprivileged binding to port 80/443 and create a user unit:

```bash
# 1. Allow unprivileged processes to bind ports >= 80 (one-time sudo)
echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee /etc/sysctl.d/50-portless.conf
sudo sysctl --system

# 2. Create the user service unit
mkdir -p ~/.config/systemd/user
cat << 'EOF' > ~/.config/systemd/user/portless.service
[Unit]
Description=Portless HTTPS Proxy (User Service)
After=network.target

[Service]
Type=simple
Environment="PORTLESS_TLD=localhost,<your-domain.com>"
ExecStart=%h/.local/share/mise/shims/portless proxy start --foreground --port 443 --https --tld localhost --tld <your-domain.com>
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target
EOF

# 3. Enable and start the user service
systemctl --user daemon-reload
systemctl --user enable --now portless
```

### Option C: On-Demand CLI Daemon (`portless proxy start`)
If you prefer not to manage systemd units, Portless can be run directly from your user terminal session:

```bash
# Start proxy in background (prompts once for sudo to bind port 443)
portless proxy start

# Or test in foreground
portless proxy start --foreground

# Stop proxy
portless proxy stop
```
Because the user terminal session runs in the unconfined SELinux domain (`unconfined_t`), user-managed Node binaries run without SELinux denials.

---

## 4. Recommended `package.json` Integration

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
4. Your application is immediately accessible at `https://my-app.localhost`. When additional tunnel TLDs are configured, `portless` automatically reads `~/.portless/proxy.tlds` and prints both `-> https://<name>.localhost` and `also -> https://<name>.<your-domain.com>`, and agents should always report all printed URLs to the user.

---

## 5. Subdomains for Auxiliary Endpoints

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

## 6. Vite 6 Host Header Configuration (`allowedHosts`)

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

## 7. Git Worktree Automatic Subdomains

If you use `git worktree`, Portless automatically detects the worktree and prepends the branch name as a subdomain:

```bash
# In linked worktree on branch "feature-ui"
portless run vite dev
# -> https://feature-ui.my-app.localhost
```

No configuration changes are needed; every worktree runs concurrently without port collisions.

---

## 8. Helpful Lifecycle Commands

| Action | Command | Description |
| :--- | :--- | :--- |
| **Inspect Active Routes** | `portless list` | Shows all currently active applications, domains, and assigned ports. |
| **Prune Orphaned Servers** | `portless prune` | Detects dead CLI sessions, removes stale routes from `~/.portless/routes.json`, and terminates orphaned child dev servers (`SIGTERM`). |
| **Force Prune (SIGKILL)** | `portless prune --force` | Forcefully kills stubborn orphaned dev servers (`SIGKILL`) and cleans up all stale routes. |
| **Run Diagnostics** | `portless doctor` | Checks TLS certificates, CA trust, and proxy health. |
| **Trust Certificate Authority** | `portless trust` | Adds the Portless local CA to the system trust store. |
| **Install System Service** | `sudo portless service install` | Installs background systemd service to start proxy at boot. |
| **Check Service Status** | `portless service status` | Inspects status of the system startup service and port 443 proxy. |
| **Uninstall System Service** | `sudo portless service uninstall` | Removes background systemd service. |
| **Start Proxy (Foreground)** | `portless proxy start --foreground` | Runs proxy in foreground for real-time traffic debugging. |
| **Stop Proxy Daemon** | `portless proxy stop` | Stops the background proxy daemon. |
| **Bypass Portless** | `PORTLESS=0 pnpm dev` | Runs the dev command directly on standard localhost. |

> [!NOTE]
> **Multi-TLD URL Reporting**:
> When launching dev servers or inspecting active routes with `portless list`, `portless` automatically reads `~/.portless/proxy.tlds` and prints both `-> https://<name>.localhost` and `also -> https://<name>.<your-domain.com>`. Agents should always report all printed URLs to the user so both local loopback and external/tunnel endpoints are clearly surfaced.

---

## 9. Cleaning Up Orphaned Dev Servers & Stale Routes (`portless prune`)

In multi-agent and active development workflows, orphaned background processes and stale routing entries can linger in `~/.portless/routes.json`.

### Why Orphaned Dev Servers Occur

Orphaned processes and stale routes typically happen in the following scenarios:
1. **Abrupt Terminal Closure or Host Restarts**: If a terminal tab or window running `portless run ...` is closed abruptly, the shell session dies without sending normal cleanup signals to child processes.
2. **Hard Termination (`SIGKILL`)**: If a process or container is forcefully killed (`kill -9` or via task managers), Portless's `process.on('exit')` cleanup hooks never fire.
3. **Canceled or Terminated Background Tasks & Subagents**: When an orchestrator or background task manager kills a subagent or dev server task, the parent CLI process may exit before child compilers (e.g., `vite dev`) terminate.
4. **Test Runner Signal Propagation Gaps**: When test runners (like Playwright) launch `pnpm dev` and send `SIGTERM` upon completion, `pnpm` often fails to forward termination signals down the entire process tree (`pnpm -> portless -> vite`), leaving the grandchild `vite` process running silently in the background while holding its ephemeral port.

### How `portless prune` Works Under the Hood

When you execute `portless prune`:
1. **Advisory File Locking**: Acquires an advisory lock on `~/.portless/routes.json` to safely inspect and mutate routing state without race conditions.
2. **Process Liveness Verification (`kill(pid, 0)`)**: Checks each route's owning CLI process PID to verify whether the parent process is still alive. If the PID is dead, the route is marked stale.
3. **Tunnel Teardown**: Automatically tears down any stale Tailscale serve bindings or dead ngrok tunnels associated with dead routes.
4. **Surviving Child Process Detection**: Inspects the TCP port of each stale route using OS socket inspection (`lsof -ti tcp:<port> -sTCP:LISTEN` on Linux/macOS, or `netstat -ano` on Windows). This detects surviving orphaned child dev servers (such as `vite dev` or Next.js) that were left running after the parent `portless` CLI died.
5. **Targeted Process Termination**:
   - `portless prune`: Sends `SIGTERM` to allow child processes to shut down gracefully and release resources.
   - `portless prune --force`: Sends `SIGKILL` to forcefully terminate stubborn processes that refuse to exit.
6. **Route Pruning**: Removes the stale entries from `~/.portless/routes.json` so ports and domain routes are immediately freed for future runs.

### Command Usage & Output

Standard prune (graceful termination via `SIGTERM`):
```bash
portless prune
```
Example output:
```text
  consensauce.localhost :4766 - killed PID 142899 (SIGTERM)
  my-app.localhost :4123 - route removed (port already free)

Pruned 2 stale routes, killed 1 orphaned process.
```

When no stale routes exist:
```text
No orphaned routes found.
```

Forceful prune (immediate termination via `SIGKILL`):
```bash
portless prune --force
```

### When to Run `portless prune`

Execute `portless prune` (or `portless prune --force`):
- **Before starting a dev server** after an interrupted session, terminal crash, or host reboot.
- **After killing a background task or subagent** that ran a local web server or dev toolchain.
- **After a hung Playwright test run** where the test runner exited or timed out while waiting for child dev servers.
- **When `portless doctor` or `portless list`** warns about stale routes, conflicting domains, or unreachable port mappings.

---

## 10. Test Runner Lifecycle & Playwright Integration

Running automated integration and end-to-end (E2E) tests alongside Portless requires understanding process tree lifecycles and reverse proxy timing.

### The Playwright `webServer` Hang Pitfall

In standard starter configurations, Playwright's `playwright.config.ts` often includes a `webServer` block that executes `command: 'pnpm run dev'`:

```ts
// ❌ ANTI-PATTERN: Can hang indefinitely on exit with Portless
export default defineConfig({
  webServer: {
    command: 'pnpm run dev',
    url: 'https://my-app.localhost',
    reuseExistingServer: false,
  },
});
```

**Why This Hangs**:
1. When Playwright executes `command: 'pnpm run dev'`, `pnpm` executes `portless run vite dev`, which spawns `vite dev`. The resulting process tree is:
   `Playwright Runner` $\to$ `pnpm` $\to$ `portless` $\to$ `vite dev`.
2. Once the test suite passes, Playwright attempts to shut down the `webServer` by sending `SIGTERM` to the immediate child (`pnpm`).
3. `pnpm` does not reliably forward POSIX termination signals down to grandchild processes. As a result:
   - The `pnpm` process terminates.
   - The child `portless` CLI and `vite dev` processes survive in the background, keeping the ephemeral port bound.
   - Playwright waits indefinitely for the process tree and socket to close, hanging the test run at 100% completion.

### The Solution: Decoupled Daemon & `reuseExistingServer: true`

To prevent test runner hangs:
1. **Run Dev Servers as Background Daemons**: Launch `pnpm dev` as a separate, persistent background task or daemon (e.g. `IsDaemon: true` in agent tooling or in a dedicated terminal session) before running tests.
2. **Configure `reuseExistingServer: true`**: Set `reuseExistingServer: true` in `playwright.config.ts` so Playwright attaches to the existing, healthy Portless dev server instead of trying to spawn and manage a transient child process tree:
   ```ts
   // playwright.config.ts
   import { defineConfig, devices } from '@playwright/test';
   import pkg from './package.json';

   const projectName = pkg.name || 'app';
   const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ||
     process.env.PORTLESS_URL ||
     (process.env.LOCAL_DOMAIN ? `https://${process.env.LOCAL_DOMAIN}` : `https://${projectName}.localhost`);

   export default defineConfig({
     testDir: './e2e',
     webServer: {
       command: 'pnpm run dev',
       url: baseURL,
       reuseExistingServer: true, // Always reuse persistent Portless daemon locally
     },
     use: {
       baseURL,
       trace: 'on-first-retry',
     },
     projects: [
       {
         name: 'chromium',
         use: { ...devices['Desktop Chrome'] },
       },
     ],
   });
   ```
3. **Clean Up with `portless prune`**: If a test run or background server task is ever canceled, interrupted, or stalled, run `portless prune` (or `portless prune --force`) to immediately reclaim the port and remove stale routes.

### The Cold-Start 502 Bad Gateway Race

Because Portless binds port 443 immediately while Vite takes 1–3 seconds to compile on cold start, direct test navigations (`page.goto(baseURL)`), `playwright-cli.ts` invocations, or tests started immediately after launching a background daemon can receive an HTTP `502 Bad Gateway` from the proxy. In Playwright, `page.goto()` resolves without throwing an exception on HTTP 502, rendering the Portless 502 error page and causing subsequent element locators to time out.

**How to Mitigate the Race**:
- **Start the Server Ahead of Time**: By keeping the dev server running as a persistent daemon before invoking tests, the cold-start window is completely avoided.
- **Validate `res?.ok()` in Test Probes**: When authoring health check scripts or Playwright CLI commands, explicitly assert that the response status is successful (`200 OK`) with a short retry loop rather than merely checking socket connectivity:
  ```ts
  // Example warm-up probe with retry
  const maxRetries = 10;
  let isReady = false;
  for (let i = 0; i < maxRetries; i++) {
    const res = await page.request.get(baseURL).catch(() => null);
    if (res?.ok()) {
      isReady = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!isReady) {
    throw new Error(`Dev server at ${baseURL} failed to respond with 200 OK within timeout.`);
  }
  ```

---

## 11. Remote & Multi-Device Access: Cloudflare Tunnels vs. Tailscale

While `.localhost` domains natively resolve on the local machine via RFC 6761, testing applications on mobile devices (smartphones, tablets), sharing preview builds with collaborators, or receiving external webhook deliveries (e.g. Clerk, Stripe, GitHub webhooks) requires remote network exposure.

`overskill` provides two primary strategies for remote and multi-device access, plus standard local-only execution:
1. **Cloudflare Tunnel with a Custom Domain** (Recommended for seamless multi-device testing without VPN clients, clean vanity subdomains, and public webhook delivery).
2. **Tailscale Sharing** (Recommended for private tailnet access restricted to authenticated devices).
3. **Localhost Only (`.localhost`)** (Default for isolated, single-machine development).

> [!IMPORTANT]
> **Domain Privacy Rule**: Never commit or hardcode private custom domains into public repositories, shared agent skills, or git-tracked project configs. Always use generic placeholders (`<your-domain.com>`) in documentation and keep your actual domain configured via local environment variables (`PORTLESS_TLD`) and local daemon settings.

### Decision Matrix: Choosing Your Remote Access Strategy

| Feature | Cloudflare Tunnels (`cloudflared`) | Tailscale (`--tailscale` / `--funnel`) | Localhost (`.localhost`) |
| :--- | :--- | :--- | :--- |
| **Domain Format** | `https://<project>.<your-domain.com>` | `https://<node>.<tailnet>.ts.net:<port>` | `https://<project>.localhost` |
| **Client Requirement** | Zero client software needed on testing devices (works on iOS, Android, laptops) | Requires Tailscale client installed on every testing device (unless using `--funnel`) | Local machine only |
| **Subdomain Routing** | Automatic wildcard routing (`*.<your-domain.com>`) via Portless | Dedicated port mappings per app (`443`, `8443`, `8444`) | Automatic wildcard routing (`*.localhost`) |
| **Webhooks Support** | Native public HTTPS (receives Clerk, Stripe, GitHub webhooks seamlessly) | Supported only with `--funnel` (standard `--tailscale` is private only) | Requires local mock/relay |
| **Access Control** | Cloudflare Zero Trust (Email One-Time PIN, Google/GitHub SSO, IP allowlist) | Tailscale tailnet ACLs & device authorization | Local loopback only |
| **Best For** | Multi-device testing, client previews, external webhooks, vanity URLs | Private, restricted team access within a corporate or personal VPN | Standard rapid daily development |

---

### Option A: Cloudflare Tunnel with a Custom Domain (The Zero-Touch Portless Integration)

Cloudflare Tunnel (`cloudflared`) establishes a persistent, encrypted, outbound-only connection between your local development machine and Cloudflare's global edge network. No router port-forwarding, static IPs, or dynamic DNS services are required.

When combined with Portless's multi-TLD capabilities (`PORTLESS_TLD`), a single wildcard Cloudflare Tunnel routes all projects and auxiliary subdomains automatically:
- `https://my-app.<your-domain.com>` -> proxies to local `my-app`
- `https://api.my-app.<your-domain.com>` -> proxies to local `api.my-app`
- `https://preview.my-app.<your-domain.com>` -> proxies to local `preview.my-app`

#### Step 1: Install `cloudflared` CLI
Install `cloudflared` globally using `mise` (recommended) or your system package manager:

```bash
# Via mise (recommended)
mise use --global cloudflared@latest

# Or on Fedora / RHEL
sudo dnf install -y cloudflared

# Or on Ubuntu / Debian
sudo apt install -y cloudflared

# Or on macOS
brew install cloudflared

# Verify installation
cloudflared --version
```

#### Step 2: Authenticate with Cloudflare
Log in to your Cloudflare account to download the account certificate:

```bash
cloudflared tunnel login
```
This opens your browser. Select your domain (`<your-domain.com>`) to authorize. Cloudflare will download an origin certificate to `~/.cloudflared/cert.pem`.

#### Step 3: Automatically Extract Your Domain Name (`scripts/cloudflare-domain.ts`)
Instead of asking users to look up or re-type their domain name, run the bundled extractor to query Cloudflare automatically:

```bash
# Print active domain name:
node scripts/cloudflare-domain.ts
# -> example.com

# Or set PORTLESS_TLD in Fish shell:
set -Ux PORTLESS_TLD (node scripts/cloudflare-domain.ts --tld)

# Or in Bash / Zsh:
export PORTLESS_TLD=$(node scripts/cloudflare-domain.ts --tld)
```
*How it works*: `scripts/cloudflare-domain.ts` decodes the token from `~/.cloudflared/cert.pem`, retrieves the `zoneID` and `apiToken`, and queries Cloudflare's `/client/v4/zones` API endpoint to return the exact zone name.

#### Step 4: Create a Named Tunnel
Create a persistent tunnel for your development workstation:

```bash
cloudflared tunnel create dev-tunnel
```
This generates a unique **Tunnel ID** (UUID) and creates credentials at `~/.cloudflared/<tunnel-uuid>.json`.

#### Step 5: Configure Wildcard DNS Routing
Route all subdomains under your custom domain directly through your tunnel:

```bash
# In Bash/Zsh:
DOMAIN=$(node scripts/cloudflare-domain.ts)
cloudflared tunnel route dns dev-tunnel "*.$DOMAIN"

# In Fish:
set DOMAIN (node scripts/cloudflare-domain.ts)
cloudflared tunnel route dns dev-tunnel "*.$DOMAIN"
```
*(Alternatively, in the Cloudflare Dashboard under DNS Records for `<your-domain.com>`, add a CNAME record: Name: `*`, Target: `<tunnel-uuid>.cfargotunnel.com`, Proxy Status: Proxied).*

#### Step 6: Configure `~/.cloudflared/config.yml`
Create or edit `~/.cloudflared/config.yml` to route incoming traffic directly to Portless's local HTTPS proxy on port 443:

```yaml
tunnel: <tunnel-uuid>
credentials-file: /home/<username>/.cloudflared/<tunnel-uuid>.json

ingress:
  # Wildcard route for all apps and auxiliary subdomains to Portless HTTPS proxy
  - hostname: "*.<your-domain.com>"
    service: https://localhost:443
    originRequest:
      # Portless generates a local self-signed CA certificate for loopback.
      # Cloudflare edge already terminates public TLS with a trusted certificate,
      # so noTLSVerify allows the tunnel daemon to connect to Portless cleanly.
      noTLSVerify: true

  # Fallback catch-all (required by cloudflared)
  - service: http_status:404
```

> [!TIP]
> **Local CA Verification Alternative**: Instead of `noTLSVerify: true`, you can configure `cloudflared` to validate Portless's certificate authority by pointing to the Portless root certificate:
> ```yaml
> originRequest:
>   caPool: /home/<username>/.portless/ca.pem
> ```

#### Step 7: Configure Portless for Your Custom Domain (`PORTLESS_TLD` & Proxy Daemon)
Inform Portless that `<your-domain.com>` is an active top-level domain alongside `.localhost`:

##### A. Environment Variable
In **Fish shell** (`~/.config/fish/config.fish` or universal variable):
```fish
set -Ux PORTLESS_TLD (node scripts/cloudflare-domain.ts --tld)
```

In **Bash / Zsh** (`~/.bashrc`, `~/.zshrc`):
```bash
export PORTLESS_TLD=$(node scripts/cloudflare-domain.ts --tld)
```

##### B. Reconfiguring the Persisted Portless Service (Recommended)
To persist the custom domain across system reboots so the Portless system service binds port 443 with both `.localhost` and your custom domain on OS startup, instruct the user to run:

```bash
# In Bash / Zsh:
portless service install --tld localhost --tld $(node scripts/cloudflare-domain.ts)

# In Fish:
portless service install --tld localhost --tld (node scripts/cloudflare-domain.ts)
```

*(Alternatively, if running without systemd services as an ad-hoc terminal daemon: `portless proxy stop && portless proxy start --https --tld localhost --tld <domain>`).*

> [!NOTE]
> **Boot-Time Systemd Proxy TLD Synchronization**:
> If Portless is managed via systemd (system service `/etc/systemd/system/portless.service` or user service `~/.config/systemd/user/portless.service`), ensure the service unit includes `Environment="PORTLESS_TLD=localhost,<your-domain.com>"` (or `--tld localhost --tld <your-domain.com>` arguments, or dynamically `Environment="PORTLESS_TLD=$(node scripts/cloudflare-domain.ts --tld)"`) so that port 443 routes requests for your custom domain alongside `.localhost` immediately on OS boot matching your user shell environment.

> [!IMPORTANT]
> **User Terminal Execution (Never use `sudo` directly)**:
> The agent MUST instruct the user to run `portless service install` in their own interactive terminal without `sudo`.
> - **Do NOT prefix with `sudo`**: Portless internally handles privilege elevation and will prompt for the administrator password interactively in the user's terminal when updating `/etc/systemd/system/portless.service`.
> - **Agent Non-Interactive Block**: Agents cannot run `sudo` or commands requiring interactive elevation because they lack an interactive TTY and will block indefinitely on sudo password prompts.

#### Step 8: Run `cloudflared` as a Background Service
To keep the tunnel running across system restarts without terminal windows:

##### Option A: User Service via Systemd (Zero Sudo Required - Recommended)
Create `~/.config/systemd/user/cloudflared.service`:
```ini
[Unit]
Description=Cloudflare Tunnel (User Service)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=%h/.local/share/mise/shims/cloudflared tunnel run dev-tunnel
Restart=on-failure
RestartSec=5
KillSignal=SIGTERM
TimeoutStopSec=5

[Install]
WantedBy=default.target
```

Enable and start immediately:
```bash
systemctl --user daemon-reload
systemctl --user enable --now cloudflared
```

##### Option B: System-wide Service (Prompts for Sudo)
```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

#### Step 9: Ensure Vite Allows the Custom Domain
In `vite.config.ts`, verify that `server.allowedHosts` is set to `true`:

```typescript
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    strictPort: true,
    allowedHosts: true, // Permits *.localhost and *.<your-domain.com>
  },
});
```

#### Step 10 (Recommended): Cloudflare Zero Trust Access Protection
If you do not want your in-development applications exposed publicly to the open internet:
1. Navigate to **Cloudflare One / Zero Trust Dashboard** -> **Access** -> **Applications**.
2. Click **Add an application** -> **Self-hosted**.
3. Set Application Domain: `*.<your-domain.com>`.
4. Add an Access Policy:
   - Action: **Allow**
   - Include Rule: **Emails ending in** `@yourcompany.com` or **Specific Email** `you@example.com` (sends a 6-digit One-Time PIN) or Google/GitHub OAuth.
5. Save Application.
*Now any device accessing `https://my-app.<your-domain.com>` is greeted with a sleek Cloudflare login screen before connecting directly to your local workstation!*

---

### Option B: Tailscale Sharing (`--tailscale` and `--funnel`)

If you prefer to keep access restricted to devices enrolled in your private Tailscale network (tailnet):

#### 1. Private Tailnet Sharing (`--tailscale`)
Share your application strictly with authenticated devices on your tailnet:

```bash
# Run app with Tailscale flag
portless my-app --tailscale vite dev
```
- Each app is assigned a dedicated HTTPS port on your Tailscale machine name (e.g. `https://my-workstation.<tailnet>.ts.net:8443`).
- Requires the `tailscale` CLI installed and connected (`tailscale up`), with HTTPS certificates enabled on your tailnet.

#### 2. Public Sharing via Tailscale Funnel (`--funnel`)
Expose a specific app publicly over the internet without configuring a custom domain:

```bash
portless my-app --funnel vite dev
```
- Requires Tailscale Funnel to be enabled in your Tailscale admin console ACLs.
- Public URL is served under your Tailscale node's public hostname.

