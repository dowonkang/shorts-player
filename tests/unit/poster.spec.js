/**
 * Unit tests for Poster Image Support
 * Phase 2: User Story 1 (MVP) - Poster Image Support
 */

import { test, expect } from '@playwright/test';

test.describe('Poster Image Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
  });

  // T061: poster attribute creates <img> element
  test('[T061] should create img element when poster attribute is present', async ({ page }) => {
    const hasPoster = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'video.mp4');
      player.setAttribute('poster', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="gray"/></svg>');
      document.body.appendChild(player);

      // Poster should be created immediately
      const poster = player.querySelector('img');
      const hasPosterElement = poster !== null;
      document.body.removeChild(player);
      return hasPosterElement;
    });

    expect(hasPoster).toBe(true);
  });

  // T064: poster load event - fades in
  test('[T064] should fade in poster on load event', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'video.mp4');
      player.setAttribute('poster', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="gray"/></svg>');
      document.body.appendChild(player);

      return new Promise(resolve => {
        setTimeout(() => {
          const poster = player.querySelector('img');
          if (!poster) {
            resolve({ hasLoaded: false, opacity: null });
            return;
          }

          // Check if loaded class is added or opacity is 1
          const hasLoadedClass = poster.classList.contains('loaded');
          const opacity = window.getComputedStyle(poster).opacity;

          document.body.removeChild(player);
          resolve({ hasLoadedClass, opacity });
        }, 100);
      });
    });

    expect(result.hasLoadedClass || result.opacity === '1').toBe(true);
  });

  // T066: poster error event - falls back to host background
  test('[T066] should handle poster error and fall back to skeleton', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'video.mp4');
      player.setAttribute('poster', 'https://invalid-url-that-does-not-exist.com/poster.jpg');
      document.body.appendChild(player);

      return new Promise(resolve => {
        setTimeout(() => {
          const poster = player.querySelector('img');
          const hasPoster = poster !== null;
          document.body.removeChild(player);
          resolve({ hasPoster });
        }, 200);
      });
    });

    // Poster should be removed on error
    expect(result.hasPoster).toBe(false);
  });

  // T068: poster z-index layering
  test('[T068] should layer poster over host background', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'video.mp4');
      player.setAttribute('poster', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="gray"/></svg>');
      document.body.appendChild(player);

      return new Promise(resolve => {
        setTimeout(() => {
          const poster = player.querySelector('img');
          if (!poster) {
            resolve({ hasPosition: false, hasZIndex: false });
            return;
          }

          const styles = window.getComputedStyle(poster);
          const position = styles.position;
          const zIndex = parseInt(styles.zIndex, 10) || 0;

          document.body.removeChild(player);
          resolve({ position, zIndex });
        }, 100);
      });
    });

    expect(result.position).toBe('absolute');
    expect(result.zIndex).toBeGreaterThanOrEqual(1);
  });
});
