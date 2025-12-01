/**
 * Unit tests for ShortsPlayer web component
 * Phase 2: User Story 1 (MVP) - Component Skeleton & Lifecycle
 */

import { test, expect } from '@playwright/test';

test.describe('ShortsPlayer Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/basic.html');
  });

  // T033: Component registration test
  test('[T033] should be registered as custom element', async ({ page }) => {
    const isDefined = await page.evaluate(() => {
      return customElements.get('shorts-player') !== undefined;
    });
    expect(isDefined).toBe(true);
  });

  // T037: observedAttributes test
  test('[T037] should have correct observedAttributes', async ({ page }) => {
    const observedAttributes = await page.evaluate(() => {
      const ShortsPlayer = customElements.get('shorts-player');
      return ShortsPlayer.observedAttributes;
    });
    expect(observedAttributes).toEqual(['src', 'aspect-ratio', 'poster']);
  });

  // T039: constructor initializes state correctly
  test('[T039] should initialize state in constructor', async ({ page }) => {
    const initialState = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      return {
        _initialized: player._initialized,
        _isPlaying: player._isPlaying,
        _isVisible: player._isVisible,
        _videoElement: player._videoElement,
        _hlsInstance: player._hlsInstance,
        _posterElement: player._posterElement,
        _cleanupTimer: player._cleanupTimer,
        _abortController: player._abortController
      };
    });

    expect(initialState._initialized).toBe(false);
    expect(initialState._isPlaying).toBe(false);
    expect(initialState._isVisible).toBe(false);
    expect(initialState._videoElement).toBe(null);
    expect(initialState._hlsInstance).toBe(null);
    expect(initialState._posterElement).toBe(null);
    expect(initialState._cleanupTimer).toBe(null);
    expect(initialState._abortController).toBe(null);
  });

  // T043: connectedCallback clones SHARED_TEMPLATE
  test('[T043] should clone SHARED_TEMPLATE in connectedCallback', async ({ page }) => {
    const hasTemplate = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);
      const container = player.querySelector('.shorts-player');
      document.body.removeChild(player);
      return container !== null;
    });
    expect(hasTemplate).toBe(true);
  });

  // T046: CSS containment applied
  test('[T046] should apply CSS containment', async ({ page }) => {
    const containment = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);
      const contain = player.style.contain;
      document.body.removeChild(player);
      return contain;
    });
    // Browser may reorder the values, so check for presence of all three
    expect(containment).toContain('layout');
    expect(containment).toContain('paint');
    expect(containment).toContain('size');
  });

  // T048: aspect-ratio attribute handling
  test('[T048] should handle aspect-ratio attribute with default 9/16', async ({ page }) => {
    const aspectRatio = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);
      const ratio = player.style.aspectRatio;
      document.body.removeChild(player);
      return ratio;
    });
    expect(aspectRatio).toBe('9 / 16');
  });

  test('[T048] should handle custom aspect-ratio attribute', async ({ page }) => {
    const aspectRatio = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      player.setAttribute('aspect-ratio', '16/9');
      document.body.appendChild(player);
      const ratio = player.style.aspectRatio;
      document.body.removeChild(player);
      return ratio;
    });
    expect(aspectRatio).toBe('16 / 9');
  });

  // T050: AbortController setup
  test('[T050] should create AbortController in connectedCallback', async ({ page }) => {
    const hasAbortController = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);
      const hasController = player._abortController !== null &&
                           typeof player._abortController.abort === 'function';
      document.body.removeChild(player);
      return hasController;
    });
    expect(hasAbortController).toBe(true);
  });

  // T052: IntersectionObserver registration
  test('[T052] should register with VideoIntersectionManager', async ({ page }) => {
    const isRegistered = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);

      // Check if VideoIntersectionManager has the component registered
      const manager = window.VideoIntersectionManager?.instance;
      const isObserving = manager && manager.componentMap.has(player);

      document.body.removeChild(player);
      return isObserving;
    });
    expect(isRegistered).toBe(true);
  });

  // T054: disconnectedCallback aborts event listeners
  test('[T054] should abort event listeners in disconnectedCallback', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);

      const controller = player._abortController;
      const initialAborted = controller?.signal.aborted;

      // Remove from DOM
      document.body.removeChild(player);

      // Wait for microtask to complete
      return new Promise(resolve => {
        setTimeout(() => {
          const finalAborted = controller?.signal.aborted;
          resolve({ initialAborted, finalAborted });
        }, 10);
      });
    });

    expect(result.initialAborted).toBe(false);
    expect(result.finalAborted).toBe(true);
  });

  // T057: cleanup on true removal (not DOM move)
  test('[T057] should cleanup on true removal but not on DOM move', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);
      const controller = player._abortController;

      // Move to different parent (not removal)
      const newParent = document.createElement('div');
      document.body.appendChild(newParent);
      newParent.appendChild(player); // This triggers disconnectedCallback

      return new Promise(resolve => {
        setTimeout(() => {
          const movedAborted = controller.signal.aborted;

          // Now truly remove
          player.remove();

          setTimeout(() => {
            const removedAborted = controller.signal.aborted;
            newParent.remove();
            resolve({ movedAborted, removedAborted });
          }, 10);
        }, 10);
      });
    });

    // Should not abort on move
    expect(result.movedAborted).toBe(false);
    // Should abort on true removal
    expect(result.removedAborted).toBe(true);
  });

  // T059: VideoIntersectionManager.unobserve() call
  test('[T059] should unobserve from VideoIntersectionManager on disconnect', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);

      const manager = window.VideoIntersectionManager?.instance;
      const initiallyObserving = manager && manager.componentMap.has(player);

      // Remove from DOM
      document.body.removeChild(player);

      // Wait for microtask cleanup
      return new Promise(resolve => {
        setTimeout(() => {
          const finallyObserving = manager && manager.componentMap.has(player);
          resolve({ initiallyObserving, finallyObserving });
        }, 10);
      });
    });

    expect(result.initiallyObserving).toBe(true);
    expect(result.finallyObserving).toBe(false);
  });

  // T099: play() method
  test('[T099] should have play() method that returns Promise', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      player.setAttribute('src', 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAABhtZGF0');
      document.body.appendChild(player);

      const hasMethod = typeof player.play === 'function';
      const result = player.play();
      const returnsPromise = result instanceof Promise;

      document.body.removeChild(player);
      return { hasMethod, returnsPromise };
    });

    expect(result.hasMethod).toBe(true);
    expect(result.returnsPromise).toBe(true);
  });

  // T102: pause() method
  test('[T102] should have pause() method', async ({ page }) => {
    const hasMethod = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);
      const has = typeof player.pause === 'function';
      document.body.removeChild(player);
      return has;
    });

    expect(hasMethod).toBe(true);
  });

  // T104: reload() method
  test('[T104] should have reload() method', async ({ page }) => {
    const hasMethod = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);
      const has = typeof player.reload === 'function';
      document.body.removeChild(player);
      return has;
    });

    expect(hasMethod).toBe(true);
  });

  // T106: playing getter
  test('[T106] should have playing getter returning boolean', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);
      const playing = player.playing;
      const isBoolean = typeof playing === 'boolean';
      document.body.removeChild(player);
      return { playing, isBoolean };
    });

    expect(result.isBoolean).toBe(true);
    expect(result.playing).toBe(false);
  });

  // T108: loaded getter
  test('[T108] should have loaded getter', async ({ page }) => {
    const result = await page.evaluate(() => {
      const player = document.createElement('shorts-player');
      document.body.appendChild(player);
      const loaded = player.loaded;
      const isBoolean = typeof loaded === 'boolean';
      document.body.removeChild(player);
      return { loaded, isBoolean };
    });

    expect(result.isBoolean).toBe(true);
  });
});
