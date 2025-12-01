/**
 * Unit tests for Safari native HLS playback
 * Phase 3: HLS Streaming Support (T151-T154)
 */

import { test, expect } from '@playwright/test';

test.describe('Safari Native HLS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
  });

  // T151: Safari native HLS playback (no hls.js)
  test('[T151] should use native HLS on Safari', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      document.body.appendChild(player);

      const canPlayNative = player._canPlayNativeHLS?.();
      const isHLSSource = player._isHLSSource?.('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');

      // Create video
      if (player._createVideo) {
        player._createVideo();
      }

      // On Safari with native support, _hlsInstance should be null
      const hlsInstanceNull = player._hlsInstance === null || player._hlsInstance === undefined;
      const videoHasSrc = player._videoElement?.src !== '';

      document.body.removeChild(player);

      return {
        canPlayNative,
        isHLSSource,
        hlsInstanceNull,
        videoHasSrc
      };
    });

    expect(result.isHLSSource).toBe(true);

    // If browser supports native HLS, verify it's used
    if (result.canPlayNative) {
      expect(result.hlsInstanceNull).toBe(true); // No HLS.js instance
      expect(result.videoHasSrc).toBe(true); // Direct src assignment
    }
  });

  // T153: Direct video.src assignment for Safari
  test('[T153] should assign .m3u8 src directly on Safari', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      const testSrc = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
      player.setAttribute('src', testSrc);
      document.body.appendChild(player);

      const canPlayNative = player._canPlayNativeHLS?.();

      // Create video
      if (player._createVideo) {
        player._createVideo();
      }

      const video = player._videoElement;
      const videoSrc = video?.src || '';
      const srcContainsM3u8 = videoSrc.includes('.m3u8');

      document.body.removeChild(player);

      return {
        canPlayNative,
        videoSrc,
        srcContainsM3u8
      };
    });

    // If Safari native HLS is supported, verify direct src assignment
    if (result.canPlayNative) {
      expect(result.srcContainsM3u8).toBe(true);
    }
  });

  // T152: Skip HLS.js initialization on Safari
  test('[T152] should skip HLS.js on Safari with native support', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      document.body.appendChild(player);

      const canPlayNative = player._canPlayNativeHLS?.();

      // Create video
      if (player._createVideo) {
        player._createVideo();
      }

      // Wait a bit to ensure HLS.js wouldn't initialize
      await new Promise(resolve => setTimeout(resolve, 100));

      const hlsInstance = player._hlsInstance;

      document.body.removeChild(player);

      return {
        canPlayNative,
        hasHlsInstance: hlsInstance !== null && hlsInstance !== undefined
      };
    });

    // If native HLS is supported, HLS.js should not be used
    if (result.canPlayNative) {
      expect(result.hasHlsInstance).toBe(false);
    } else {
      // On browsers without native support, this test doesn't apply
      test.skip();
    }
  });

  // T154: Verify Safari handles .m3u8 correctly
  test('[T154] should handle HLS source detection correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);

      const tests = {
        hlsSource: player._isHLSSource?.('https://example.com/stream.m3u8'),
        hlsWithToken: player._isHLSSource?.('https://example.com/stream.m3u8?token=xyz'),
        mp4Source: player._isHLSSource?.('https://example.com/video.mp4'),
        canPlayNative: player._canPlayNativeHLS?.()
      };

      document.body.removeChild(player);
      return tests;
    });

    expect(result.hlsSource).toBe(true);
    expect(result.hlsWithToken).toBe(true);
    expect(result.mp4Source).toBe(false);
    expect(typeof result.canPlayNative).toBe('boolean');
  });
});
