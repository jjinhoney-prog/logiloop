import type { Page } from '@playwright/test';
export async function fillPartner(page: Page) {
  await page.locator('#partner-company').fill('파트너 테스트');
  await page.locator('#partner-name').fill('담당자');
  await page.locator('#partner-phone').fill('0511234567');
  await page.getByLabel('시·도 1').selectOption('부산');
  await page.getByLabel('시·군·구 1').fill('강서구');
  await page.getByRole('checkbox', { name: '보관', exact: true }).check();
  await page.getByRole('checkbox', { name: '상온', exact: true }).check();
  await page.locator('#partner-consent').check();
}
