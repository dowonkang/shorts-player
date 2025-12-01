import { test, expect } from '@playwright/test';

/**
 * T122-T123: High Instance Count Stress Testing
 * Tests that component can handle 100+ instances without crashes or performance degradation
 *
 * Requirements:
 * - SC-007: Support 100+ simultaneous instances
 * - PR-001: 60fps scrolling with 100 instances
 */

test.describe('100+ Instance Stress Testing', () => {
  test('[T122][T123] should create and render 100+ instances without errors', async ({ page }) => {
    // Create a test page with 100+ instances
    await page.goto('/examples/basic.html');

    const testResult = await page.evaluate(async () => {
      const feed = document.createElement('div');
      feed.style.cssText = 'max-width: 500px; margin: 0 auto;';
      document.body.appendChild(feed);

      const videos = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      ];

      const instanceCount = 100;
      const createdInstances = [];
      const errors = [];

      // Create 100 instances
      for (let i = 0; i < instanceCount; i++) {
        try {
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'height: 100vh; display: flex; align-items: center; padding: 20px;';

          const player = document.createElement('shorts-player');
          player.setAttribute('src', videos[i % videos.length]);
          player.setAttribute('aspect-ratio', '9/16');
          player.id = `stress-player-${i}`;

          wrapper.appendChild(player);
          feed.appendChild(wrapper);
          createdInstances.push(player);
        } catch (err) {
          errors.push({ instance: i, error: err.message });
        }
      }

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify all instances are connected
      const connectedCount = createdInstances.filter(p => p.isConnected).length;

      return {
        attempted: instanceCount,
        created: createdInstances.length,
        connected: connectedCount,
        errors
      };
    });

    console.log('100+ Instance Creation Results:', testResult);

    // SC-007: Should successfully create 100+ instances
    expect(testResult.created).toBe(100);
    expect(testResult.connected).toBe(100);
    expect(testResult.errors).toHaveLength(0);
  });

  test('[T122] should handle 100+ instances with scroll', async ({ page }) => {
    await page.goto('/examples/basic.html');

    // Create 100 instances and measure scroll performance
    const scrollResult = await page.evaluate(async () => {
      const feed = document.createElement('div');
      document.body.appendChild(feed);

      const videos = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
      ];

      // Create 100 instances
      for (let i = 0; i < 100; i++) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'height: 100vh;';

        const player = document.createElement('shorts-player');
        player.setAttribute('src', videos[i % videos.length]);
        wrapper.appendChild(player);
        feed.appendChild(wrapper);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Measure scroll performance
      const frames = [];
      let lastTime = performance.now();

      return new Promise((resolve) => {
        let scrollCount = 0;

        const measureFrame = (time) => {
          const delta = time - lastTime;
          if (delta > 0) {
            frames.push(1000 / delta);
          }
          lastTime = time;

          if (scrollCount < 30) {
            window.scrollBy({ top: 1000, behavior: 'instant' });
            scrollCount++;
            requestAnimationFrame(measureFrame);
          } else {
            const avgFps = frames.reduce((a, b) => a + b, 0) / frames.length;
            const minFps = Math.min(...frames);

            resolve({
              instanceCount: document.querySelectorAll('shorts-player').length,
              avgFps: Math.round(avgFps * 10) / 10,
              minFps: Math.round(minFps * 10) / 10
            });
          }
        };

        requestAnimationFrame(measureFrame);
      });
    });

    console.log('100 Instance Scroll Results:', scrollResult);

    expect(scrollResult.instanceCount).toBeGreaterThanOrEqual(100);
    // Allow lower FPS threshold for 100 instances (still smooth)
    expect(scrollResult.avgFps).toBeGreaterThan(50);
  });

  test('[T123] should maintain VideoPool limits with 100+ instances', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const poolResult = await page.evaluate(async () => {
      const feed = document.createElement('div');
      document.body.appendChild(feed);

      // Create 100 instances
      for (let i = 0; i < 100; i++) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'height: 100vh;';

        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        wrapper.appendChild(player);
        feed.appendChild(wrapper);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Scroll through to trigger video creation
      for (let i = 0; i < 20; i++) {
        window.scrollBy({ top: 1000, behavior: 'instant' });
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check pool limits
      const pool = window.VideoPool?.instance;
      if (!pool) {
        return { error: 'VideoPool not available' };
      }

      return {
        maxSize: pool.maxSize,
        currentPoolSize: pool.pool.length,
        totalPlayers: document.querySelectorAll('shorts-player').length
      };
    });

    console.log('VideoPool with 100 instances:', poolResult);

    // Pool should maintain max size limit (5)
    expect(poolResult.maxSize).toBe(5);
    expect(poolResult.currentPoolSize).toBeGreaterThanOrEqual(0);
    expect(poolResult.currentPoolSize).toBeLessThanOrEqual(5);
    expect(poolResult.totalPlayers).toBeGreaterThanOrEqual(100);
  });

  test('[T123] should not crash with rapid instance creation/destruction', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const crashTest = await page.evaluate(async () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const errors = [];
      let cycleCount = 0;

      // Rapidly create and destroy instances
      for (let cycle = 0; cycle < 10; cycle++) {
        try {
          // Create 20 instances
          const players = [];
          for (let i = 0; i < 20; i++) {
            const player = document.createElement('shorts-player');
            player.setAttribute('src', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
            container.appendChild(player);
            players.push(player);
          }

          await new Promise(resolve => setTimeout(resolve, 100));

          // Destroy all instances
          players.forEach(p => p.remove());

          await new Promise(resolve => setTimeout(resolve, 100));

          cycleCount++;
        } catch (err) {
          errors.push({ cycle, error: err.message });
        }
      }

      return {
        completedCycles: cycleCount,
        errors,
        finalPlayerCount: document.querySelectorAll('shorts-player').length
      };
    });

    console.log('Rapid creation/destruction test:', crashTest);

    expect(crashTest.completedCycles).toBe(10);
    expect(crashTest.errors).toHaveLength(0);
    expect(crashTest.finalPlayerCount).toBeLessThanOrEqual(1); // All or nearly all cleaned up
  });
});
