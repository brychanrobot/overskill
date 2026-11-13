# overskill

A curated repository of production-grade, reusable agent skills for [Antigravity (AGY)](https://github.com/google/antigravity).

Every skill in this repository is built following the official Antigravity Customization System specifications, fully self-contained, and optimized for instant consumption via **GitHub raw URLs** or workspace inheritance.

---

## Available Skills

| Skill | Stack / Focus | Description | Raw URL for AGY |
| :--- | :--- | :--- | :--- |
| [`orchestrator-pro`](./skills/orchestrator-pro/SKILL.md) | Multi-Agent Orchestration, Architecture, Task Decomposition, Verification, AGY Cloud | Master architect and principal engineering orchestrator. Activates orchestrator-pro persona, decomposes complex engineering problems into parallel workstreams, dynamically registers and coordinates the overskill subagent team, and enforces multi-tiered verification. | [`SKILL.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/orchestrator-pro/SKILL.md) |
| [`sveltekit-convex-clerk`](./skills/sveltekit-convex-clerk/SKILL.md) | SvelteKit, Vite, TypeScript, Tailwind CSS v4, shadcn-svelte, Biome, Vitest, Playwright, Convex, Clerk, Vercel | Scaffolds, configures, wires, creates a GitHub repo for, tests, captures screenshot/GIF walkthroughs for, and deploys full-stack reactive SvelteKit applications with real-time backend, auth, and accessible UI. | [`SKILL.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/sveltekit-convex-clerk/SKILL.md) |
| [`clerk`](./skills/clerk/SKILL.md) | Clerk, Authentication, Clerk CLI (`pnpm dlx clerk`), Multi-Framework | Adds Clerk authentication with the Clerk CLI using `pnpm dlx clerk`. Supports accountless instant dev keys, linking existing apps, prebuilt UI controls, and multi-tenancy. | [`SKILL.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/clerk/SKILL.md) |
| [`jj`](./skills/jj/SKILL.md) | Jujutsu (jj), Version Control, MCP Tools | Strictly mandates Jujutsu MCP tools, bottom-up squash workflow for stack modifications, story-driven commit descriptions, and rebase conflict resolution. | [`SKILL.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/jj/SKILL.md) |
| [`local-curl`](./skills/local-curl/SKILL.md) | Localhost, Portless (`.localhost`), Safe HTTP/S Testing, `curl` | Executes safe, authenticated HTTP/HTTPS requests strictly restricted to localhost and Portless (.localhost) domains using `lcurl` with automatic local CA certificate injection. | [`SKILL.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/local-curl/SKILL.md) |
| [`playwright`](./skills/playwright/SKILL.md) | Playwright, Browser Automation, Compound Testing, Visual Proof, Smart Locators | Interactively beta-test web applications, click elements, fill forms, execute compound operations (create, form, assert, smoke), run arbitrary Playwright scripts, and debug console errors with `skills/playwright/scripts/playwright-cli.ts`. | [`SKILL.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/playwright/SKILL.md) |

---

## Bundled Agents

| Agent | Model | Description | Agent Definition |
| :--- | :--- | :--- | :--- |
| [`orchestrator-pro`](./agents/orchestrator-pro.md) | `pro` | Master architect and orchestrator that decomposes complex tasks, coordinates parallel workstreams, and dynamically assigns subagent model tiers based on cost, latency, and complexity heuristics. | [`orchestrator-pro.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/agents/orchestrator-pro.md) |
| [`product-manager`](./agents/product-manager.md) | `pro` | Product strategy and requirements specialist. Translates ideas and user requests into structured Product Requirements Documents (PRDs), user stories with acceptance criteria, and scoped MVPs. | [`product-manager.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/agents/product-manager.md) |
| [`ux-researcher`](./agents/ux-researcher.md) | `flash` | User research, usability, and accessibility specialist. Evaluates user journeys, cognitive load, accessibility (WCAG), and usability heuristics. | [`ux-researcher.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/agents/ux-researcher.md) |
| [`ux-designer`](./agents/ux-designer.md) | `flash` | UI/UX, interaction design, and design system specialist. Crafts component specifications, responsive layouts, 5-state UI models, and Tailwind/shadcn design token guidelines. | [`ux-designer.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/agents/ux-designer.md) |
| [`architect`](./agents/architect.md) | `pro` | System architect and technical planning specialist. Analyzes requirements, surveys codebases, designs system boundaries and data contracts, and drafts concrete Technical Implementation Plans (RFCs) without modifying code. | [`architect.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/agents/architect.md) |
| [`research`](./agents/research.md) | `flash_lite` | Fast reconnaissance and investigation subagent for exploring codebases, symbol searches, file listings, pattern matching, documentation lookups, and log analysis. | [`research.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/agents/research.md) |
| [`developer`](./agents/developer.md) | `flash` | Precision implementation and testing subagent that writes clean code, creates and edits files, authors unit/regression tests, and runs validation commands. | [`developer.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/agents/developer.md) |
| [`code-reviewer`](./agents/code-reviewer.md) | `flash` | Fast, objective code review specialist for routine features, unit test coverage, idiomatic style, and bug prevention. | [`code-reviewer.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/agents/code-reviewer.md) |
| [`code-reviewer-pro`](./agents/code-reviewer-pro.md) | `pro` | Deep architectural, concurrency, and security auditor for high-stakes revisions, breaking changes, and mission-critical code. | [`code-reviewer-pro.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/agents/code-reviewer-pro.md) |

---

## Using Skills with Antigravity (`agy`)

### Option 1: Install as an Antigravity Plugin (Recommended)

Install all skills globally across all your projects in a single command using the official `agy` CLI:

```bash
agy plugin install https://github.com/brychanrobot/overskill
```

*(Or inside the interactive `agy` TUI, run: `/plugin install https://github.com/brychanrobot/overskill`)*

#### Updating `overskill`
To fetch the latest skills and template updates at any time, re-run:

```bash
agy plugin install https://github.com/brychanrobot/overskill
```

#### Keeping Plugins Automatically Updated (Smart Sync Poller)
To ensure all installed Git-based plugins stay continuously up to date without manual intervention, use the bundled smart poller [`scripts/sync-agy-plugins.sh`](./scripts/sync-agy-plugins.sh). It scans `~/.gemini/config/plugins/`, checks upstream `git ls-remote` across all installed git plugins in ~200ms, and only triggers updates when upstream commits have actually changed. It supports both desktop environments and headless Antigravity Cloud VMs (handling `nobody:nogroup` FUSE mounts via `safe.directory="*"` and automatically syncing skills and agents to `~/.gemini/skills/` and `~/.gemini/agents/` when the desktop `agy` CLI is absent):

```bash
# 1. Download and install the sync script to ~/.local/bin
mkdir -p ~/.local/bin
curl -sSL https://raw.githubusercontent.com/brychanrobot/overskill/main/scripts/sync-agy-plugins.sh \
  -o ~/.local/bin/sync-agy-plugins.sh && chmod +x ~/.local/bin/sync-agy-plugins.sh

# 2. Add to crontab (runs every 15 minutes; or set to 0 10 * * * for 10:00 AM daily)
(crontab -l 2>/dev/null | grep -v 'sync-agy-plugins.sh'; echo "*/15 * * * * $HOME/.local/bin/sync-agy-plugins.sh") | crontab -
```

### Bundled Lifecycle Hooks

`overskill` includes built-in lifecycle hooks configured in `hooks.json`:
- **`rewrite-pnpx` (`PreToolUse`)**: Intercepts `run_command` tool calls and automatically rewrites executable invocations of `npx` and `pnpx` to `pnpm dlx` (preserving non-command string literals, arguments, and commit messages while properly handling environment assignments, chains, subshells, and wrappers).

---

### Option 2: Point AGY directly at a GitHub Raw URL (For One-Off Tasks)

You can prompt your Antigravity agent directly with any skill's raw URL:

```text
Fetch and execute the full-stack setup skill from:
https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/sveltekit-convex-clerk/SKILL.md
```

Each skill's `SKILL.md` provides a concise, self-contained orchestration runbook (workflow, CLI commands, guardrails, and verification gates), while verbose code templates (`templates/`) and deep technical guides (`references/`) live in sibling resource directories that agents read on demand (or fetch via sibling raw GitHub URLs when consumed standalone).

---

### Option 3: Inherit into a Project via `.agents/skills.json`

To make skills from this repository permanently available to any of your local projects, add this repository to your project's `.agents/skills.json`:

```json
{
  "inherits": [
    {
      "path": "/path/to/overskill/skills.json"
    }
  ]
}
```

Or install a specific skill directly into your workspace:

```bash
mkdir -p .agents/skills/sveltekit-convex-clerk
curl -sSL https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/sveltekit-convex-clerk/SKILL.md \
  -o .agents/skills/sveltekit-convex-clerk/SKILL.md
```

*(Note: Installing as an `agy` plugin via Option 1 or inheriting via `.agents/skills.json` makes all companion `templates/` and `references/` available locally. When curling a standalone `SKILL.md`, agents fetch companion resources on demand via sibling raw GitHub URLs).*

---

## Toolchain Setup with `mise` (Recommended)

To ensure consistent, reproducible execution without requiring root (`sudo`) permissions or polluting system directories, we recommend [`mise`](https://mise.jdx.dev) to manage essential developer toolchains (`caddy`, `cloudflared`, `gh`, `node`, `portless`, and `pnpm`) directly in `~/.local/bin`.

### Automated Idempotent Setup (`scripts/setup-mise.sh`)

`overskill` provides a bundled, idempotent setup script [`scripts/setup-mise.sh`](./scripts/setup-mise.sh) that configures `mise`, sets up the required global configuration, installs all tools, and registers a daily `systemd --user` auto-upgrade timer in one step:

```bash
# Run local setup script (supports --dry-run / -n)
bash scripts/setup-mise.sh

# Or run directly via curl from GitHub:
curl -fsSL https://raw.githubusercontent.com/brychanrobot/overskill/main/scripts/setup-mise.sh | bash
```

### Required Configuration (`~/.config/mise/config.toml`)

`scripts/setup-mise.sh` ensures `~/.config/mise/config.toml` contains:

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

> [!WARNING]
> **Why `prefer_offline = true` is Mandatory for `"latest"` Tools**:
> By default, `mise` uses `prefer_offline = false`. When tools are pinned to `"latest"`, as soon as mise's remote version cache expires and a newer version is published upstream (e.g. `portless@0.16.0` vs installed `0.15.7`), every shim execution resolves `"latest"` to the *uninstalled* upstream release and crashes with:
> ```text
> mise ERROR <tool> is not a valid shim
> ```
> In addition, running `mise use <npm-tool>` while `node = "latest"` has a newer upstream version fails during mise's internal offline dependency check with `failed to resolve configured install dependency 'node@latest' ... while offline`.
>
> Setting `prefer_offline = true` guarantees that CLI commands and shims resolve instantly to the highest locally installed version, while intentional upgrades (`mise upgrade` and the daily auto-upgrade timer) continue fetching and installing new upstream releases.

### Daily Auto-Upgrade Systemd User Timer (`mise-upgrade.timer`)

The setup script installs `~/.config/systemd/user/mise-upgrade.service` and `~/.config/systemd/user/mise-upgrade.timer` to keep `mise` and all managed toolchains up to date automatically:

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

```bash
# Automatically activated by scripts/setup-mise.sh, or manually via:
systemctl --user daemon-reload
systemctl --user enable --now mise-upgrade.timer
```

### Portless Boot-Time Systemd Proxy TLD Synchronization

If `portless` is configured to run as a boot-time `systemd` proxy service on port 443 (e.g. `/etc/systemd/system/portless.service` or user service), the service unit requires `Environment="PORTLESS_TLD=localhost,<your-domain.com>"` (or `--tld localhost --tld <your-domain.com>` CLI flags, or dynamically `Environment="PORTLESS_TLD=$(node scripts/cloudflare-domain.ts --tld)"`) so it routes requests across all configured domains (including custom Cloudflare Tunnel domains like `<your-domain.com>`) matching the user shell environment.

### Manual Setup Steps

If configuring manually without `scripts/setup-mise.sh`:

```bash
# 1. Install mise to ~/.local/bin
curl -fsSL https://mise.run | sh

# 2. Ensure ~/.local/bin and shims are in your PATH
export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"

# 3. Configure prefer_offline = true and auto-update
mise settings set prefer_offline true
mise settings set self_update.auto true

# 4. Install toolchains
mise use --global caddy@latest cloudflared@latest gh@latest node@latest npm:portless@latest pnpm@latest

# 5. Initialize and trust the local Portless CA certificate (one-time sudo)
portless trust
# (On Linux Chrome/Chromium, import into NSS: certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "portless Local CA" -i "$HOME/.portless/ca.pem")

# 6. On Fedora/RHEL with SELinux, allowlist mise Node for systemd execution:
# sudo semanage fcontext -a -t bin_t "$HOME/\.local/share/mise/installs/node/[^/]*/bin/node"
# sudo restorecon -v -R "$HOME/.local/share/mise/installs/node"

# 7. Install the system startup service (or run `portless proxy start`)
portless service install --tld localhost --tld <your-domain.com>
# (Or dynamically: portless service install --tld localhost --tld $(node scripts/cloudflare-domain.ts))
```

> [!NOTE]
> `overskill` skills strictly forbid `npx`. Always use `pnpm dlx` for ad-hoc tool execution (e.g., `pnpm dlx sv create`) and `pnpm <command>` for installed dependencies.

---

## Local Domain Routing & Remote Access (Portless, Cloudflare Tunnels, Tailscale)

All local development in `overskill` uses [Portless](https://github.com/vercel-labs/portless) (by Vercel Labs) for zero-configuration local domain routing and automatic ephemeral port allocation:
- **Base Domain**: `https://<project-name>.localhost` (e.g. `https://my-app.localhost`)
- **Auxiliary Endpoints**: `https://<endpoint>.<project-name>.localhost` (e.g. `https://api.my-app.localhost`, `https://preview.my-app.localhost`)
- **RFC 6761 Zero-Configuration Loopback**: Under RFC 6761, `*.localhost` domains natively resolve to `127.0.0.1` and `::1` across all modern browsers and OS networking resolvers. **No `/etc/hosts` editing is required.**
- **Automatic Ephemeral Port Allocation**: Portless automatically assigns an ephemeral port in the 4000–4999 range and forwards traffic from port 80/443 without manual port assignments or collisions.
- **Native HTTPS & Isolated Cookies**: Portless issues and trusts local TLS certificates via `portless trust`, ensuring development matches production HTTPS and completely prevents auth session/cookie collisions between projects.
- **Remote & Multi-Device Access via Cloudflare Tunnels**: Seamlessly route custom domains (`https://<project-name>.<your-domain.com>`) through a wildcard Cloudflare Tunnel (`cloudflared`) and `PORTLESS_TLD` for mobile phone/tablet testing and external webhook delivery without VPN client software or hardcoding private domains.
- **Private Tailnet Sharing via Tailscale**: Built-in support for `portless <name> --tailscale` and `--funnel` for private team access across authorized tailnet devices.

---

## Repository Structure

```text
overskill/
├── README.md                      # Catalog and consumption guide
├── plugin.json                    # Plugin manifest
├── hooks.json                     # Lifecycle hooks (auto-rewrites npx & pnpx to pnpm dlx)
├── package.json                   # Project scripts and dev tools
├── skills.json                    # AGY discovery manifest
├── agents/
│   ├── orchestrator-pro.md        # Master architect and orchestrator definition
│   ├── product-manager.md         # Product strategy and requirements specialist definition
│   ├── ux-researcher.md           # User research, usability & accessibility specialist definition
│   ├── ux-designer.md             # UI/UX, interaction & design token specialist definition
│   ├── architect.md               # System architect and technical planning specialist definition
│   ├── research.md                # Fast reconnaissance subagent definition
│   ├── developer.md               # Precision implementation subagent definition
│   ├── code-reviewer.md           # Fast routine code review specialist definition
│   └── code-reviewer-pro.md       # Deep architectural & security auditor definition
├── scripts/
│   ├── cloudflare-domain.ts       # Automated Cloudflare zone and domain extractor from cert.pem
│   ├── lcurl                      # Safe localhost-restricted curl wrapper with Portless CA injection
│   ├── rewrite-pnpx.ts            # PreToolUse hook script rewriting npx & pnpx to pnpm dlx
│   ├── setup-mise.sh              # Idempotent mise, toolchain & daily auto-upgrade timer setup
│   └── sync-agy-plugins.sh        # Smart poller to auto-update installed plugins
└── skills/
    ├── orchestrator-pro/
    │   └── SKILL.md               # Zero-symlink DRY wrapper activating orchestrator-pro in AGY
    ├── playwright/
    │   ├── SKILL.md               # Playwright browser automation and testing guide
    │   └── scripts/
    │       └── playwright-cli.ts  # Ergonomic standalone browser automation CLI
    └── <skill-name>/
        ├── SKILL.md               # Concise orchestration runbook for AGY
        ├── templates/             # Companion code and configuration templates
        └── references/            # Ingested documentation, endpoints, and specifications
```

---

## Guidelines for Authoring Skills in `overskill`

1. **Concise Orchestration Runbook with Progressive Disclosure**: The primary `SKILL.md` file should be a concise orchestration runbook containing the core workflow, execution commands, non-negotiable guardrails, and verification gates. Delegate verbose boilerplate and file fixtures to `templates/`, and in-depth technical guides or architecture notes to `references/`, ensuring agents read companion resources on demand (with sibling raw-URL discoverability when used standalone).
2. **Standard YAML Frontmatter**: Must include `name` (lowercase, kebab-case) and `description` (third-person trigger explanation).
3. **Strict Tooling Rules**: Enforce modern, deterministic package managers (strict `pnpm`, **strictly forbidding `npx` in favor of `pnpm dlx`**) and unified toolchains (e.g. `Biome` instead of legacy ESLint/Prettier combinations, and `mise` for toolchain setup in `~/.local/bin`).
4. **Verifiable Steps**: Provide automated and manual verification commands at every milestone.
5. **Live Documentation Freshness Protocol**: Mandate that agents actively consult upstream machine-readable agent documentation (`llms.txt`, markdown feeds like `docs.convex.dev/<path>.md`, and official agent skills) rather than relying on stale memory or fixed snippets for fast-moving framework APIs.
6. **Mandatory Portless Local Routing**: Mandate Portless for local development routing, serving base applications at `https://<project-name>.localhost` and auxiliary endpoints at `https://<endpoint>.<project-name>.localhost` with native HTTPS and automatic ephemeral port management to eliminate port collisions and cookie contention.

