import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('dropdown supports keyboard selection, escape, reset and outside dismissal', async ({ page }) => {
  await page.goto('/warehouses');
  const region = page.getByRole('combobox', { name: '지역', exact: true });
  await region.focus();
  await region.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await region.press('End');
  await region.press('Escape');
  await expect(region).toContainText('전체 지역');
  await region.press('Enter');
  await region.press('ArrowDown');
  await region.press('Enter');
  await expect(region).not.toContainText('전체 지역');
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(region).toContainText('전체 지역');
  await region.click();
  const results = await new AxeBuilder({ page }).include('.filter-panel').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('heading', { level: 1 }).click();
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(page.locator('select')).toHaveCount(0);
});

test('form dropdown selections survive step changes and are included in submission', async ({ page }) => {
  let posted: Record<string, unknown> | undefined;
  await page.route('**/api/inquiry', (route) => {
    posted = route.request().postDataJSON();
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('/consultation');
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  for (const [label, value] of [['희망 지역 · 전국 시·도', '부산'], ['필요 온도대', '냉장']]) {
    await page.getByRole('combobox', { name: label, exact: true }).click();
    await page.getByRole('option', { name: value, exact: true }).click();
  }
  await expect(page.locator('textarea')).toHaveCSS('resize', 'none');
  await expect(page.locator('select')).toHaveCount(0);
  await page.locator('#company').fill('테스트 회사');
  await page.locator('#name').fill('테스트');
  await page.locator('#phone').fill('01012345678');
  await page.locator('#item').fill('생활용품');
  await page.locator('#consent').check();
  await page.getByRole('button', { name: '준비서 확인' }).click();
  await page.getByRole('button', { name: '수정', exact: true }).click();
  await expect(page.getByRole('combobox', { name: '희망 지역 · 전국 시·도' })).toContainText('부산');
  await page.getByRole('button', { name: '준비서 확인' }).click();
  await page.getByRole('button', { name: '상담 신청하기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(posted).toMatchObject({ region: '부산', temperature: '냉장' });
});

test('detail tooltip is available by hover or tap and dismisses with Escape', async ({ page, isMobile }) => {
  await page.goto('/warehouses/busan-01');
  const trigger = page.getByRole('button', { name: '창고 위치·접근성 안내' });
  if (isMobile) await trigger.tap();
  else await trigger.hover();
  await expect(page.getByRole('tooltip')).toContainText('카카오모빌리티');
  const box = await page.getByRole('tooltip').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await expect(page.locator('.location-note')).toBeVisible();
});

test('hero and mobile consultation links work without covering comparison controls', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.locator('.hero-consultation')).toHaveAttribute('href', '/consultation');
  if (!isMobile) {
    await expect(page.locator('.mobile-consultation')).toBeHidden();
    return;
  }
  await page.goto('/warehouses');
  await page.locator('.compare-toggle').first().click();
  await page.locator('.comparison-dock').scrollIntoViewIfNeeded();
  const dock = await page.locator('.comparison-dock').boundingBox();
  const bar = await page.locator('.mobile-consultation').boundingBox();
  expect(dock!.y + dock!.height).toBeLessThanOrEqual(bar!.y);
  await page.locator('.mobile-consultation a').click();
  await expect(page).toHaveURL(/\/consultation$/);
  await expect(page.locator('.mobile-consultation')).toHaveCount(0);
  await page.goto('/admin/login');
  await expect(page.locator('.mobile-consultation')).toHaveCount(0);
});
