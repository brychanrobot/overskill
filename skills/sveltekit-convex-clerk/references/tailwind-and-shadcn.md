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

Your `src/app.css` imports Tailwind and defines the design system tokens used by both Tailwind utility classes and `shadcn-svelte` components:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }

  * {
    border-color: hsl(var(--border));
  }

  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    min-height: 100vh;
  }
}

@theme {
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

---

## 2. shadcn-svelte Setup & Architecture

`shadcn-svelte` is a collection of accessible, re-usable component primitives built on **Bits UI** and styled with Tailwind. Unlike traditional component libraries installed into `node_modules`, `shadcn-svelte` copies component code directly into `src/lib/components/ui/`, giving you total ownership of the source.

### Initialization

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

Install core dependencies:
```bash
pnpm add clsx tailwind-merge bits-ui
```

### Adding Components

Add any component with a single command:

```bash
# Core buttons and inputs
pnpm dlx shadcn-svelte@latest add button input badge

# Structured content
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
