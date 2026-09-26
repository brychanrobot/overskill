# Story-Driven Commit Descriptions in Jujutsu

This reference details the philosophy and rules for drafting concise, story-driven commit descriptions in Jujutsu (`jj`).

## Core Rules

1. **Objective Diff Analysis**:
   - Base the description **strictly and solely on the contents of the diff** (`jj_diff`).
   - Do **NOT** incorporate prior conversational goals, prompt commentary, or speculative context from earlier turns.
   - Ignore trivial formatting modifications (whitespace changes, indentation, line endings). Focus purely on logical, structural, and behavioral shifts.

2. **Forbidden Vocabulary**:
   - **STRICT RULE**: Do **NOT** use the word **"refactor"** anywhere in the commit title or body. Replace with specific descriptions of what changed (e.g. "extract helper", "reorganize modules", "consolidate auth providers").

3. **What and Why, Never How**:
   - Focus on the **what** (the user-facing or architectural result) and the **why** (the intent or necessity).
   - Avoid narrating low-level mechanics (e.g., avoid listing individual variable renames, loop constructs, or internal parameters).

4. **Formatting Convention**:
   - First line: `<topic>: <short subject>` (imperative mood, max 72 chars).
   - Blank line.
   - Concise paragraph or bulleted list explaining the impact and reasoning.

## Revision Target Resolution
- If the current working copy (`@`) has changes: inspect diff at `@` and describe `@`.
- If the current working copy (`@`) is clean / empty: inspect diff at `@-` and pass `revision: "@-"` to `jj_describe`.
