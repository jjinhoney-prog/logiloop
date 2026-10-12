import { expect, test } from '@playwright/test';

test('short home records one visit, request click, and carries attribution into minimal submission', async ({ page }) => {
  const events: Record<string, unknown>[] = [];
  let posted: Record<string, unknown> | undefined;
  await page.route('**/api/funnel', (route) => {
    events.push(route.request().postDataJSON());
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/inquiry', (route) => {
    posted = route.request().postDataJSON();
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('지금 내는 창고·물류비,');
  await expect(page.locator('.home-page > section')).toHaveCount(4);
  await expect(page.locator('.catalog-card')).toHaveCount(0);
  await expect.poll(() => events.filter((event) => event.event === 'home_visit').length).toBe(1);
  await page.reload();
  await page.locator('.hero-consultation').click();
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  await expect(page.locator('.inquiry-details')).not.toHaveAttribute('open');
  await expect(page.getByRole('combobox', { name: '필요 온도대' })).toBeHidden();
  await page.locator('#company').fill('조건 비교');
  await page.locator('#name').fill('테스트');
  await page.locator('#phone').fill('01012345678');
  await page.locator('#consent').check();
  await page.getByRole('button', { name: '요청 내용 확인' }).click();
  await page.getByRole('button', { name: '물류 요청하기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(events.filter((event) => event.event === 'home_visit')).toHaveLength(1);
  expect(events).toEqual(expect.arrayContaining([expect.objectContaining({ event: 'request_click', placement: 'hero' }), expect.objectContaining({ event: 'request_started' })]));
  expect(posted?.funnel).toEqual({ visitId: events[0].visitId });
  expect(events.some((event) => event.event === 'request_submitted')).toBe(false); // completion is server-only
});

test('collapsed lease details retain their values after review and editing', async ({ page }) => {
  await page.goto('/consultation?situation=rent-review');
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  await expect(page.getByLabel('현재 월 임차료 (만원/월)', { exact: true })).toBeVisible();
  await expect(page.getByLabel('현재 보증금 (만원)', { exact: true })).toBeHidden();
  await page.locator('.inquiry-details > summary').click();
  await page.getByLabel('현재 보증금 (만원)', { exact: true }).fill('10000');
  await page.locator('.inquiry-details > summary').click();
  await page.locator('#company').fill('테스트');
  await page.locator('#name').fill('담당자');
  await page.locator('#phone').fill('01012345678');
  await page.locator('#consent').check();
  await page.getByRole('button', { name: '요청 내용 확인' }).click();
  await expect(page.locator('.prepared-panel pre')).toContainText('현재 보증금 (만원): 10000');
  await page.getByRole('button', { name: '수정', exact: true }).click();
  await expect(page.locator('.inquiry-details')).not.toHaveAttribute('open');
  await page.locator('.inquiry-details > summary').click();
  await expect(page.getByLabel('현재 보증금 (만원)', { exact: true })).toHaveValue('10000');
});

test('privacy signals disable funnel collection without disabling requests', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true }));
  const events: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/api/funnel')) events.push(request.url()); });
  await page.goto('/');
  await page.locator('.hero-consultation').click();
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  expect(events).toEqual([]);
  await expect(page.locator('#phone')).toBeVisible();
});
