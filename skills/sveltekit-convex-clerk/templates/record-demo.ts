import { chromium, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';

export interface RecordOptions {
  /** Target URL to record (default: http://<project-name>.localhost or http://localhost:5173) */
  url?: string;
  /** Destination path for the output GIF (default: static/demo.gif) */
  outputGifPath?: string;
  /** Directory to save static screenshots (default: static/screenshots) */
  screenshotsDir?: string;
  /** Viewport width in pixels (default: 1200) */
  width?: number;
  /** Viewport height in pixels (default: 800) */
  height?: number;
  /** Frame rate for the generated GIF (default: 12 fps) */
  fps?: number;
  /** Optional artifact directory to copy media to for AGY walkthrough embedding */
  artifactDir?: string;
  /** Custom interaction sequence */
  action?: (page: Page) => Promise<void>;
}

/**
 * Records user interactions in a browser, captures screenshots, and converts
 * the resulting recording into an optimized, high-definition animated GIF.
 */
export async function recordWalkthrough(options: RecordOptions = {}) {
  const defaultUrl = process.env.LOCAL_DOMAIN
    ? `http://${process.env.LOCAL_DOMAIN}`
    : (process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173');

  const {
    url = defaultUrl,

    outputGifPath = 'static/demo.gif',
    screenshotsDir = 'static/screenshots',
    width = 1200,
    height = 800,
    fps = 12,
    artifactDir,
    action,
  } = options;

  console.log(`🎬 Launching browser to record walkthrough from ${url}...`);

  // 1. Ensure working and output directories exist
  const tempDir = path.resolve('.temp-recordings');
  if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

  const resolvedScreenshotsDir = path.resolve(screenshotsDir);
  if (!existsSync(resolvedScreenshotsDir)) mkdirSync(resolvedScreenshotsDir, { recursive: true });

  const resolvedGifDir = path.dirname(path.resolve(outputGifPath));
  if (!existsSync(resolvedGifDir)) mkdirSync(resolvedGifDir, { recursive: true });

  // 2. Launch browser with native video recording
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width, height },
    recordVideo: {
      dir: tempDir,
      size: { width, height },
    },
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // 3. Execute custom interaction or default demonstration flow
    if (action) {
      await action(page);
    } else {
      // Default sample flow:
      // Capture initial state
      const initialScreenshot = path.join(resolvedScreenshotsDir, 'step-1-initial.png');
      await page.screenshot({ path: initialScreenshot, fullPage: true });
      console.log(`📸 Saved screenshot: ${initialScreenshot}`);
      await page.waitForTimeout(1000);

      // Try interacting with standard demo controls if available
      const itemInput = page.getByPlaceholder(/add a new item|new item/i).first();
      if (await itemInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await itemInput.fill('Explore the new feature');
        await page.waitForTimeout(600);

        const addButton = page.getByRole('button', { name: /add|create|save/i }).first();
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(1500);
        }

        // Toggle first checkbox if present
        const checkbox = page.getByRole('checkbox').first();
        if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
          await checkbox.click();
          await page.waitForTimeout(1000);
        }
      }

      // Capture completed state
      const completedScreenshot = path.join(resolvedScreenshotsDir, 'step-2-completed.png');
      await page.screenshot({ path: completedScreenshot, fullPage: true });
      console.log(`📸 Saved screenshot: ${completedScreenshot}`);
    }
  } finally {
    // 4. Close context and browser to flush the video recording
    await context.close();
    await browser.close();
  }

  // 5. Locate the generated WebM video file
  const videoPath = await page.video()?.path();
  if (!videoPath || !existsSync(videoPath)) {
    throw new Error('Playwright did not produce a video file.');
  }

  console.log(`📹 Video recorded to ${videoPath}. Converting to optimized GIF...`);

  // 6. Convert WebM to high-quality palette-optimized GIF via ffmpeg
  // Two-pass palette generation produces crisp colors without banding or dithering grain
  const paletteFilter = `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5`;
  const ffmpegCmd = `ffmpeg -y -i "${videoPath}" -vf "${paletteFilter}" "${outputGifPath}"`;

  try {
    execSync(ffmpegCmd, { stdio: 'inherit' });
    console.log(`✅ High-definition GIF successfully generated at: ${outputGifPath}`);
  } catch (err) {
    console.error('⚠️ ffmpeg conversion failed. Ensure ffmpeg is installed.', err);
    throw err;
  } finally {
    // Clean up raw temp video
    try {
      if (existsSync(videoPath)) unlinkSync(videoPath);
    } catch {}
  }

  // 7. If an artifact directory is specified, copy screenshots and GIF for AGY walkthrough embedding
  if (artifactDir && existsSync(artifactDir)) {
    const destGif = path.join(artifactDir, path.basename(outputGifPath));
    copyFileSync(outputGifPath, destGif);
    console.log(`📋 Copied demo GIF to artifact directory: ${destGif}`);
  }

  return {
    gifPath: outputGifPath,
    screenshotsDir: resolvedScreenshotsDir,
  };
}

// Allow direct CLI execution: `node scripts/record-demo.ts`
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  recordWalkthrough().catch((err) => {
    console.error('Walkthrough recording error:', err);
    process.exit(1);
  });
}
