import { expect, test } from '@playwright/test';

test('home situation carries into the request; unknown conditions can be submitted', async ({ page }) => {
  let posted: Record<string, unknown> | undefined;
  await page.route('**/api/inquiry', (route) => {
    posted = route.request().postDataJSON();
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('/');
  await expect(page.locator('.problem-option')).toHaveCount(2);
  await expect(page.locator('.service-preview')).toContainText('가상 예시 · 실제 업체·견적 아님');
  await page.getByRole('link', { name: /물류를 맡길 곳이 필요해요/ }).click();
  await expect(page.getByRole('radio', { name: /물류를 처음 맡기려고 해요/ })).toBeChecked();
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  await page.locator('#company').fill('테스트 화주');
  await page.locator('#name').fill('테스트');
  await page.locator('#phone').fill('01012345678');
  await page.locator('#consent').check();
  await page.getByRole('button', { name: '요청 내용 확인' }).click();
  await expect(page.locator('.prepared-panel')).toContainText('아직 접수되지 않았습니다.');
  await expect(page.locator('.prepared-panel pre')).toContainText('품목: 미정');
  expect(posted).toBeUndefined();
  await page.getByRole('button', { name: '물류 요청하기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(posted).toMatchObject({ help: '물류를 처음 맡기려고 해요', item: '미정', temperature: '아직 모름' });
});

test('catalog filters and partner services survive the request handoff', async ({ page }) => {
  await page.goto('/partners');
  await page.getByRole('combobox', { name: '제공 작업', exact: true }).click();
  await page.getByRole('option', { name: '피킹', exact: true }).click();
  await expect(page.locator('.catalog-card')).toHaveCount(1);
  await page.getByRole('combobox', { name: '온도', exact: true }).click();
  await page.getByRole('option', { name: '냉장', exact: true }).click();
  await page.getByRole('link', { name: '이 조건으로 물류 요청하기' }).click();
  await expect(page.getByRole('radio', { name: /물류를 처음 맡기려고 해요/ })).toBeChecked();
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  await expect(page.getByRole('combobox', { name: '필요 온도대', exact: true })).toContainText('냉장');
  await expect(page.locator('textarea')).toHaveValue('필요 작업: 피킹');
});

test('partnership captures its own fields and disclosure preference', async ({ page }) => {
  let posted: Record<string, unknown> | undefined;
  await page.route('**/api/inquiry', (route) => {
    posted = route.request().postDataJSON();
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('/partnership');
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  await expect(page.getByRole('combobox', { name: '시설 소재지·서비스 지역' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: '수용 가능 시점' })).toBeVisible();
  await page.getByRole('combobox', { name: '정보 공개 희망 범위' }).click();
  await page.getByRole('option', { name: '개별 화주 요청에 한해 정보 제공 검토' }).click();
  await page.locator('#company').fill('파트너 테스트');
  await page.locator('#name').fill('담당자');
  await page.locator('#phone').fill('0511234567');
  await page.locator('#consent').check();
  await page.getByRole('button', { name: '요청 내용 확인' }).click();
  await expect(page.locator('.prepared-panel pre')).toContainText('정보 공개 희망: 개별 화주 요청에 한해 정보 제공 검토');
  await page.getByRole('button', { name: '파트너 신청하기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(posted?.note).toBe('정보 공개 희망: 개별 화주 요청에 한해 정보 제공 검토');
});

test('mixed comparison explains operating scope and keeps selected candidates', async ({ page, isMobile }) => {
  await page.addInitScript(() => localStorage.setItem('logiloop:compare', JSON.stringify(['busan-01', 'partner-01'])));
  await page.goto('/compare');
  await expect(page.getByText('공간 임차와 물류업무 위탁을 함께 비교하고 있습니다.')).toBeVisible();
  await expect(page.getByRole('rowheader', { name: '직접 준비할 업무' })).toBeVisible();
  if (isMobile) {
    const bounds = await page.locator('.compare-request-bar').boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
    await expect(page.locator('.mobile-consultation')).toHaveCount(0);
  }
  await page.locator('.compare-request-bar').getByRole('link', { name: '운영방식 비교 요청하기' }).click();
  await expect(page.locator('.request-targets span')).toHaveCount(2);
  await expect(page.getByRole('radio', { name: /어떤 방식이 맞을지 모르겠어요/ })).toBeChecked();
});

test('landing pages fit the viewport and service navigation is accessible', async ({ page, isMobile }, testInfo) => {
  for (const path of ['/', '/warehouses', '/partners', '/compare', '/consultation', '/partnership', '/about']) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    if (path === '/' || path === '/consultation') await page.screenshot({ path: testInfo.outputPath(`${path === '/' ? 'home' : 'request'}.png`), fullPage: true });
  }
  if (isMobile) await page.getByRole('button', { name: '메뉴 열기' }).click();
  await expect(page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '서비스 안내' })).toHaveAttribute('aria-current', 'page');
});
