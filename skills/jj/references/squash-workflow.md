# The Bottom-Up Jujutsu Squash Workflow

When editing existing commits in a stack or resolving complex rebase conflicts in Jujutsu (`jj`), never attempt to bulk squash from the top of the stack or rely on blind `jj absorb` across multiple revisions. Doing so frequently induces cascading conflicts across descendant commits.

Always adhere strictly to the **bottom-up incremental squash workflow**:

## Step-by-Step Procedure

1. **Target the Earliest Commit Needing Edits**:
   Identify the bottom-most commit in the stack that requires modification or conflict resolution.
   Note its commit ID or change ID (`<commit-id>`).

2. **Create a Dedicated Revision on the Target**:
   Execute `jj new <commit-id>` (using shell execution since `jj new` is not an MCP tool).
   > [!IMPORTANT]
   > Never use `jj edit`. `jj edit` directly alters working copy targets in a mutable state, whereas `jj new <commit-id>` allows isolated, verifiable changes on top of the target commit before squashing.

3. **Apply and Verify Changes in the Working Copy `@`**:
   - Perform the required code modifications or resolve conflict markers.
   - **MANDATORY VERIFICATION**: Before squashing, execute all relevant lints, typechecks, and test suites. Never squash untested or failing code into an existing revision.

4. **Squash Back into Target with Explicit Strategy**:
   Squash the verified changes back into the target commit using `jj_squash`:
   ```json
   {
     "repo_path": "/path/to/repo",
     "from_revision": "@",
     "into_revision": "<commit-id>",
     "description_strategy": "use_destination_message"
   }
   ```
   > [!CAUTION]
   > Always set `description_strategy: "use_destination_message"` (or `"custom_message"`). Omitting this or using interactive strategies can hang the agent.

5. **Advance Incrementally Up the Stack**:
   Jujutsu will automatically rebase descendant commits. If any descendant commit now has conflicts or requires follow-up adjustments:
   - Identify the next affected descendant commit ID.
   - Run `jj new <next-commit-id>`.
   - Resolve, verify all tests pass, and squash.
   - Repeat until every commit in the stack is clean and green (`○`).
