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

To ensure consistent, reproducible execution without requiring root (`sudo`) permissions or polluting system directories, we recommend [`mise`](https://mise.jdx.dev) to manage essential developer toolchains (`gh`, `node`, and `pnpm`) directly in `~/.local/bin`:

```bash
# 1. Install mise to ~/.local/bin
curl -fsSL https://mise.run | sh

# 2. Ensure ~/.local/bin and shims are in your PATH
export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"

# 3. Install GitHub CLI, Node.js LTS, and pnpm
mise use --global gh@latest node@lts pnpm@latest
```

> [!NOTE]
> `overskill` skills strictly forbid `npx`. Always use `pnpm dlx` for ad-hoc tool execution (e.g., `pnpm dlx sv create`) and `pnpm <command>` for installed dependencies.

---

## Repository Structure

```text
overskill/
├── README.md                      # Catalog and consumption guide
├── skills.json                    # AGY discovery manifest
├── scripts/
│   └── sync-agy-plugins.sh        # Smart poller to auto-update installed plugins
└── skills/
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

