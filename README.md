# overskill

A curated repository of production-grade, reusable agent skills for [Antigravity (AGY)](https://github.com/google/antigravity).

Every skill in this repository is built following the official Antigravity Customization System specifications, fully self-contained, and optimized for instant consumption via **GitHub raw URLs** or workspace inheritance.

---

## Available Skills

| Skill | Stack / Focus | Description | Raw URL for AGY |
| :--- | :--- | :--- | :--- |
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
To ensure all installed Git-based plugins stay continuously up to date without manual intervention, use the bundled smart poller [`scripts/sync-agy-plugins.sh`](./scripts/sync-agy-plugins.sh). It scans `~/.gemini/config/plugins/`, checks upstream `git ls-remote` across all installed git plugins in ~200ms, and only triggers `agy plugin install` when upstream commits have actually changed:

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

Because each skill's `SKILL.md` is strictly self-contained, the agent will ingest the complete set of instructions, configurations, code templates, and execution commands in a single fetch.

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

---

## Toolchain Setup with `mise` (Recommended)

To ensure consistent, reproducible execution without requiring root (`sudo`) permissions or polluting system directories, we recommend [`mise`](https://mise.jdx.dev) to manage essential developer toolchains (`gh`, `node`, `pnpm`, and `portless`) directly in `~/.local/bin`:

```bash
# 1. Install mise to ~/.local/bin
curl -fsSL https://mise.run | sh

# 2. Ensure ~/.local/bin and shims are in your PATH
export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"

# 3. Install GitHub CLI, Node.js LTS, pnpm, and Portless
mise use --global gh@latest node@lts pnpm@latest npm:portless@latest

# 4. Initialize and trust the local Portless CA certificate (one-time sudo)
portless trust
# (On Linux Chrome/Chromium, import into NSS: certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "portless Local CA" -i "$HOME/.portless/ca.pem")

# 5. On Fedora/RHEL with SELinux, allowlist mise Node for systemd execution:
# sudo semanage fcontext -a -t bin_t "$HOME/\.local/share/mise/installs/node/[^/]*/bin/node"
# sudo restorecon -v -R "$HOME/.local/share/mise/installs/node"

# 6. Install the system startup service (or run `portless proxy start`)
portless service install
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
│   ├── research.md                # Fast reconnaissance subagent definition
│   ├── developer.md               # Precision implementation subagent definition
│   ├── code-reviewer.md           # Fast routine code review specialist definition
│   └── code-reviewer-pro.md       # Deep architectural & security auditor definition
├── scripts/
│   ├── cloudflare-domain.ts       # Automated Cloudflare zone and domain extractor from cert.pem
│   ├── lcurl                      # Safe localhost-restricted curl wrapper with Portless CA injection
│   ├── rewrite-pnpx.ts            # PreToolUse hook script rewriting npx & pnpx to pnpm dlx
│   └── sync-agy-plugins.sh        # Smart poller to auto-update installed plugins
└── skills/
    ├── playwright/
    │   ├── SKILL.md               # Playwright browser automation and testing guide
    │   └── scripts/
    │       └── playwright-cli.ts  # Ergonomic standalone browser automation CLI
    └── <skill-name>/
        ├── SKILL.md               # Primary self-contained instruction runbook for AGY
        ├── templates/             # Companion code and configuration templates
        └── references/            # Ingested documentation, endpoints, and specifications
```

---

## Guidelines for Authoring Skills in `overskill`

1. **Self-Contained `SKILL.md`**: The primary `SKILL.md` file must be complete on its own so that fetching its GitHub raw URL provides everything an agent needs to execute without external file dependencies.
2. **Standard YAML Frontmatter**: Must include `name` (lowercase, kebab-case) and `description` (third-person trigger explanation).
3. **Strict Tooling Rules**: Enforce modern, deterministic package managers (strict `pnpm`, **strictly forbidding `npx` in favor of `pnpm dlx`**) and unified toolchains (e.g. `Biome` instead of legacy ESLint/Prettier combinations, and `mise` for toolchain setup in `~/.local/bin`).
4. **Verifiable Steps**: Provide automated and manual verification commands at every milestone.
5. **Live Documentation Freshness Protocol**: Mandate that agents actively consult upstream machine-readable agent documentation (`llms.txt`, markdown feeds like `docs.convex.dev/<path>.md`, and official agent skills) rather than relying on stale memory or fixed snippets for fast-moving framework APIs.
6. **Mandatory Portless Local Routing**: Mandate Portless for local development routing, serving base applications at `https://<project-name>.localhost` and auxiliary endpoints at `https://<endpoint>.<project-name>.localhost` with native HTTPS and automatic ephemeral port management to eliminate port collisions and cookie contention.

