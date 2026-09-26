# Jujutsu Rebase Conflict Resolution

Jujutsu models conflicts first-class within revisions without stopping operations or corrupting the working copy index.

## Conflict Identification

Run `jj_status` to observe conflicted revisions and file paths:
```
Working copy (@): ... (conflict)
Parent commit (@-): ... (conflict)
Warning: There are unresolved conflicts at these paths:
  src/routes/+layout.svelte    2-sided conflict
```

## Critical Semantic Warning: `:ours` vs `:theirs`

In Jujutsu rebase operations, side terminology is reversed compared to common Git mental models:
- **`:ours`** = The **rebase destination** (e.g. `main` or the base branch onto which commits are being rebased).
- **`:theirs`** = The **rebased revision** (your feature branch commit being rebased).

If you want to keep your feature branch version as the baseline for manual integration, specify **`:theirs`**.

## Resolution Strategies

### Strategy A: Direct File Edit (Simple Conflicts)
For localized hunks (e.g. single import addition or distinct config line):
1. Locate conflict markers (`<<<<<<<` / `%%%%%%%` / `+++++++` / `>>>>>>>`) using `grep_search`.
2. Edit the file directly to synthesize the merged content and delete all conflict markers.

### Strategy B: `jj_resolve` + Manual Synthesis (Complex Conflicts)
For multi-file or architectural conflicts:
1. Reset the conflicted file to the feature branch baseline:
   ```json
   {
     "repo_path": "/path/to/repo",
     "tool": ":theirs",
     "revision": "<conflicted-revision>",
     "paths": ["<file-path>"]
   }
   ```
2. Inspect what was added on the destination side (`jj_file_show` or `jj_diff`).
3. Manually integrate missing destination logic.
4. Run project build, lints, and test suites to verify.
