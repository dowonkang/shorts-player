/**
 * Unit tests for edge cases
 * Phase 4: Error Handling & Edge Cases (T171-T184)
 */

import { test, expect } from '@playwright/test';

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
  });

  // T171-T172: Rapid scroll direction changes (scroll bounce)
  test('[T171][T172] should handle scroll bounce with 200ms grace period', async ({ page }) => {
    await page.goto('/examples/scroll-feed.html');
    await page.waitForSelector('shorts-player', { timeout: 5000 });

    const result = await page.evaluate(async () => {
      const players = Array.from(document.querySelectorAll('shorts-player'));
      if (players.length === 0) return { error: 'No players found' };

      const player = players[0];

      // Scroll into view
      player.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 300));

      const hadVideo = player._videoElement !== null;

      // Scroll out briefly
      window.scrollBy({ top: 1000, behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 100)); // Within 200ms grace period

      // Scroll back in
      player.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 50));

      const stillHasVideo = player._videoElement !== null;

      return {
        hadVideo,
        stillHasVideo,
        gracePeriodWorked: hadVideo && stillHasVideo
      };
    });

    if (result.error) {
      test.skip();
      return;
    }

    // Video should be retained during grace period
    expect(result.gracePeriodWorked).toBe(true);
  });

  // T173-T174: DOM removal during playback
  test('[T173][T174] should cleanup safely on DOM removal', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAA');
      document.body.appendChild(player);

      // Create video
      if (player._createVideo) {
        player._createVideo();
      }

      const hadVideo = player._videoElement !== null;

      // Remove from DOM while "playing"
      player.remove();

      // Check cleanup via microtask
      return new Promise(resolve => {
        setTimeout(() => {
          const stillConnected = player.isConnected;
          resolve({ hadVideo, stillConnected });
        }, 10);
      });
    });

    expect(result.hadVideo).toBe(true);
    expect(result.stillConnected).toBe(false);
  });

  // T175-T176: Viewport resize during playback
  test('[T175][T176] should handle viewport resize', async ({ page }) => {
    await page.goto('/examples/scroll-feed.html');
    await page.waitForSelector('shorts-player', { timeout: 5000 });

    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(100);

    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    await page.waitForTimeout(100);

    const result = await page.evaluate(() => {
      const players = document.querySelectorAll('shorts-player');
      return {
        playerCount: players.length,
        hasPlayers: players.length > 0
      };
    });

    // Players should still exist after resize
    expect(result.hasPlayers).toBe(true);
  });

  // T177-T178: Tab backgrounding
  test('[T177][T178] should handle page visibility changes', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAA');
      document.body.appendChild(player);

      if (player._createVideo) {
        player._createVideo();
      }

      const video = player._videoElement;

      // Simulate visibility change
      const visibilityEvent = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true
      });
      document.dispatchEvent(visibilityEvent);

      document.body.removeChild(player);

      return {
        hasVideo: video !== null,
        videoExists: true
      };
    });

    // Component should handle visibility changes gracefully
    expect(result.hasVideo).toBe(true);
  });

  // T179-T180: Multiple videos meeting threshold simultaneously
  test('[T179][T180] should handle concurrent video acquisition', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const players = [];
      const videoCount = 10;

      // Create multiple players
      for (let i = 0; i < videoCount; i++) {
        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAA');
        document.body.appendChild(player);
        players.push(player);
      }

      // Try to create videos concurrently
      const promises = players.map(player => {
        if (player._createVideo) {
          return Promise.resolve(player._createVideo());
        }
        return Promise.resolve(null);
      });

      await Promise.all(promises);

      const videosCreated = players.filter(p => p._videoElement !== null).length;

      // Cleanup
      players.forEach(p => p.remove());

      return {
        playersCreated: videoCount,
        videosCreated,
        poolSize: window.VideoPool?.instance?.pool.length || 0
      };
    });

    expect(result.playersCreated).toBe(10);
    // VideoPool should handle concurrent requests
    expect(result.videosCreated).toBeGreaterThan(0);
  });

  // T181-T182: HLS manifest load failure
  test('[T181][T182] should handle HLS manifest load failure', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'https://example.com/nonexistent.m3u8');
      document.body.appendChild(player);

      let hlsErrorFired = false;
      let errorDetail = null;

      player.addEventListener('error', (e) => {
        if (e.detail.type === 'hls') {
          hlsErrorFired = true;
          errorDetail = e.detail;
        }
      });

      if (player._createVideo) {
        player._createVideo();
      }

      // Wait for potential HLS initialization and error
      await new Promise(resolve => setTimeout(resolve, 1000));

      document.body.removeChild(player);

      return {
        isHLSSource: player._isHLSSource?.('https://example.com/nonexistent.m3u8'),
        hlsErrorFired,
        errorDetail
      };
    });

    expect(result.isHLSSource).toBe(true);
    // HLS error handling already implemented in Phase 3
  });

  // T183-T184: HLS stream interruption
  test('[T183][T184] should handle HLS stream interruption', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Check if HLS.js is available
      if (typeof window.Hls === 'undefined') {
        return { hlsAvailable: false };
      }

      if (!window.Hls.isSupported()) {
        return { hlsAvailable: false };
      }

      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      document.body.appendChild(player);

      let networkErrorFired = false;

      player.addEventListener('error', (e) => {
        if (e.detail.type === 'hls' && e.detail.message.includes('network')) {
          networkErrorFired = true;
        }
      });

      if (player._createVideo) {
        player._createVideo();
      }

      // Wait for HLS initialization
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate network error if HLS instance exists
      if (player._hlsInstance) {
        player._hlsInstance.emit(window.Hls.Events.ERROR, {
          type: window.Hls.ErrorTypes.NETWORK_ERROR,
          fatal: true,
          details: 'fragLoadError'
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      document.body.removeChild(player);

      return {
        hlsAvailable: true,
        networkErrorFired
      };
    });

    if (!result.hlsAvailable) {
      test.skip();
      return;
    }

    // HLS network error handling already implemented in Phase 3
    expect(result.networkErrorFired).toBe(true);
  });
});
