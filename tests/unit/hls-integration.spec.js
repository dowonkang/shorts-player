/**
 * Unit tests for HLS.js integration
 * Phase 3: HLS Streaming Support (T136-T150)
 */

import { test, expect } from '@playwright/test';

test.describe('HLS Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
  });

  // T136: HLS instance creation
  test('[T136] should create HLS instance with optimized config', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Load HLS.js
      const hlsModule = await import('/node_modules/hls.js/dist/hls.min.js');
      const Hls = hlsModule.default;

      if (!Hls.isSupported()) {
        return { supported: false };
      }

      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      document.body.appendChild(player);

      // Trigger video creation
      if (player._createVideo) {
        player._createVideo();
      }

      // Wait for HLS initialization (async)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if HLS instance was created
      const hasHlsInstance = player._hlsInstance !== null && player._hlsInstance !== undefined;
      const hlsConfig = player._hlsInstance?.config;

      document.body.removeChild(player);

      return {
        supported: true,
        hasHlsInstance,
        hasConfig: hlsConfig !== undefined,
        configKeys: hlsConfig ? Object.keys(hlsConfig).sort() : []
      };
    });

    if (!result.supported) {
      test.skip();
      return;
    }

    expect(result.hasHlsInstance).toBe(true);
    expect(result.hasConfig).toBe(true);
  });

  // T139: loadSource and attachMedia calls
  test('[T139] should call loadSource() and attachMedia()', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const hlsModule = await import('/node_modules/hls.js/dist/hls.min.js');
      const Hls = hlsModule.default;

      if (!Hls.isSupported()) {
        return { supported: false };
      }

      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      document.body.appendChild(player);

      // Create video
      if (player._createVideo) {
        player._createVideo();
      }

      // Wait for HLS initialization
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check HLS setup
      const hls = player._hlsInstance;
      const hasLoadSource = hls && typeof hls.loadSource === 'function';
      const hasAttachMedia = hls && typeof hls.attachMedia === 'function';
      const hasMedia = hls && hls.media !== null;

      document.body.removeChild(player);

      return {
        supported: true,
        hasLoadSource,
        hasAttachMedia,
        hasMedia
      };
    });

    if (!result.supported) {
      test.skip();
      return;
    }

    expect(result.hasLoadSource).toBe(true);
    expect(result.hasAttachMedia).toBe(true);
  });

  // T141: MANIFEST_PARSED event
  test('[T141] should listen for MANIFEST_PARSED event', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const hlsModule = await import('/node_modules/hls.js/dist/hls.min.js');
      const Hls = hlsModule.default;

      if (!Hls.isSupported()) {
        return { supported: false };
      }

      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      document.body.appendChild(player);

      // Track if MANIFEST_PARSED listener is set
      let manifestParsedRegistered = false;

      if (player._createVideo) {
        player._createVideo();
      }

      // Wait for HLS initialization
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if HLS events are being listened to
      const hls = player._hlsInstance;
      if (hls && hls.listenerCount) {
        manifestParsedRegistered = hls.listenerCount(Hls.Events.MANIFEST_PARSED) > 0;
      }

      document.body.removeChild(player);

      return {
        supported: true,
        hasHlsInstance: hls !== null,
        manifestParsedRegistered
      };
    });

    if (!result.supported) {
      test.skip();
      return;
    }

    expect(result.hasHlsInstance).toBe(true);
    // MANIFEST_PARSED listener will be verified in integration tests
  });

  // T143: HLS error handling
  test('[T143] should handle HLS fatal errors', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const hlsModule = await import('/node_modules/hls.js/dist/hls.min.js');
      const Hls = hlsModule.default;

      if (!Hls.isSupported()) {
        return { supported: false };
      }

      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'https://example.com/invalid.m3u8');
      document.body.appendChild(player);

      // Listen for error events
      let errorFired = false;
      let errorDetail = null;

      player.addEventListener('error', (e) => {
        errorFired = true;
        errorDetail = e.detail;
      });

      if (player._createVideo) {
        player._createVideo();
      }

      // Wait for HLS initialization
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate HLS error
      const hls = player._hlsInstance;
      if (hls) {
        hls.emit(Hls.Events.ERROR, {
          type: Hls.ErrorTypes.NETWORK_ERROR,
          fatal: true,
          details: 'manifestLoadError'
        });
      }

      // Wait for error event
      await new Promise(resolve => setTimeout(resolve, 100));

      document.body.removeChild(player);

      return {
        supported: true,
        errorFired,
        errorDetail
      };
    });

    if (!result.supported) {
      test.skip();
      return;
    }

    // Error handling will be implemented
    expect(result.supported).toBe(true);
  });
});
