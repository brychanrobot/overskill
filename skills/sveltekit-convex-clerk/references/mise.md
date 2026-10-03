# Toolchain Management with `mise`

[`mise`](https://mise.jdx.dev) (formerly `rtx`) is a fast, polyglot tool version and environment manager written in Rust. It installs toolchains in user space (`~/.local/share/mise` and `~/.local/bin`) without needing `sudo` or system package manager privileges.

In the `sveltekit-convex-clerk` workflow, `mise` is the recommended mechanism for installing and pinning runtime tools:
- **`node`** (Node.js LTS, e.g. 20.x or 22.x)
- **`pnpm`** (Strict package manager)
- **`gh`** (GitHub CLI for repository creation and auth)
- **`portless`** (Local development domain proxy and automatic port allocator for `<project-name>.localhost`)

---

## 1. Quick Installation into `~/.local/bin`

Install `mise` as a standalone binary into `~/.local/bin`:

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

---

## 2. Installing Required Tools

Install the essential developer stack globally with a single command:

```bash
# Install and activate Node.js LTS, pnpm, GitHub CLI, and Portless
~/.local/bin/mise use --global node@lts pnpm@latest gh@latest npm:portless@latest
```

*(Note: mise's registry backend prefix for npm packages is `npm:`, so Portless is pinned as `npm:portless@latest`).*

Verify versions:

```bash
node -v   # e.g. v22.x.x
pnpm -v   # e.g. 10.x.x or 9.x.x
gh --version
portless --version
```

### Fedora / RHEL SELinux Allowlisting for Portless Service
If running Fedora or RHEL with SELinux in enforcing mode, systemd (`init_t`) requires the Node binary to have the `bin_t` context before executing `/etc/systemd/system/portless.service`:

```bash
# Allowlist all mise Node versions for systemd execution
sudo semanage fcontext -a -t bin_t "$HOME/\.local/share/mise/installs/node/[^/]*/bin/node"
sudo restorecon -v -R "$HOME/.local/share/mise/installs/node"

# Install background service
portless service install
```

---

## 3. Project-Level Pinning (`.mise.toml`)

Place a `.mise.toml` file in the project root to guarantee that all developers and agents use matching versions:

```toml
[tools]
node = "lts"
pnpm = "latest"
gh = "latest"
# mise's registry backend prefix for npm registry packages is "npm:" (no "pnpm:" backend exists in mise)
"npm:portless" = "latest"
```

When entering the project directory, running `mise install` installs any missing pinned toolchains automatically.

---

## 4. Agent Autonomous Offer Protocol (For Non-SWEs)

When an agent detects that `node`, `pnpm`, `gh`, or `portless` is missing:
1. It does **not** fail or output error logs.
2. It politely asks the user:
   > *"I noticed some required tools ([missing tools]) aren't installed yet. Would you like me to install them for you automatically using **mise** in `~/.local/bin`? It's fast, doesn't require administrator/sudo access, and keeps everything cleanly in your user directory."*
3. Upon approval (or when running autonomously), it runs the non-interactive setup sequence:
   ```bash
   if ! command -v mise >/dev/null 2>&1 && [ ! -x "$HOME/.local/bin/mise" ]; then
     curl -fsSL https://mise.run | sh
   fi
   export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"
   "$HOME/.local/bin/mise" use --global node@lts pnpm@latest gh@latest npm:portless@latest
   eval "$("$HOME/.local/bin/mise" activate bash)"
   ```
