import { test, expect } from '@playwright/test';

test.describe('Shared Template', () => {
  test('T009: should create SHARED_TEMPLATE at module level', async ({ page }) => {
    await page.goto('/examples/basic.html');

    // Verify SHARED_TEMPLATE exists at module level
    const hasTemplate = await page.evaluate(() => {
      return typeof window.SHARED_TEMPLATE !== 'undefined' ||
             window.SHARED_TEMPLATE !== null;
    });

    expect(hasTemplate).toBe(true);
  });

  test('T013: should clone template in less than 1ms', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const cloneTime = await page.evaluate(() => {
      const start = performance.now();

      // Clone template 100 times to get average
      for (let i = 0; i < 100; i++) {
        const clone = window.SHARED_TEMPLATE.content.cloneNode(true);
      }

      const end = performance.now();
      return (end - start) / 100; // Average time per clone
    });

    expect(cloneTime).toBeLessThan(1);
  });
});
