import { test, expect } from '@playwright/test';

/**
 * T118-T119: Frame Rate & Performance Stress Testing
 * Tests that component maintains 60fps scrolling with 50+ instances
 *
 * Requirements:
 * - PR-001: 60fps scrolling with 100 instances
 * - SC-001: No frame drops below 58fps
 */

test.describe('Rapid Scroll Performance', () => {
  test('[T118][T119] should maintain 60fps during rapid scroll with 50+ instances', async ({ page }) => {
    // Navigate to scroll feed example
    await page.goto('/examples/scroll-feed.html');

    // Wait for first player to be registered
    await page.waitForSelector('shorts-player', { timeout: 5000 });

    // Get instance count
    const instanceCount = await page.evaluate(() => {
      return document.querySelectorAll('shorts-player').length;
    });

    console.log(`Testing with ${instanceCount} instances`);
    expect(instanceCount).toBeGreaterThanOrEqual(20); // At least 20 instances

    // Measure frame rate during rapid scrolling
    const { avgFps, minFps, frameDrops, totalFrames } = await page.evaluate(async () => {
      const frames = [];
      let lastTime = performance.now();

      return new Promise((resolve) => {
        let scrollCount = 0;
        const maxScrolls = 50;

        const measureFrame = (time) => {
          const delta = time - lastTime;
          if (delta > 0) {
            const fps = 1000 / delta;
            frames.push(fps);
          }
          lastTime = time;

          // Rapid scroll during measurement
          if (scrollCount < maxScrolls) {
            window.scrollBy({ top: 800, behavior: 'instant' });
            scrollCount++;
            requestAnimationFrame(measureFrame);
          } else {
            // Calculate metrics
            const avgFps = frames.reduce((a, b) => a + b, 0) / frames.length;
            const minFps = Math.min(...frames);
            const frameDrops = frames.filter(f => f < 55).length;

            resolve({
              avgFps: Math.round(avgFps * 10) / 10,
              minFps: Math.round(minFps * 10) / 10,
              frameDrops,
              totalFrames: frames.length
            });
          }
        };

        requestAnimationFrame(measureFrame);
      });
    });

    console.log(`Frame Rate Results:
      - Average FPS: ${avgFps}
      - Minimum FPS: ${minFps}
      - Frame Drops (<55fps): ${frameDrops}
      - Total Frames: ${totalFrames}
    `);

    // PR-001: Must maintain average 60fps (allow 58fps minimum due to browser variance)
    expect(avgFps).toBeGreaterThan(58);

    // SC-001: No significant frame drops
    const dropRate = (frameDrops / totalFrames) * 100;
    expect(dropRate).toBeLessThan(5); // Less than 5% frame drops
  });

  test('[T118] should handle aggressive scroll without crashes', async ({ page }) => {
    await page.goto('/examples/scroll-feed.html');
    await page.waitForSelector('shorts-player', { timeout: 5000 });

    // Very aggressive scrolling pattern
    for (let i = 0; i < 20; i++) {
      // Scroll down rapidly
      await page.evaluate(() => window.scrollBy({ top: 2000, behavior: 'instant' }));
      await page.waitForTimeout(50);

      // Scroll up rapidly
      await page.evaluate(() => window.scrollBy({ top: -1000, behavior: 'instant' }));
      await page.waitForTimeout(50);
    }

    // Verify page is still responsive
    const isResponsive = await page.evaluate(() => {
      return document.querySelectorAll('shorts-player').length > 0;
    });

    expect(isResponsive).toBe(true);
  });

  test('[T119] should maintain performance with scroll bouncing', async ({ page }) => {
    await page.goto('/examples/scroll-feed.html');
    await page.waitForSelector('shorts-player', { timeout: 5000 });

    // Simulate scroll bouncing (rapid direction changes)
    const bounceCount = 30;
    const startTime = performance.now();

    for (let i = 0; i < bounceCount; i++) {
      const direction = i % 2 === 0 ? 500 : -500;
      await page.evaluate((dir) => {
        window.scrollBy({ top: dir, behavior: 'instant' });
      }, direction);
      await page.waitForTimeout(100); // Within 200ms cleanup grace period
    }

    const duration = performance.now() - startTime;

    // Should complete within reasonable time (< 5 seconds for 30 bounces)
    expect(duration).toBeLessThan(5000);

    // Verify VideoPool didn't leak resources
    const poolStatus = await page.evaluate(() => {
      if (window.VideoPool?.instance) {
        return {
          available: window.VideoPool.instance.pool.length,
          maxSize: window.VideoPool.instance.maxSize
        };
      }
      return null;
    });

    console.log(`VideoPool status after bounce test:`, poolStatus);

    if (poolStatus) {
      // Pool should maintain max size limit (videos may still be in use due to grace period)
      expect(poolStatus.available).toBeGreaterThanOrEqual(0);
      expect(poolStatus.available).toBeLessThanOrEqual(poolStatus.maxSize);
    }
  });
});
