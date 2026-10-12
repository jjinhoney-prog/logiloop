import { expect, test } from '@playwright/test';

test('rent review starts from home and passes current lease conditions for review', async ({ page }, testInfo) => {
  let posted: Record<string, unknown> | undefined;
  await page.route('**/api/inquiry', (route) => {
    posted = route.request().postDataJSON();
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('/');
  await expect(page.locator('.home-choice')).toHaveCount(3);
  await page.locator('summary').filter({ hasText: '지금 비용을 줄이고 싶어요' }).click();
  await page.getByRole('link', { name: /지금 내는 창고 임차료를 줄이고 싶어요/ }).click();
  await expect(page.getByRole('radio', { name: /지금 내는 창고 임차료를 줄이고 싶어요/ })).toBeChecked();
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  await page.getByLabel('현재 월 임차료 (만원/월)', { exact: true }).fill('1,000');
  await page.locator('.inquiry-details > summary').click();
  await page.getByLabel('현재 월 관리비 (만원/월)', { exact: true }).fill('0');
  await page.getByLabel('현재 사용 면적 (㎡ 또는 평)', { exact: true }).fill('500평');
  await page.getByLabel('이전 가능한 지역·범위', { exact: true }).fill('전국 검토');
  await page.getByRole('combobox', { name: '금액의 VAT 기준' }).click();
  await page.getByRole('option', { name: '임차료·관리비 모두 VAT 별도' }).click();
  await expect(page.locator('.lease-review-fields')).toContainText('현재 창고 유지가 유리할 수도 있습니다.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.locator('.lease-review-fields').screenshot({ path: testInfo.outputPath('lease-fields.png') });
  await page.locator('#company').fill('검토 회사');
  await page.locator('#name').fill('담당자');
  await page.locator('#phone').fill('01012345678');
  await page.locator('#note').fill('재계약 전 비교');
  await page.locator('#consent').check();
  await page.getByRole('button', { name: '요청 내용 확인' }).click();
  await expect(page.locator('.prepared-panel pre')).toContainText('현재 월 임차료 (만원/월): 1,000');
  await expect(page.locator('.prepared-panel pre')).toContainText('현재 보증금 (만원): 확인 필요');
  await page.getByRole('button', { name: '수정', exact: true }).click();
  await expect(page.getByLabel('현재 월 임차료 (만원/월)', { exact: true })).toHaveValue('1,000');
  await page.getByRole('button', { name: '요청 내용 확인' }).click();
  await page.getByRole('button', { name: '물류 요청하기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(posted).toMatchObject({ tier: 2, help: '지금 내는 창고 임차료를 줄이고 싶어요', leaseReview: { rent: '1,000', management: '0', area: '500평', moveArea: '전국 검토', vat: '임차료·관리비 모두 VAT 별도' }, note: '재계약 전 비교' });
});

test('switching to another service excludes private lease details from the request', async ({ page }) => {
  let posted: Record<string, unknown> | undefined;
  await page.route('**/api/inquiry', (route) => {
    posted = route.request().postDataJSON();
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('/consultation?situation=rent-review');
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  await page.getByLabel('현재 월 임차료 (만원/월)', { exact: true }).fill('777');
  await page.getByRole('button', { name: '이전', exact: true }).click();
  await page.getByRole('radio', { name: /창고 공간이 필요해요/ }).check();
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  await expect(page.locator('.lease-review-fields')).toHaveCount(0);
  await page.locator('#company').fill('검토 회사');
  await page.locator('#name').fill('담당자');
  await page.locator('#phone').fill('01012345678');
  await page.locator('#consent').check();
  await page.getByRole('button', { name: '요청 내용 확인' }).click();
  await expect(page.locator('.prepared-panel pre')).not.toContainText('777');
  await page.getByRole('button', { name: '물류 요청하기' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(posted?.leaseReview).toBeUndefined();
});
