/**
 * Unit tests for Custom Events
 * Phase 2: User Story 1 (MVP) - Custom Events
 */

import { test, expect } from '@playwright/test';

test.describe('Custom Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
  });

  // T110: 'play' event dispatch
  test('[T110] should dispatch play event when video plays', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0');
        document.body.appendChild(player);

        let playEventFired = false;

        player.addEventListener('play', () => {
          playEventFired = true;
        });

        // Create video and trigger play
        const video = player._createVideo?.();
        if (video) {
          video.play = () => {
            video.dispatchEvent(new Event('play'));
            return Promise.resolve();
          };
          video.play();
        }

        setTimeout(() => {
          document.body.removeChild(player);
          resolve({ playEventFired });
        }, 100);
      });
    });

    expect(result.playEventFired).toBe(true);
  });

  // T112: 'pause' event dispatch
  test('[T112] should dispatch pause event when video pauses', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0');
        document.body.appendChild(player);

        let pauseEventFired = false;

        player.addEventListener('pause', () => {
          pauseEventFired = true;
        });

        // Create video and trigger pause
        const video = player._createVideo?.();
        if (video) {
          video.pause = function() {
            this.dispatchEvent(new Event('pause'));
          };
          video.pause();
        }

        setTimeout(() => {
          document.body.removeChild(player);
          resolve({ pauseEventFired });
        }, 100);
      });
    });

    expect(result.pauseEventFired).toBe(true);
  });

  // T114: 'loadeddata' event dispatch
  test('[T114] should dispatch loadeddata event', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0');
        document.body.appendChild(player);

        let loadeddataEventFired = false;

        player.addEventListener('loadeddata', () => {
          loadeddataEventFired = true;
        });

        // Create video and trigger loadeddata
        const video = player._createVideo?.();
        if (video) {
          video.play = () => Promise.resolve();
          video.dispatchEvent(new Event('loadeddata'));
        }

        setTimeout(() => {
          document.body.removeChild(player);
          resolve({ loadeddataEventFired });
        }, 100);
      });
    });

    expect(result.loadeddataEventFired).toBe(true);
  });

  // T116: 'error' event dispatch
  test('[T116] should dispatch error event with detail', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise(resolve => {
        const player = document.createElement('shorts-player');
        player.setAttribute('src', 'data:video/mp4;base64,INVALID');
        player.setAttribute('poster', 'https://invalid-url.com/poster.jpg');
        document.body.appendChild(player);

        let errorEventFired = false;
        let errorDetail = null;

        player.addEventListener('error', (e) => {
          errorEventFired = true;
          errorDetail = e.detail;
        });

        setTimeout(() => {
          document.body.removeChild(player);
          resolve({ errorEventFired, errorDetail });
        }, 300);
      });
    });

    expect(result.errorEventFired).toBe(true);
    expect(result.errorDetail).toBeTruthy();
    expect(result.errorDetail.type).toBeDefined();
    expect(result.errorDetail.message).toBeDefined();
  });
});
