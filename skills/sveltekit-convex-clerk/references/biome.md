# Biome Standards Reference

Official Documentation: https://biomejs.dev/

## 1. Core Principles

1. **Unified Toolchain**: Biome replaces both ESLint and Prettier with a single ultra-fast Rust-powered tool for formatting, linting, and import sorting.
2. **Zero Legacy Redundancy**: Never install `eslint`, `@typescript-eslint/*`, `prettier`, or `prettier-plugin-*` when Biome is active.
3. **Strict Package Manager Rule**: Always invoke Biome with `pnpm` or `pnpm dlx` (e.g. `pnpm dlx @biomejs/biome init`). Never use `npx`.

---

## 2. Installation & Legacy Configuration Cleanup

Install Biome as a development dependency:
```bash
# 1. Install Biome
pnpm add -D @biomejs/biome@^1.9.4

# 2. Initialize Biome configuration
pnpm dlx @biomejs/biome init
```

### Clean Up Legacy Configurations
If any ESLint or Prettier config files or packages were introduced by starter templates, remove them immediately:
```bash
rm -f .eslintrc* .prettier* prettier.config.* eslint.config.*
```
Coexisting configs cause conflicting rules, duplicate formatting, and slower CI runs.

---

## 3. Configuration: `biome.json`

The project uses `@biomejs/biome@^1.9.4`. Overwrite `biome.json` with the production configuration tailored for SvelteKit and TypeScript:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": false,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": [
      ".svelte-kit/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      ".convex/**",
      "src/convex/_generated/**",
      "convex/_generated/**",
      "playwright-report/**",
      "test-results/**"
    ]
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "semicolons": "always",
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "warn"
      },
      "style": {
        "useConst": "error"
      }
    }
  }
}
```

### Ignore Globs Rationale:
- **`.svelte-kit/**`**: Generated SvelteKit manifest, router code, and type definitions.
- **`build/**`, `dist/**`**: Production build artifacts.
- **`node_modules/**`**: Third-party dependencies.
- **`.convex/**`, `convex/_generated/**`, `src/convex/_generated/**`**: Machine-generated Convex server API declarations and types (`api.d.ts`, `dataModel.d.ts`).
- **`playwright-report/**`, `test-results/**`**: End-to-end test artifacts, trace files, and HTML reports.

### Formatting & Linting Rules:
- **Indentation**: 2 spaces with `lf` line endings and 100-character line width.
- **JavaScript / TypeScript**: Single quotes (`'`), semicolons (`always`), trailing commas (`all`).
- **Recommended Lints**: Enabled by default, with `noUnusedVariables` as `warn` (prevents build failure during prototyping) and `useConst` as `error` (enforces immutable declarations).

---

## 4. Standard `package.json` Scripts

Define unified scripts in `package.json`:

```json
{
  "scripts": {
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json && biome check .",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "lint:fix": "biome check --write ."
  }
}
```

### Script Usage & Workflow:
- **`pnpm run check`**: Comprehensive pre-commit and pre-deploy verification gate. Runs SvelteKit type sync (`svelte-kit sync`), full TypeScript typechecking (`svelte-check`), and Biome analysis (`biome check .` which lints, verifies formatting, and validates import sorting in one pass).
- **`pnpm run lint`**: Fast, non-destructive lint check across all project files.
- **`pnpm run format`**: Automatically formats all project files in place.
- **`pnpm run lint:fix`**: Automatically applies safe linter fixes, organizes imports, and formats files in place.

