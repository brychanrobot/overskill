# overskill

A curated repository of production-grade, reusable agent skills for [Antigravity (AGY)](https://github.com/google/antigravity).

Every skill in this repository is built following the official Antigravity Customization System specifications, fully self-contained, and optimized for instant consumption via **GitHub raw URLs** or workspace inheritance.

---

## Available Skills

| Skill | Stack / Focus | Description | Raw URL for AGY |
| :--- | :--- | :--- | :--- |
| [`sveltekit-convex-clerk`](./skills/sveltekit-convex-clerk/SKILL.md) | SvelteKit, TypeScript, Tailwind CSS v4, shadcn-svelte, Biome, Vitest, Playwright, Convex, Clerk, Vercel | Scaffolds, configures, wires, creates a GitHub repo for, tests, captures screenshot/GIF walkthroughs for, and deploys full-stack reactive SvelteKit applications with real-time backend, auth, and accessible UI. | [`SKILL.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/sveltekit-convex-clerk/SKILL.md) |
| [`jj`](./skills/jj/SKILL.md) | Jujutsu (jj), Version Control, MCP Tools | Strictly mandates Jujutsu MCP tools, bottom-up squash workflow for stack modifications, story-driven commit descriptions, and rebase conflict resolution. | [`SKILL.md`](https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/jj/SKILL.md) |

---

## Using Skills with Antigravity (`agy`)

### Option 1: Point AGY directly at a GitHub Raw URL (Recommended for Quick Tasks)

You can prompt your Antigravity agent directly with the skill's raw URL:

```text
Fetch and execute the full-stack setup skill from:
https://raw.githubusercontent.com/brychanrobot/overskill/main/skills/sveltekit-convex-clerk/SKILL.md
```

Because each skill's `SKILL.md` is strictly self-contained, the agent will ingest the complete set of instructions, configurations, code templates, and execution commands in a single fetch.

---

### Option 2: Inherit into a Project via `.agents/skills.json`

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

## Repository Structure

```text
overskill/
├── README.md                      # Catalog and consumption guide
├── skills.json                    # AGY discovery manifest
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
3. **Strict Tooling Rules**: Enforce modern, deterministic package managers (e.g. strict `pnpm`) and unified toolchains (e.g. `Biome` instead of legacy ESLint/Prettier combinations).
4. **Verifiable Steps**: Provide automated and manual verification commands at every milestone.
