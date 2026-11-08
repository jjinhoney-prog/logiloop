import { expect, test } from '@playwright/test';

test('guide context and separate volumes survive review and submission', async ({ page }, testInfo) => {
  let posted: Record<string, unknown> | undefined;
  await page.route('**/api/inquiry', async route => {
    posted = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto('/insights/factory-storage');
  await page.getByRole('link', { name: '외부 보관 공간 검토 요청' }).click();
  await expect(page.getByRole('radio', { name: /창고 공간이 필요해요/ })).toBeChecked();
  await page.getByRole('button', { name: '기본 조건 입력' }).click();
  await page.locator('#company').fill('테스트 회사');
  await page.locator('#name').fill('테스트 담당자');
  await page.locator('#phone').fill('010-1234-5678');
  await page.getByLabel('보관 규모 (선택)', { exact: true }).fill('0');
  await page.getByLabel('월 출고량 (선택)', { exact: true }).fill('1200');
  await page.getByRole('combobox', { name: '월 출고량 단위' }).click();
  await page.getByRole('option', { name: '박스', exact: true }).click();
  await page.locator('#consent').check();
  await page.screenshot({ path: testInfo.outputPath('split-volume.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '요청 내용 확인' }).click();
  await expect(page.locator('.prepared-panel pre')).toContainText('보관 규모: 0 팔레트 / 월 출고량: 1200 박스');
  await expect(page.locator('.prepared-panel pre')).toContainText('필요 작업: 공장 안 재고, 외부로 옮기기 전에');
  await page.getByRole('button', { name: '물류 요청하기' }).click();
  await expect(page.getByRole('dialog', { name: '접수되었습니다.' })).toBeVisible();
  expect(posted).toMatchObject({ storageQuantity: '0', outboundQuantity: '1200', outboundUnit: '박스', volume: '보관 규모: 0 팔레트 / 월 출고량: 1200 박스' });
});
