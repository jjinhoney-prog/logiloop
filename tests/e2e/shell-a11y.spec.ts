import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/', '/warehouses', '/warehouses/busan-01', '/partners', '/partners/partner-01', '/compare', '/consultation', '/partnership', '/insights', '/insights/lease-or-3pl', '/about', '/privacy', '/admin'];

test.describe('shell', () => {
  test('active navigation and breadcrumb', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop navigation');
    await page.goto('/partners/partner-02');
    await expect(page.getByRole('link', { name: '물류사·3PL' })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.breadcrumb strong')).toHaveText('물류사·3PL');
    await page.goto('/consultation');
    await expect(page.locator('.breadcrumb strong')).toHaveText('상담 신청');
    await page.goto('/privacy');
    await expect(page.locator('.breadcrumb strong')).toHaveText('이용 안내');
  });

  test('skip link moves focus to main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard navigation');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '본문으로 이동' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('mobile menu opens, closes via backdrop and closes on navigation', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    const toggle = page.getByRole('button', { name: '메뉴 열기' });
    await toggle.click();
    await expect(page.locator('.sidebar')).toHaveClass(/open/);
    await page.locator('.nav-backdrop').click({ position: { x: 350, y: 400 } });
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);

    await page.getByRole('button', { name: '메뉴 열기' }).click();
    await page.getByRole('link', { name: '물류 가이드' }).click();
    await expect(page).toHaveURL(/\/insights$/);
    await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  });
});

test.describe('accessibility (axe)', () => {
  for (const route of routes) {
    test(`no serious violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(['color-contrast']).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
});
