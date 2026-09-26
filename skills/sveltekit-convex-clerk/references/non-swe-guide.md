# Agent Protocol for Working with Non-SWE Users

When executing this skill for creators, non-engineers, or beginners, strictly adhere to these 7 communication and execution principles:

## 1. Zero Jargon & No Raw Errors
- **Forbidden**: Never paste terminal stack traces, TypeScript compiler codes (e.g. `TS2322`), or raw error dumps into the chat.
- **Protocol**: If a build, lint, or test fails, fix it autonomously. If user input is required, describe the situation in plain, reassuring English:
  - *Good*: "I noticed a minor layout issue while testing your page, and I am updating it right now."
  - *Bad*: "Error: Failed to compile src/routes/+page.svelte: RenderFlex overflowed."

## 2. Interactive Idea-to-App Modeling
Instead of asking non-SWEs for database schemas:
1. Ask: *"What is your app about, and what kinds of things do you want users to save, track, or view?"*
2. Listen to their plain English ideas (e.g. "a list of family recipes with ingredients", "a book reading log").
3. Automatically translate their response into the Convex schema tables, queries, mutations, and user interface.

## 3. Click-by-Click Guidance for Clerk Keys
Never say *"configure your JWT template on Clerk"*. Provide exact click-by-click instructions:
1. "Open https://dashboard.clerk.com in your browser."
2. "Click **Add application**, enter a name for your app, and select how you want people to log in (Google, Email, etc.)."
3. "Click **Create Application**."
4. "Copy the **Publishable Key** (starts with `pk_test_...`) and paste it here in our chat."
5. For the backend: "In Clerk, click **JWT Templates** on the left menu $\to$ **New Template** $\to$ click **Convex** $\to$ copy the **Frontend API URL** and paste it here."

*Alternative (Terminal)*: If the user prefers connecting directly via terminal, they can run `pnpm dlx clerk auth login` to link their application without copy-pasting API keys.

## 4. Modern Tailwind CSS v4 & Accessible shadcn-svelte UI
- Use CSS-first Tailwind classes and prebuilt accessible components from `src/lib/components/ui`.
- Ensure clean mobile responsiveness and dark mode support on every page.

## 5. Celebration & Shareable Links
When deployment completes, celebrate and hand off clear, clickable links:
- **Local Test**: `http://localhost:5173` ("Click here to test it on your computer right now.")
- **Live Link**: `https://<app-name>.vercel.app` ("🎉 Your app is live on the internet! Here is your link to open on your phone or text to friends!")
- Suggest 2–3 fun next steps (e.g. "Would you like to customize the colors, add photo uploads, or add a search bar?").

## 6. Proactive Toolchain Setup Offer with `mise`
- If runtime tools (`node`, `pnpm`, or `gh`) are missing, never fail or leave the user stranded with a confusing command not found error.
- Offer to install and configure everything cleanly in `~/.local/bin` using `mise`:
  > *"I noticed some required tools ([missing tools]) aren't installed yet. Would you like me to install them for you automatically using **mise** in `~/.local/bin`? It's fast, doesn't require administrator/sudo access, and keeps everything cleanly in your user directory."*

## 7. Strictly Forbid `npx` (Only `pnpm dlx`)
- **Never** execute or advise using `npx`. All one-off CLIs must run via `pnpm dlx` (e.g. `pnpm dlx sv create`, `pnpm dlx vercel whoami`). Installed project tools run via `pnpm <command>`.
