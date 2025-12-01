/**
 * Integration tests for Auto-Play/Pause Logic
 * Phase 2: User Story 1 (MVP) - Auto-Play/Pause Integration
 */

import { test, expect } from '@playwright/test';

test.describe('Auto-Play/Pause Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Use the scroll feed example which already has the component loaded
    await page.goto('/examples/scroll-feed.html');

    // Wait for component to be defined
    await page.waitForFunction(() => {
      return window.customElements.get('shorts-player') !== undefined;
    }, { timeout: 10000 });
  });

  // T081: Auto-play when >50% visible
  test('[T081] should auto-play when >50% visible', async ({ page }) => {
    // Get first player (which should be out of view initially)
    const player = page.locator('shorts-player').first();

    // Scroll to top first
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // Initially out of viewport
    const initialPlaying = await player.evaluate(el => el._isPlaying);
    expect(initialPlaying).toBe(false);

    // Scroll player into view (center)
    await player.scrollIntoViewIfNeeded();

    // Wait for intersection observer + requestIdleCallback
    await page.waitForTimeout(500);

    // Should be playing now
    const playingAfterScroll = await player.evaluate(el => el._isPlaying);
    expect(playingAfterScroll).toBe(true);
  });

  // T084: Auto-play for tall videos
  test('[T084] should auto-play tall video when >50% viewport occupied', async ({ page }) => {
    // Create a very tall player
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/src/shorts-player.css">
        <style>
          body { margin: 0; padding: 0; }
          .spacer { height: 50vh; }
          shorts-player { width: 100%; max-width: 500px; margin: 0 auto; height: 200vh; }
        </style>
      </head>
      <body>
        <div class="spacer"></div>
        <shorts-player
          id="tall-player"
          src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0">
        </shorts-player>
        <div class="spacer"></div>

        <script type="module" src="/src/intersection-manager.js"></script>
        <script type="module" src="/src/video-pool.js"></script>
        <script type="module" src="/src/shorts-player.js"></script>
      </body>
      </html>
    `);

    await page.waitForFunction(() => window.customElements.get('shorts-player') !== undefined);

    const player = page.locator('#tall-player');
    await player.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Should play even if <50% of video visible, because it occupies >50% of viewport
    const isPlaying = await player.evaluate(el => el._isPlaying);
    expect(isPlaying).toBe(true);
  });

  // T086: Auto-pause when <50% visible
  test('[T086] should auto-pause when scrolled out of view', async ({ page }) => {
    const player = page.locator('#player-0');

    // Scroll into view
    await player.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const playingInView = await player.evaluate(el => el._isPlaying);
    expect(playingInView).toBe(true);

    // Scroll away
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Should be paused now
    const playingOutOfView = await player.evaluate(el => el._isPlaying);
    expect(playingOutOfView).toBe(false);
  });

  // T088: Cleanup delay (200ms grace period)
  test('[T088] should delay cleanup for 200ms', async ({ page }) => {
    const player = page.locator('#player-1');

    // Scroll into view and play
    await player.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Scroll out
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(50); // Less than 200ms

    // Cleanup timer should be set but not executed yet
    const hasTimer = await player.evaluate(el => el._cleanupTimer !== null);
    expect(hasTimer).toBe(true);

    // Wait for cleanup
    await page.waitForTimeout(200);

    // Timer should be cleared after execution
    const timerAfterCleanup = await player.evaluate(el => el._cleanupTimer);
    expect(timerAfterCleanup).toBe(null);
  });

  // T090: Cleanup cancellation on re-entry
  test('[T090] should cancel cleanup on scroll bounce', async ({ page }) => {
    const player = page.locator('#player-2');

    // Scroll into view
    await player.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Scroll out
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(50);

    // Should have cleanup timer
    const hasTimerBefore = await player.evaluate(el => el._cleanupTimer !== null);
    expect(hasTimerBefore).toBe(true);

    // Scroll back in before cleanup executes
    await player.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    // Timer should be cancelled
    const hasTimerAfter = await player.evaluate(el => el._cleanupTimer !== null);
    expect(hasTimerAfter).toBe(false);

    // Should still be playing
    const isPlaying = await player.evaluate(el => el._isPlaying);
    expect(isPlaying).toBe(true);
  });
});
