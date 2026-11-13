# Tailwind CSS v4 & shadcn-svelte Reference

This guide covers how **Tailwind CSS v4** and **shadcn-svelte** work together in SvelteKit with Svelte 5.

---

## 1. Tailwind CSS v4 Architecture

Tailwind v4 is CSS-first and requires zero `tailwind.config.js` or PostCSS files.

### Configuration in `vite.config.ts`

Tailwind v4 integrates directly into Vite via the official plugin:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
});
```

### Global Styles in `src/app.css`

Your `src/app.css` imports Tailwind and defines the design system tokens used by both Tailwind utility classes and `shadcn-svelte` components.

> [!IMPORTANT]
> **Preventing Clerk Modal Transparency with Tailwind CSS v4 (`hsl(...)` Wrappers)**:
> In Tailwind CSS v4, root design variables like `--card`, `--background`, and `--popover` must be defined as valid, executable CSS color values (e.g. `hsl(0 0% 100%)`) rather than bare color channels (`0 0% 100%`).
> When `@clerk/ui` applies `style="background-color: var(--card)"`, bare channel values cause the browser to mark the property invalid and fall back to transparent, making modal dialogs and backdrops completely invisible. Wrapping tokens in `hsl(...)` ensures solid, opaque modal dialog rendering.

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: hsl(0 0% 100%);
    --foreground: hsl(240 10% 3.9%);
    --card: hsl(0 0% 100%);
    --card-foreground: hsl(240 10% 3.9%);
    --popover: hsl(0 0% 100%);
    --popover-foreground: hsl(240 10% 3.9%);
    --primary: hsl(240 5.9% 10%);
    --primary-foreground: hsl(0 0% 98%);
    --secondary: hsl(240 4.8% 95.9%);
    --secondary-foreground: hsl(240 5.9% 10%);
    --muted: hsl(240 4.8% 95.9%);
    --muted-foreground: hsl(240 3.8% 46.1%);
    --accent: hsl(240 4.8% 95.9%);
    --accent-foreground: hsl(240 5.9% 10%);
    --destructive: hsl(0 84.2% 60.2%);
    --destructive-foreground: hsl(0 0% 98%);
    --border: hsl(240 5.9% 90%);
    --input: hsl(240 5.9% 90%);
    --ring: hsl(240 5.9% 10%);
    --radius: 0.5rem;
  }

  .dark {
    --background: hsl(240 10% 3.9%);
    --foreground: hsl(0 0% 98%);
    --card: hsl(240 10% 3.9%);
    --card-foreground: hsl(0 0% 98%);
    --popover: hsl(240 10% 3.9%);
    --popover-foreground: hsl(0 0% 98%);
    --primary: hsl(0 0% 98%);
    --primary-foreground: hsl(240 5.9% 10%);
    --secondary: hsl(240 3.7% 15.9%);
    --secondary-foreground: hsl(0 0% 98%);
    --muted: hsl(240 3.7% 15.9%);
    --muted-foreground: hsl(240 5% 64.9%);
    --accent: hsl(240 3.7% 15.9%);
    --accent-foreground: hsl(0 0% 98%);
    --destructive: hsl(0 62.8% 30.6%);
    --destructive-foreground: hsl(0 0% 98%);
    --border: hsl(240 3.7% 15.9%);
    --input: hsl(240 3.7% 15.9%);
    --ring: hsl(240 4.9% 83.9%);
  }

  * {
    border-color: var(--border);
  }

  body {
    background-color: var(--background);
    color: var(--foreground);
    font-feature-settings: "rlig" 1, "calt" 1;
    min-height: 100vh;
  }
}

@theme {
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

---

## 2. shadcn-svelte Setup & Architecture

`shadcn-svelte` is a collection of accessible, re-usable component primitives built on **Bits UI** and styled with Tailwind. Unlike traditional component libraries installed into `node_modules`, `shadcn-svelte` copies component code directly into `src/lib/components/ui/`, giving you total ownership of the source.

### Initialization & Dependencies

Ensure `components.json` is in the project root:

```json
{
  "$schema": "https://shadcn-svelte.com/schema.json",
  "style": "default",
  "tailwind": {
    "config": "",
    "css": "src/app.css",
    "baseColor": "zinc"
  },
  "aliases": {
    "components": "$lib/components",
    "utils": "$lib/utils",
    "ui": "$lib/components/ui",
    "hooks": "$lib/hooks"
  },
  "typescript": true
}
```

Install core dependencies and utilities:
```bash
pnpm add clsx tailwind-merge bits-ui lucide-svelte tailwind-variants tw-animate-css
```

- **`bits-ui`**: Headless, accessible Svelte 5 component primitives powering shadcn-svelte.
- **`lucide-svelte`**: Icon set for UI controls, navigation, and badges.
- **`clsx` & `tailwind-merge`**: Class merging utilities unified in `$lib/utils.ts` (`cn(...)`).
- **`tailwind-variants`**: Type-safe variant styling.
- **`tw-animate-css`**: Animation utilities for dialog, dropdown, and sheet transitions.

### Adding Components

Add components on demand with `pnpm dlx shadcn-svelte@latest add`:

```bash
# Core buttons, badges, inputs
pnpm dlx shadcn-svelte@latest add button input badge

# Structured content cards
pnpm dlx shadcn-svelte@latest add card

# Modals, drawers, and menus
pnpm dlx shadcn-svelte@latest add dialog sheet dropdown-menu
```

Components will appear in `src/lib/components/ui/<component>/`.

---

## 3. Usage Examples with Svelte 5 Runes

### Button & Card
```svelte
<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Weekly Summary</Card.Title>
    <Card.Description>Review your tasks and milestones.</Card.Description>
  </Card.Header>
  <Card.Content>
    <p>Everything is on track!</p>
  </Card.Content>
  <Card.Footer>
    <Button variant="default">View Details</Button>
  </Card.Footer>
</Card.Root>
```

### Dialog (Modal) with `$state`
```svelte
<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';

  let open = $state(false);
  let itemName = $state('');
</script>

<Button onclick={() => (open = true)}>Add New Item</Button>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Create New Item</Dialog.Title>
      <Dialog.Description>Enter the details for your new item below.</Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <Input bind:value={itemName} placeholder="Item title..." />
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
      <Button onclick={() => { /* save logic */ open = false; }}>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```
