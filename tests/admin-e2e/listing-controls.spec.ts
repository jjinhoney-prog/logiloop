import { expect, test, type BrowserContext } from '@playwright/test';

let cookies: Awaited<ReturnType<BrowserContext['cookies']>> = [];
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:3203/admin/login');
  await page.getByLabel('비밀번호', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  cookies = await context.cookies();
  await context.close();
});
test.beforeEach(async ({ request, page, context }) => {
  await request.post('http://127.0.0.1:3303/reset');
  await context.addCookies(cookies);
  await page.goto('/admin?tab=listings');
});

test('photos expand, close with Escape, and handle missing or failed images', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: '사진 테스트 창고 사진 크게 보기' }).click();
  const dialog = page.getByRole('dialog', { name: '사진 테스트 창고 사진' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('photo-preview.png') });
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: '사진 테스트 창고 사진 크게 보기' })).toBeFocused();
  await expect(page.getByText('사진 없음').first()).toBeVisible();
  await expect(page.getByText('사진 로딩 실패')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('listing-table.png') });
});

test('deletion requires confirmation and disappears from admin and public pages', async ({ page }) => {
  await page.getByRole('button', { name: '사진 테스트 창고 삭제', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: '매물을 영구 삭제할까요?' });
  await expect(dialog.getByRole('button', { name: '취소' })).toBeFocused();
  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(page.getByRole('button', { name: '사진 테스트 창고 삭제', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '사진 테스트 창고 삭제', exact: true }).click();
  dialog = page.getByRole('dialog', { name: '매물을 영구 삭제할까요?' });
  await dialog.getByRole('button', { name: '영구 삭제', exact: true }).click();
  await expect(page.getByRole('button', { name: '사진 테스트 창고 삭제', exact: true })).toHaveCount(0);
  await page.reload();
  await page.getByRole('tab', { name: /매물 관리/ }).click();
  await expect(page.getByRole('button', { name: '사진 테스트 창고 삭제', exact: true })).toHaveCount(0);
  const response = await page.goto('/warehouses/photo-test');
  expect(response?.status()).toBe(404);
});

test('existing and newly added inquiry links prevent deletion', async ({ page }) => {
  await expect(page.getByRole('button', { name: '상담 연결 창고 삭제', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '새 상담 연결 창고 삭제', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '영구 삭제', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('상담 이력이 연결된 매물은 삭제할 수 없습니다.');
  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(page.getByRole('button', { name: '새 상담 연결 창고 삭제', exact: true })).toBeVisible();
});
