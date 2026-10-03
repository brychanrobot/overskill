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

# Check service status
portless service status

# Uninstall service
portless service uninstall
```

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
ExecStart=%h/.local/share/pnpm/portless proxy start --foreground --port 443 --https
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
4. Your application is immediately accessible at `https://my-app.localhost`.

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
| **Run Diagnostics** | `portless doctor` | Checks TLS certificates, CA trust, and proxy health. |
| **Trust Certificate Authority** | `portless trust` | Adds the Portless local CA to the system trust store. |
| **Install System Service** | `sudo portless service install` | Installs background systemd service to start proxy at boot. |
| **Check Service Status** | `portless service status` | Inspects status of the system startup service and port 443 proxy. |
| **Uninstall System Service** | `sudo portless service uninstall` | Removes background systemd service. |
| **Start Proxy (Foreground)** | `portless proxy start --foreground` | Runs proxy in foreground for real-time traffic debugging. |
| **Stop Proxy Daemon** | `portless proxy stop` | Stops the background proxy daemon. |
| **Bypass Portless** | `PORTLESS=0 pnpm dev` | Runs the dev command directly on standard localhost. |
