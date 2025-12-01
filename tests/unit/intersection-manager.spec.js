import { test, expect } from '@playwright/test';

test.describe('VideoIntersectionManager', () => {
  test('T015: should implement singleton pattern', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const isSingleton = await page.evaluate(() => {
      // Import the manager
      const manager1 = new window.VideoIntersectionManager();
      const manager2 = new window.VideoIntersectionManager();

      return manager1 === manager2;
    });

    expect(isSingleton).toBe(true);
  });

  test('T018: should use WeakMap for component registration', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const hasWeakMap = await page.evaluate(() => {
      const manager = new window.VideoIntersectionManager();
      return manager.componentMap instanceof WeakMap;
    });

    expect(hasWeakMap).toBe(true);
  });

  test('T020: should implement OR logic for intersection (>50% visible OR (tall AND >50% viewport))', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const testCases = await page.evaluate(() => {
      const manager = new window.VideoIntersectionManager();

      const results = [];

      // Test case 1: Normal video, >50% visible
      const entry1 = {
        intersectionRatio: 0.6,
        boundingClientRect: { height: 400 },
        rootBounds: { height: 800 },
        target: document.createElement('div')
      };
      const shouldPlay1 = manager._checkShouldPlay(entry1);
      results.push({ case: 'Normal video >50% visible', shouldPlay: shouldPlay1, expected: true });

      // Test case 2: Normal video, <50% visible
      const entry2 = {
        intersectionRatio: 0.4,
        boundingClientRect: { height: 400 },
        rootBounds: { height: 800 },
        target: document.createElement('div')
      };
      const shouldPlay2 = manager._checkShouldPlay(entry2);
      results.push({ case: 'Normal video <50% visible', shouldPlay: shouldPlay2, expected: false });

      // Test case 3: Tall video (>viewport), >50% viewport occupancy
      const entry3 = {
        intersectionRatio: 0.4, // Less than 50% of video visible
        boundingClientRect: { height: 1200 },
        rootBounds: { height: 800 },
        target: document.createElement('div')
      };
      const shouldPlay3 = manager._checkShouldPlay(entry3);
      results.push({ case: 'Tall video >50% viewport', shouldPlay: shouldPlay3, expected: true });

      // Test case 4: Tall video (>viewport), <50% viewport occupancy
      const entry4 = {
        intersectionRatio: 0.3, // Less than 50% of video visible
        boundingClientRect: { height: 1200 },
        rootBounds: { height: 800 },
        target: document.createElement('div')
      };
      const shouldPlay4 = manager._checkShouldPlay(entry4);
      // 1200 / 800 = 1.5 (150% of viewport), but only 30% visible (360px)
      // 360px / 800px = 0.45 (45% of viewport) → should NOT play
      results.push({ case: 'Tall video <50% viewport', shouldPlay: shouldPlay4, expected: false });

      return results;
    });

    for (const testCase of testCases) {
      expect(testCase.shouldPlay, `${testCase.case}`).toBe(testCase.expected);
    }
  });
});
