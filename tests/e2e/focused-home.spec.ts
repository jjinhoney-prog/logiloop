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
  await expect(page.getByRole('heading', { level: 1 })).toContainText('물류사와 창고를 찾으세요.');
  await expect(page.locator('.home-hero')).toContainText('전국 물류사·창고 매칭');
  await expect(page.getByRole('link', { name: '3PL·창고 파트너 등록' })).toHaveAttribute('href', '/partnership');
  await expect(page.locator('.problem-option')).toHaveCount(2);
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

test('comparison tabs support keyboard navigation and carry the chosen purpose into requests', async ({ page }, testInfo) => {
  await page.goto('/');
  const outsource = page.getByRole('tab', { name: '물류 위탁', exact: true });
  const space = page.getByRole('tab', { name: '창고 임차', exact: true });
  await expect(outsource).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await expect(page.getByRole('tabpanel')).toContainText('물류사·3PL 비교');
  await outsource.focus();
  await outsource.press('ArrowRight');
  await expect(space).toBeFocused();
  await expect(space).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('창고 임차 비교');
  await expect(page.getByRole('link', { name: '물류사 찾기 요청', exact: true })).toBeHidden();
  await space.press('Home');
  await expect(outsource).toBeFocused();
  await outsource.press('ArrowLeft');
  await expect(space).toBeFocused();
  await expect(page.getByRole('link', { name: '창고 찾기 요청', exact: true })).toHaveAttribute('href', '/consultation?situation=space');
  await page.locator('#comparison-preview').screenshot({ path: testInfo.outputPath('comparison-space.png') });
  await page.getByRole('link', { name: '창고 찾기 요청', exact: true }).click();
  await expect(page.getByRole('radio', { name: /창고 공간이 필요해요/ })).toBeChecked();
  await page.goto('/');
  await space.click();
  await outsource.click();
  await expect(outsource).toHaveAttribute('aria-selected', 'true');
  await page.locator('#comparison-preview').screenshot({ path: testInfo.outputPath('comparison-outsource.png') });
  await page.getByRole('link', { name: '물류사 찾기 요청', exact: true }).click();
  await expect(page.getByRole('radio', { name: /물류를 처음 맡기려고 해요/ })).toBeChecked();
});

test('3PL registration stays visible after scrolling and opens the partner form', async ({ page, isMobile }, testInfo) => {
  await page.goto('/');
  await page.locator('.home-faq').scrollIntoViewIfNeeded();
  const registration = page.locator('.topbar').getByRole('link', { name: '3PL 업체 등록' });
  await expect(registration).toBeInViewport();
  if (isMobile) {
    await expect(page.locator('.mobile-consultation').getByRole('link', { name: '3PL 업체 등록' })).toBeInViewport();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('persistent-registration.png') });
  await registration.click();
  await expect(page).toHaveURL(/\/partnership$/);
  await expect(page.getByRole('heading', { name: '3PL 업체 등록', exact: true })).toBeVisible();
  await expect(page.locator('#partner-company')).toBeVisible();
});

test('home motion respects reduced motion and leaves content readable', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#home-title')).toBeVisible();
  expect(await page.locator('.home-motion').evaluate((element) => element.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length)).toBe(0);
  await expect(page.locator('.hero-consultation')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('home-motion.png'), fullPage: true });
});

test('cost comparison holds the verdict until every cost is known', async ({ page }) => {
  await page.goto('/cost-compare');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('같은 기간으로 비교');
  await page.getByLabel('월 보관비').fill('100');
  await page.getByLabel('월 임차료').fill('80');
  await expect(page.locator('.cost-missing')).toContainText('확인 필요');
  await expect(page.locator('.cost-verdict')).toHaveCount(0);
  for (const [label, value] of [['월 입출고·작업비', '50'], ['월 기타 비용', '0'], ['초기 이관비', '100'], ['월 관리비', '10'], ['월 인건비', '30'], ['월 장비·시스템비', '0'], ['초기 입주·설비비', '500'], ['종료 시 원상복구비', '100']]) await page.getByLabel(label).fill(value);
  await expect(page.locator('.cost-verdict')).toContainText('창고 임차의 합계가 220만원 낮습니다');
  await expect(page.locator('.cost-verdict')).toContainText('17개월부터 합계가 낮아집니다');
  await expect(page.locator('.cost-result dl')).toContainText('초기 500만원 · 종료 100만원');
  // 월 비용 차이 30, 일회성 비용 차이 600 → 20개월 동률, 21개월부터 낮아짐
  await page.getByLabel('월 보관비').fill('140');
  await page.getByLabel('월 입출고·작업비').fill('0');
  await page.getByLabel('초기 이관비').fill('0');
  await page.getByLabel('월 인건비').fill('20');
  await expect(page.locator('.cost-verdict')).toContainText('20개월에 합계가 같아지고 21개월부터 낮아집니다');
  await page.getByLabel('월 기타 비용').pressSequentially('12.5');
  await expect(page.getByLabel('월 기타 비용')).toHaveValue('12.5');
  await expect(page.locator('.cost-result dl')).toContainText('월 152.5만원');
  await page.getByRole('link', { name: '실제 후보와 비교 요청하기' }).click();
  await expect(page).toHaveURL(/situation=unsure/);
});

test('contract renewal page reaches the request with its context', async ({ page }) => {
  await page.goto('/contract-renewal');
  await page.getByLabel('계약 만료일과 갱신·해지 통지 기한을 확인했습니다.').check();
  await expect(page.locator('.renewal-progress')).toContainText('1 / 12');
  await page.getByRole('link', { name: '물류사 비교 요청' }).click();
  await expect(page).toHaveURL(/situation=change/);
});
