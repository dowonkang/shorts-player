import { test, expect } from '@playwright/test';

test.describe('VideoPool', () => {
  test('T024: should implement singleton pattern', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const isSingleton = await page.evaluate(() => {
      const pool1 = new window.VideoPool();
      const pool2 = new window.VideoPool();

      return pool1 === pool2;
    });

    expect(isSingleton).toBe(true);
  });

  test('T027: acquire() should return video element with playsinline, muted, preload=none', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const attributes = await page.evaluate(() => {
      const pool = new window.VideoPool();
      const video = pool.acquire();

      return {
        hasPlaysinline: video.hasAttribute('playsinline'),
        hasMuted: video.hasAttribute('muted'),
        preload: video.getAttribute('preload'),
        tagName: video.tagName
      };
    });

    expect(attributes.tagName).toBe('VIDEO');
    expect(attributes.hasPlaysinline).toBe(true);
    expect(attributes.hasMuted).toBe(true);
    expect(attributes.preload).toBe('none');
  });

  test('T029: release() should clean src, call load(), and return to pool', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const result = await page.evaluate(() => {
      const pool = new window.VideoPool();

      // Get video and set src
      const video = pool.acquire();
      video.src = 'test.mp4';

      const sizeBefore = pool.pool.length;

      // Release video
      pool.release(video);

      return {
        sizeBefore,
        sizeAfter: pool.pool.length,
        videoSrc: video.src,
        hasSrc: video.hasAttribute('src')
      };
    });

    expect(result.sizeBefore).toBe(0); // Empty before release
    expect(result.sizeAfter).toBe(1); // Video returned to pool
    expect(result.videoSrc).toBe(''); // Src cleared
    expect(result.hasSrc).toBe(false); // Src attribute removed
  });

  test('T031: should enforce maxSize limit (5 elements)', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const result = await page.evaluate(() => {
      const pool = new window.VideoPool(5); // maxSize = 5

      // Acquire and release 10 videos
      const videos = [];
      for (let i = 0; i < 10; i++) {
        videos.push(pool.acquire());
      }

      // Release all
      videos.forEach(v => pool.release(v));

      return {
        poolSize: pool.pool.length,
        maxSize: pool.maxSize
      };
    });

    expect(result.maxSize).toBe(5);
    expect(result.poolSize).toBe(5); // Only 5 kept in pool
  });
});
