# Clerk CLI Reference (`pnpm dlx clerk`)

The Clerk CLI provides a scriptable terminal interface for managing Clerk authentication, projects, and instance configurations without leaving your terminal or manually copy-pasting API keys.

In all `overskill` environments, the Clerk CLI must be executed via `pnpm dlx clerk` (or `pnpm dlx clerk@latest`). Never use `npx`.

---

## Common CLI Commands

| Command | Purpose |
| :--- | :--- |
| `pnpm dlx clerk init` | Scaffolds or detects your framework, installs SDKs, and provisions development keys. |
| `pnpm dlx clerk auth login` | Authenticates your terminal session with your Clerk account. |
| `pnpm dlx clerk whoami` | Displays currently authenticated Clerk user and linked application. |
| `pnpm dlx clerk doctor` | Checks integration health, detects configuration issues, and suggests fixes. |
| `pnpm dlx clerk apps list --json` | Lists available Clerk applications with IDs. |
| `pnpm dlx clerk config pull` | Pulls current application settings from Clerk. |
| `pnpm dlx clerk config patch` | Updates application settings (supports `--dry-run`). |
| `pnpm dlx clerk deploy` | Promotes development instance to production with custom domain setup. |
| `pnpm dlx clerk enable orgs` | Enables multi-tenancy and organization management. |
| `pnpm dlx clerk webhooks listen` | Relays live webhook deliveries to local development handlers. |
| `pnpm dlx clerk mcp install` | Configures Clerk Model Context Protocol (MCP) for AI coding assistants. |

---

## Agent Mode & Non-Interactive Execution

When invoked by AI agents or non-interactive scripts:
- Pass `--mode agent` to suppress interactive prompts and output machine-readable responses.
- Pass `--mode human` when a human user is interacting directly in an interactive shell.
