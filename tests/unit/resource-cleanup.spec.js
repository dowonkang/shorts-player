/**
 * Unit tests for Resource Cleanup
 * Phase 2: User Story 1 (MVP) - Resource Cleanup
 */

import { test, expect } from '@playwright/test';

test.describe('Resource Cleanup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
  });

  // T092: _cleanupVideo() pauses, clears src, calls load()
  test('[T092] should pause video and clear src in cleanup', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0');
        document.body.appendChild(player);

        // Create video
        const video = player._createVideo?.();
        if (!video) {
          resolve({ hasVideo: false });
          return;
        }

        // Mock play to track state
        video.play = () => Promise.resolve();
        video.pause = function() { this._paused = true; };
        video.load = function() { this._loaded = true; };

        // Manually set playing state
        player._isPlaying = true;

        // Trigger cleanup
        player._cleanupVideo?.();

        setTimeout(() => {
          const wasPaused = video._paused === true;
          const wasLoaded = video._loaded === true;
          // Check if src was cleared (may be empty string, about:blank, or current page URL)
          const originalSrc = 'data:video/mp4';
          const srcCleared = !video.src.includes(originalSrc);

          document.body.removeChild(player);
          resolve({ wasPaused, wasLoaded, srcCleared });
        }, 50);
      });
    });

    expect(result.wasPaused).toBe(true);
    expect(result.wasLoaded).toBe(true);
    expect(result.srcCleared).toBe(true);
  });

  // T095: VideoPool.release() called in cleanup
  test('[T095] should release video back to VideoPool', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0');
        document.body.appendChild(player);

        // Create video
        const video = player._createVideo?.();
        if (!video) {
          resolve({ videoCleared: false });
          return;
        }

        // Mark the video element for tracking
        video._testMarker = true;

        // Trigger cleanup
        player._cleanupVideo?.();

        setTimeout(() => {
          // Check if video src was cleared (indicates release was called)
          const videoCleared = video.src === '' || !video.src.includes('data:video/mp4');
          // Check if video is no longer in the player
          const videoRemoved = player._videoElement === null;

          document.body.removeChild(player);
          resolve({ videoCleared, videoRemoved });
        }, 50);
      });
    });

    expect(result.videoCleared).toBe(true);
    expect(result.videoRemoved).toBe(true);
  });

  // T097: video element nullification after cleanup
  test('[T097] should nullify _videoElement after cleanup', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0');
        document.body.appendChild(player);

        // Create video
        const video = player._createVideo?.();
        const hasVideoBefore = player._videoElement !== null;

        // Trigger cleanup
        player._cleanupVideo?.();

        setTimeout(() => {
          const hasVideoAfter = player._videoElement !== null;

          document.body.removeChild(player);
          resolve({ hasVideoBefore, hasVideoAfter });
        }, 50);
      });
    });

    expect(result.hasVideoBefore).toBe(true);
    expect(result.hasVideoAfter).toBe(false);
  });
});
