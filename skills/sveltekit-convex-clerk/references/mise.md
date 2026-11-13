# Toolchain Management with `mise`

[`mise`](https://mise.jdx.dev) (formerly `rtx`) is a fast, polyglot tool version and environment manager written in Rust. It installs toolchains in user space (`~/.local/share/mise` and `~/.local/bin`) without needing `sudo` or system package manager privileges.

In the `sveltekit-convex-clerk` workflow, `mise` is the recommended mechanism for installing and pinning runtime tools:
- **`node`** (Node.js 22+, e.g. 22.x or newer; required by `convex@1.49+` which dropped Node 20)
- **`pnpm`** (Strict package manager)
- **`gh`** (GitHub CLI for repository creation and auth)
- **`portless`** (Local development domain proxy and automatic port allocator for `<project-name>.localhost`)
- **`caddy`** *(Optional)* (Fast, versatile reverse proxy and automatic HTTPS server)
- **`cloudflared`** *(Optional)* (Cloudflare Tunnel daemon for zero-touch remote testing and custom domain routing)

---

## 1. Automated Idempotent Setup (`scripts/setup-mise.sh`)

`overskill` provides an automated, idempotent setup script [`scripts/setup-mise.sh`](../../../scripts/setup-mise.sh) that configures `mise`, establishes the required global settings and toolchains, and registers a daily `systemd --user` auto-upgrade timer with a single command.

Run the bundled script locally:

```bash
# Run idempotent setup
bash scripts/setup-mise.sh

# Or inspect planned actions with dry-run
bash scripts/setup-mise.sh --dry-run
```

Or execute directly from GitHub via `curl`:

```bash
curl -fsSL https://raw.githubusercontent.com/brychanrobot/overskill/main/scripts/setup-mise.sh | bash
```

The setup script performs 4 idempotent steps:
1. Installs `mise` to `~/.local/bin/mise` via `https://mise.run` if not already installed.
2. Creates or updates `~/.config/mise/config.toml` ensuring `prefer_offline = true`, `self_update.auto = true`, and the standard toolchains (`caddy`, `cloudflared`, `gh`, `node`, `npm:portless`, `pnpm`), then runs `mise install`.
3. Creates user systemd unit files: `~/.config/systemd/user/mise-upgrade.service` and `~/.config/systemd/user/mise-upgrade.timer`.
4. Executes `systemctl --user daemon-reload` and enables/starts `mise-upgrade.timer`.

---

## 2. Why `"latest"` Breaks Shims Without `prefer_offline = true`

By default, `mise` operates with `prefer_offline = false`. When tools are pinned to `"latest"`, this default behavior introduces severe runtime failures:

### The Failure Mechanism:
1. **Remote Cache Expiration & Shim Resolution Breakage**:
   - `mise` periodically expires its remote metadata cache. When an upstream tool releases a new version (for example, `npm:portless` publishes `0.16.0` while `0.15.7` is installed locally), any subsequent invocation of `portless` triggers a remote cache check.
   - Because `prefer_offline = false`, `mise` resolves `"latest"` to `0.16.0` (the upstream version) rather than the installed `0.15.7`.
   - Because `0.16.0` has not yet been downloaded, shim execution immediately aborts with:
     ```text
     mise ERROR portless is not a valid shim
     ```
2. **Offline Dependency Resolution Deadlock**:
   - When running `mise use <npm-tool>` (e.g. `npm:portless`), `mise` checks if required dependencies such as Node are installed.
   - If `node = "latest"` is configured and upstream Node releases a new patch or major version, `mise`'s internal offline validation pass attempts to resolve `node@latest`. Because it cannot reach the network during that specific pass or sees a mismatch with the newly resolved version, it fails with:
     ```text
     failed to resolve configured install dependency 'node@latest' ... while offline
     ```

### The Solution: `prefer_offline = true`
Setting `prefer_offline = true` in `~/.config/mise/config.toml` permanently fixes both issues:
- **Instant Local Resolution**: All standard CLI commands and shim invocations resolve `"latest"` instantly to the **highest version already installed locally**, with zero network latency, zero remote cache misses, and zero broken shims.
- **Clean Upgrades via `mise upgrade`**: When you intentionally run `mise upgrade` (or when the automated daily systemd timer runs), `mise` still queries upstream registries and installs the newest versions.

---

## 3. Required Global Configuration (`~/.config/mise/config.toml`)

Ensure `~/.config/mise/config.toml` contains the following settings and tools:

```toml
[settings]
prefer_offline = true

[settings.self_update]
auto = true

[tools]
caddy = "latest"
cloudflared = "latest"
gh = "latest"
node = "latest"
"npm:portless" = "latest"
pnpm = "latest"
```

To configure these keys manually via the `mise` CLI:

```bash
mise settings set prefer_offline true
mise settings set self_update.auto true
mise use --global caddy@latest cloudflared@latest gh@latest node@latest npm:portless@latest pnpm@latest
```

---

## 4. Daily Auto-Upgrade Systemd User Timer

To keep `mise` and all managed toolchains continuously up to date without interrupting active terminal workflows, establish a daily `systemd --user` timer:

### Service Unit: `~/.config/systemd/user/mise-upgrade.service`
```ini
[Unit]
Description=Upgrade mise and managed toolchains
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment="PATH=%h/.local/bin:%h/.local/share/mise/shims:/usr/local/bin:/usr/bin:/bin"
ExecStart=-%h/.local/bin/mise self-update -y
ExecStart=%h/.local/bin/mise upgrade
```

### Timer Unit: `~/.config/systemd/user/mise-upgrade.timer`
```ini
[Unit]
Description=Daily mise toolchain auto-upgrade timer

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=1h

[Install]
WantedBy=timers.target
```

### Activating the Timer
```bash
systemctl --user daemon-reload
systemctl --user enable --now mise-upgrade.timer

# Verify timer status and next run time
systemctl --user list-timers --all | grep mise
```

---

## 5. Portless Boot-Time Systemd Proxy TLD Synchronization

If Portless is configured to run as a boot-time `systemd` proxy service on port 443 (e.g. `/etc/systemd/system/portless.service` or `~/.config/systemd/user/portless.service`), the systemd unit must know about all custom top-level domains alongside `.localhost`.

To synchronize the proxy service with your user shell environment (e.g. when using Cloudflare Tunnels with custom domains like `<your-domain.com>`):
- Include `Environment="PORTLESS_TLD=localhost,<your-domain.com>"` (or dynamically `Environment="PORTLESS_TLD=$(node scripts/cloudflare-domain.ts --tld)"`) in the `[Service]` block of the unit, or
- Re-run `portless service install` passing the explicit TLD flags:
  ```bash
  portless service install --tld localhost --tld <your-domain.com>
  # Or dynamically:
  portless service install --tld localhost --tld $(node scripts/cloudflare-domain.ts)
  ```

This ensures that on system boot, the Portless proxy listens for and routes requests across all configured domains immediately.

---

## 6. Quick Installation & Manual Setup

If setting up `mise` manually:

```bash
# Standalone install script (installs directly to ~/.local/bin/mise)
curl -fsSL https://mise.run | sh
```

Verify that `~/.local/bin` is in the user's `PATH`:

```bash
export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"
```

To persist in the shell profile (e.g., `~/.bashrc` or `~/.zshrc`):

```bash
# In ~/.bashrc or ~/.zshrc:
export PATH="$HOME/.local/bin:$PATH"
eval "$(mise activate bash)"   # or: eval "$(mise activate zsh)"
```

Verify versions:

```bash
node -v   # e.g. v22.x.x (Node 22+ required by convex@1.49+)
pnpm -v   # e.g. 10.x.x or 9.x.x
gh --version
portless --version
portless prune --help
```

---

## 7. Fedora / RHEL SELinux Allowlisting for Portless Service

If running Fedora or RHEL with SELinux in enforcing mode, systemd (`init_t`) requires the Node binary to have the `bin_t` context before executing `/etc/systemd/system/portless.service`:

```bash
# Allowlist all mise Node versions for systemd execution
sudo semanage fcontext -a -t bin_t "$HOME/\.local/share/mise/installs/node/[^/]*/bin/node"
sudo restorecon -v -R "$HOME/.local/share/mise/installs/node"

# Install background service
portless service install
```

---

## 8. Project-Level Pinning (`.mise.toml`)

Place a `.mise.toml` file in the project root to guarantee that all developers and agents use matching versions:

```toml
[tools]
node = "22" # convex@1.49+ requires Node 22+ (Node 20 dropped)
pnpm = "latest"
gh = "latest"
# mise's registry backend prefix for npm registry packages is "npm:" (no "pnpm:" backend exists in mise)
"npm:portless" = "latest"
```

When entering the project directory, running `mise install` installs any missing pinned toolchains automatically.

---

## 9. Agent Autonomous Offer Protocol (For Non-SWEs)

When an agent detects that `node`, `pnpm`, `gh`, or `portless` is missing:
1. It does **not** fail or output error logs.
2. It politely asks the user:
   > *"I noticed some required tools ([missing tools]) aren't installed yet. Would you like me to install them for you automatically using **mise** in `~/.local/bin`? It's fast, doesn't require administrator/sudo access, and keeps everything cleanly in your user directory."*
3. Upon approval (or when running autonomously), it runs the automated setup script:
   ```bash
   bash scripts/setup-mise.sh
   export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"
   eval "$("$HOME/.local/bin/mise" activate bash)"
   ```

