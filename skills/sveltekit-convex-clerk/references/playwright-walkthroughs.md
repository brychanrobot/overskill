# Visual Walkthroughs: Playwright Screenshots & GIF Automation

Capturing visual proof is one of the most impactful practices when pairing with non-software engineers (non-SWEs) and solo creators. Providing animated GIFs and high-resolution screenshots in walkthroughs lets creators see their app functioning, verify design choices, and celebrate milestones without needing to run terminal commands.

---

## 1. Capturing Screenshots with Playwright

Playwright provides built-in methods to capture screenshots of full pages or individual UI elements.

### Full-Page Screenshot
```ts
// In any Playwright test or script:
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.screenshot({ 
  path: 'static/screenshots/homepage.png', 
  fullPage: true 
});
```

### Component / Element-Specific Screenshot
```ts
// Capture only the card or modal element
const card = page.locator('.card, section');
await card.screenshot({ 
  path: 'static/screenshots/card-preview.png' 
});
```

### Mobile Responsive Screenshot
```ts
// Switch viewport to mobile before capturing
await page.setViewportSize({ width: 375, height: 667 });
await page.screenshot({ 
  path: 'static/screenshots/mobile-view.png' 
});
```

---

## 2. Recording Interactive User Flows as Animated GIFs

Playwright natively records browser sessions as WebM video. We convert these recordings to lightweight, crisp animated GIFs using `ffmpeg` with two-pass palette generation.

### Why Two-Pass Palette Generation Matters
A standard single-pass GIF conversion produces banding, grain, and large file sizes. Two-pass palette optimization analyzes all frames to build a custom color palette (`palettegen`), then maps pixels precisely (`paletteuse`), creating stunning 12–15 fps GIFs with small file sizes.

### Manual FFmpeg Conversion Command
```bash
ffmpeg -y -i input.webm -vf "fps=12,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" output.gif
```

---

## 3. Automated Walkthrough Helper Script (`record-demo.ts`)

Every scaffolded project includes a standalone script in `scripts/record-demo.ts` that can be run directly using Node:

```bash
# Start your dev server
pnpm run dev

# In another terminal or background task, record the demo:
node scripts/record-demo.ts
```

### Customizing Interactions in `scripts/record-demo.ts`

You can customize the script to record any specific user flow:

```ts
import { recordWalkthrough } from './record-demo.ts';

await recordWalkthrough({
  url: 'http://localhost:5173',
  outputGifPath: 'static/demo.gif',
  screenshotsDir: 'static/screenshots',
  width: 1200,
  height: 800,
  fps: 12,
  async action(page) {
    // 1. Initial screenshot
    await page.screenshot({ path: 'static/screenshots/step-1.png' });
    await page.waitForTimeout(800);

    // 2. Interact with the UI
    const input = page.getByPlaceholder(/add a new item/i);
    await input.fill('Launch on Product Hunt');
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /add/i }).click();
    await page.waitForTimeout(1500); // Wait for Convex reactive WebSocket sync!

    // 3. Toggle checkbox
    await page.getByRole('checkbox').first().click();
    await page.waitForTimeout(1000);

    // 4. Completed screenshot
    await page.screenshot({ path: 'static/screenshots/step-2.png' });
  },
});
```

---

## 4. Embedding Media in Antigravity `walkthrough.md` Artifacts

When pair programming with Antigravity agents, follow these rules when embedding visual proof in `walkthrough.md`:

1. **Artifact Directory Rule**: If you are embedding media in an artifact and the file is NOT already in `<appDataDir>/brain/<conversation-id>`, you **must** copy the file to the conversation artifact directory first!
   ```bash
   cp static/demo.gif /home/bryant/.gemini/antigravity/brain/<conversation-id>/demo.gif
   cp static/screenshots/step-1.png /home/bryant/.gemini/antigravity/brain/<conversation-id>/step-1.png
   ```

2. **Embedding in Markdown**:
   Use absolute file links:
   ```markdown
   ## Interactive Flow Demo
   ![Live Demo](file:///home/bryant/.gemini/antigravity/brain/<conversation-id>/demo.gif)

   ### Before & After
   | Before Action | After Realtime Update |
   | :---: | :---: |
   | ![Before](file:///home/bryant/.gemini/antigravity/brain/<conversation-id>/step-1.png) | ![After](file:///home/bryant/.gemini/antigravity/brain/<conversation-id>/step-2.png) |
   ```

3. **Carousel Slides (Optional)**:
   Use carousels for progressive step walkthroughs:
   ````markdown
   ````carousel
   ![Step 1: Empty State](file:///path/to/step-1.png)
   <!-- slide -->
   ![Step 2: Adding New Item](file:///path/to/step-2.png)
   <!-- slide -->
   ![Step 3: Realtime Synchronized](file:///path/to/step-3.png)
   ````
   ````
