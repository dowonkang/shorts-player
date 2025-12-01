/**
 * Unit tests for Video Element Lifecycle
 * Phase 2: User Story 1 (MVP) - Video Element Lifecycle
 */

import { test, expect } from '@playwright/test';

test.describe('Video Element Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
  });

  // T070: _createVideo() acquires from VideoPool
  test('[T070] should acquire video element from VideoPool', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0');
      document.body.appendChild(player);

      // Manually trigger video creation (normally triggered by IntersectionObserver)
      const video = player._createVideo?.();

      const hasVideo = video !== null && video !== undefined;
      const isVideoElement = video?.tagName === 'VIDEO';

      document.body.removeChild(player);
      return { hasVideo, isVideoElement };
    });

    expect(result.hasVideo).toBe(true);
    expect(result.isVideoElement).toBe(true);
  });

  // T073: video src assignment
  test('[T073] should assign src to video element', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      const testSrc = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0';
      player.setAttribute('src', testSrc);
      document.body.appendChild(player);

      const video = player._createVideo?.();
      const videoSrc = video?.src || '';

      document.body.removeChild(player);
      return { videoSrc, testSrc };
    });

    expect(result.videoSrc).toContain('data:video/mp4');
  });

  // T075: loadeddata event triggers play()
  test('[T075] should listen for loadeddata event', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const player = document.createElement('shorts-player');
        const testSrc = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0';
        player.setAttribute('src', testSrc);
        document.body.appendChild(player);

        const video = player._createVideo?.();

        if (!video) {
          resolve({ hasListener: false });
          return;
        }

        // Check if loadeddata listener exists by triggering event
        let listenerCalled = false;
        const originalPlay = video.play;
        video.play = function() {
          listenerCalled = true;
          return Promise.resolve();
        };

        // Manually trigger loadeddata
        video.dispatchEvent(new Event('loadeddata'));

        setTimeout(() => {
          document.body.removeChild(player);
          resolve({ hasListener: listenerCalled });
        }, 50);
      });
    });

    expect(result.hasListener).toBe(true);
  });

  // T077: video fades in when playing
  test('[T077] should add loaded class to video when playing', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0');
        document.body.appendChild(player);

        const video = player._createVideo?.();

        if (!video) {
          resolve({ hasClass: false });
          return;
        }

        // Mock play to resolve immediately
        video.play = () => Promise.resolve();

        // Trigger loadeddata which should add 'loaded' class
        video.dispatchEvent(new Event('loadeddata'));

        setTimeout(() => {
          const hasClass = video.classList.contains('loaded');
          document.body.removeChild(player);
          resolve({ hasClass });
        }, 50);
      });
    });

    expect(result.hasClass).toBe(true);
  });

  // T079: poster fades out when video plays
  test('[T079] should remove poster when video starts playing', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0');
        player.setAttribute('poster', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="gray"/></svg>');
        document.body.appendChild(player);

        // Wait for poster to load
        setTimeout(() => {
          const posterBefore = player.querySelector('img');
          const hasPosterBefore = posterBefore !== null;

          const video = player._createVideo?.();
          if (!video) {
            resolve({ hasPosterBefore, hasPosterAfter: false });
            return;
          }

          // Mock play
          video.play = () => Promise.resolve();

          // Trigger loadeddata
          video.dispatchEvent(new Event('loadeddata'));

          // Wait for poster removal
          setTimeout(() => {
            const posterAfter = player.querySelector('img');
            const hasPosterAfter = posterAfter !== null;

            document.body.removeChild(player);
            resolve({ hasPosterBefore, hasPosterAfter });
          }, 250);
        }, 100);
      });
    });

    expect(result.hasPosterBefore).toBe(true);
    expect(result.hasPosterAfter).toBe(false);
  });
});
