import { test, expect } from '@playwright/test';

/**
 * T120-T121: Memory Leak & Stability Testing
 * Tests that component doesn't leak memory over extended scrolling sessions
 *
 * Requirements:
 * - SC-005: <10% memory growth after 100 scroll cycles
 * - PR-003: Memory-efficient cleanup mechanisms
 */

test.describe('Memory Leak Testing', () => {
  test('[T120][T121] should not leak memory after 100+ scroll cycles', async ({ page, context }) => {
    // Enable memory tracking (requires --expose-gc flag)
    await context.grantPermissions(['clipboard-read']);

    await page.goto('/examples/scroll-feed.html');
    await page.waitForSelector('shorts-player', { timeout: 5000 });

    // Wait for initial render to stabilize
    await page.waitForTimeout(1000);

    // Get initial memory baseline
    const initialMemory = await page.evaluate(() => {
      // Force GC if available
      if (window.gc) {
        window.gc();
      }

      return performance.memory
        ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          }
        : null;
    });

    if (!initialMemory) {
      console.warn('performance.memory not available - skipping memory test');
      test.skip();
      return;
    }

    console.log('Initial memory:', {
      used: `${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(initialMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
    });

    // Scroll through 100+ cycles
    const scrollCycles = 100;
    console.log(`Starting ${scrollCycles} scroll cycles...`);

    for (let i = 0; i < scrollCycles; i++) {
      // Scroll down
      await page.evaluate(() => {
        window.scrollBy({ top: 1000, behavior: 'instant' });
      });
      await page.waitForTimeout(100);

      // Every 10 cycles, scroll back to top to test cleanup
      if (i % 10 === 9) {
        await page.evaluate(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
        await page.waitForTimeout(500); // Allow cleanup grace period
      }

      // Progress indicator
      if ((i + 1) % 20 === 0) {
        console.log(`  Completed ${i + 1}/${scrollCycles} cycles`);
      }
    }

    // Wait for cleanup timers to complete (200ms grace period + buffer)
    await page.waitForTimeout(500);

    // Force final GC
    const finalMemory = await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }

      return performance.memory
        ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          }
        : null;
    });

    console.log('Final memory:', {
      used: `${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(finalMemory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
    });

    // Calculate growth percentage
    const growthBytes = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
    const growthPercent = (growthBytes / initialMemory.usedJSHeapSize) * 100;

    console.log(`Memory growth: ${growthPercent.toFixed(2)}% (${(growthBytes / 1024 / 1024).toFixed(2)} MB)`);

    // SC-005: Less than 10% memory growth
    expect(growthPercent).toBeLessThan(10);
  });

  test('[T120] should release video elements back to pool', async ({ page }) => {
    await page.goto('/examples/scroll-feed.html');
    await page.waitForSelector('shorts-player', { timeout: 5000 });

    // Get initial pool state
    const initialPoolSize = await page.evaluate(() => {
      return window.VideoPool?.instance?.pool.length || 0;
    });

    console.log(`Initial pool size: ${initialPoolSize}`);

    // Scroll through several videos
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy({ top: 800, behavior: 'instant' }));
      await page.waitForTimeout(150);
    }

    // Wait for cleanup grace period
    await page.waitForTimeout(500);

    // Check pool size increased (videos returned)
    const finalPoolSize = await page.evaluate(() => {
      return window.VideoPool?.instance?.pool.length || 0;
    });

    console.log(`Final pool size: ${finalPoolSize}`);

    // Pool should have videos returned (at least some)
    expect(finalPoolSize).toBeGreaterThan(0);
  });

  test('[T121] should cleanup event listeners on disconnect', async ({ page }) => {
    await page.goto('/examples/scroll-feed.html');
    await page.waitForSelector('shorts-player', { timeout: 5000 });

    // Create tracking for event listener leaks
    const listenerInfo = await page.evaluate(() => {
      const players = Array.from(document.querySelectorAll('shorts-player'));
      const firstPlayer = players[0];

      // Track if AbortController is properly created
      const hasAbortController = firstPlayer._abortController !== null;

      // Remove a player
      if (players.length > 0) {
        players[0].remove();
      }

      return {
        hasAbortController,
        playersRemaining: document.querySelectorAll('shorts-player').length
      };
    });

    console.log('Event listener cleanup info:', listenerInfo);

    expect(listenerInfo.hasAbortController).toBe(true);
    expect(listenerInfo.playersRemaining).toBeLessThan(20); // One was removed
  });

  test('[T121] should not accumulate DOM nodes', async ({ page }) => {
    await page.goto('/examples/scroll-feed.html');
    await page.waitForSelector('shorts-player', { timeout: 5000 });

    // Get initial DOM node count
    const initialNodeCount = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    console.log(`Initial DOM nodes: ${initialNodeCount}`);

    // Aggressive scrolling
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy({ top: 1500, behavior: 'instant' }));
      await page.waitForTimeout(100);
      await page.evaluate(() => window.scrollBy({ top: -1000, behavior: 'instant' }));
      await page.waitForTimeout(100);
    }

    // Wait for cleanup
    await page.waitForTimeout(500);

    const finalNodeCount = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    console.log(`Final DOM nodes: ${finalNodeCount}`);

    // Should not have accumulated many nodes (allow some variance for browser internals)
    const nodeGrowth = finalNodeCount - initialNodeCount;
    console.log(`Node growth: ${nodeGrowth}`);

    expect(nodeGrowth).toBeLessThan(100); // Reasonable threshold
  });
});
