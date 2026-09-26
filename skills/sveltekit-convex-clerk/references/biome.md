# Biome Standards Reference

Official Documentation: https://biomejs.dev/

## Core Principles
1. **Unified Toolchain**: Biome replaces both ESLint and Prettier with a single ultra-fast Rust-powered tool.
2. **Zero Legacy Redundancy**: Never install `eslint`, `@typescript-eslint/*`, `prettier`, or `prettier-plugin-*` when Biome is active.
3. **Core Scripts**:
   - `"lint": "biome lint ."`
   - `"format": "biome format --write ."`
   - `"check": "biome check ."` (runs linter, formatter, and import sorting in one pass)
   - `"check:write": "biome check --write ."` (applies all safe fixes automatically)
