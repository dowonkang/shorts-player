import { test, expect } from '@playwright/test';

/**
 * T006: Verify global CSS prevents FOUC
 *
 * Ensures that shorts-player elements show grey gradient
 * before the custom element is defined
 */

test.describe('FOUC Prevention', () => {
  test('undefined shorts-player shows grey gradient skeleton', async ({ page }) => {
    // Create test page WITHOUT loading the component JS
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="/src/shorts-player.css">
        </head>
        <body>
          <shorts-player src="test.mp4"></shorts-player>
        </body>
      </html>
    `);

    const player = page.locator('shorts-player');

    // Element should exist
    await expect(player).toBeVisible();

    // Should have display: block
    const display = await player.evaluate(el => getComputedStyle(el).display);
    expect(display).toBe('block');

    // Should have aspect-ratio
    const aspectRatio = await player.evaluate(el => getComputedStyle(el).aspectRatio);
    expect(aspectRatio).toMatch(/9\s*\/\s*16/);

    // Should have gradient background
    const background = await player.evaluate(el => getComputedStyle(el).background);
    expect(background).toContain('linear-gradient');
    expect(background).toContain('#e0e0e0');

    // Should have CSS containment
    const contain = await player.evaluate(el => getComputedStyle(el).contain);
    expect(contain).toContain('layout');
    expect(contain).toContain('paint');
    expect(contain).toContain('size');
  });

  test('skeleton gradient persists after component defined', async ({ page }) => {
    await page.goto('/examples/basic.html');

    const player = page.locator('shorts-player').first();
    await expect(player).toBeVisible();

    // Background gradient should still be present (as fallback)
    const background = await player.evaluate(el => getComputedStyle(el).background);
    expect(background).toContain('linear-gradient');
  });
});
