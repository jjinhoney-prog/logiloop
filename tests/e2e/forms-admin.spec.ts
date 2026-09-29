import { expect, test } from '@playwright/test';

test.describe('consultation form', () => {
  test('reads tier and candidates from the URL', async ({ page }) => {
    await page.goto('/consultation?tier=3&candidates=busan-01,partner-01,bogus');
    await expect(page.getByRole('radio', { name: /운영방식 검토/ })).toBeChecked();
    await expect(page.locator('.target-summary')).toContainText('부산 신항권 상온 물류창고 · 예시');
    await expect(page.locator('.target-summary span')).toHaveCount(2);
  });

  test('validates required fields, focuses the first error, then prepares an unsent summary', async ({ page, context }) => {
    await page.goto('/consultation');
    await page.getByRole('button', { name: '기본 조건 입력' }).click();
    await page.getByRole('button', { name: '준비서 확인' }).click();

    await expect(page.getByText('담당자 이름을 입력해 주세요.')).toBeVisible();
    await expect(page.getByText('회사명을 입력해 주세요.')).toBeVisible();
    await expect(page.getByText('연락 가능한 전화번호를 확인해 주세요.')).toBeVisible();
    await expect(page.getByText('취급 품목 또는 아직 모름을 입력해 주세요.')).toBeVisible();
    await expect(page.getByText('작성 내용 확인에 동의해 주세요.')).toBeVisible();
    await expect(page.locator('#name')).toBeFocused();
    await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');

    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.method() !== 'GET') requests.push(`${req.method()} ${req.url()}`);
    });

    await page.locator('#company').fill('예시 회사');
    await page.locator('#name').fill('테스트');
    await page.locator('#phone').fill('010-1234-5678');
    await page.locator('#item').fill('아직 모름');
    await page.locator('#consent').check();
    await page.getByRole('button', { name: '준비서 확인' }).click();

    await expect(page.getByText('READY TO REVIEW · 미전송')).toBeVisible();
    await expect(page.locator('.prepared-panel pre')).toContainText('회사: 예시 회사');
    await expect(page.locator('.prepared-panel pre')).toContainText('필요한 도움: 후보 연결');

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '준비서 다운로드' }).click()]);
    expect(download.suggestedFilename()).toBe('로지루프_상담_준비서.txt');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.getByRole('button', { name: '복사' }).click();
    await expect(page.getByRole('status').filter({ hasText: /복사/ })).toBeVisible();

    // 폼 데이터는 서버로 전송되지 않는다.
    expect(requests).toEqual([]);
  });

  test('partnership does not require item and names the file accordingly', async ({ page }) => {
    await page.goto('/partnership');
    await page.getByRole('radio', { name: /창고·물류센터 임대 홍보/ }).check();
    await page.getByRole('button', { name: '기본 조건 입력' }).click();
    await page.locator('#company').fill('예시 창고');
    await page.locator('#name').fill('테스트');
    await page.locator('#phone').fill('0511234567');
    await page.locator('#consent').check();
    await page.getByRole('button', { name: '준비서 확인' }).click();
    await expect(page.locator('.prepared-panel pre')).toContainText('참여 유형: 창고·물류센터 임대 홍보');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '준비서 다운로드' }).click()]);
    expect(download.suggestedFilename()).toBe('로지루프_파트너_준비서.txt');
  });
});

test.describe('admin demo', () => {
  test('tier cannot be lowered and time is validated', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /예시 제조 화주 A/ }).click();

    const tierSelect = page.getByLabel('상담 등급 · 하향 변경 불가');
    await expect(tierSelect.locator('option[value="1"]')).toHaveJSProperty('disabled', true);
    await tierSelect.selectOption('3');
    await expect(tierSelect.locator('option[value="2"]')).toHaveJSProperty('disabled', true);

    const minutes = page.locator('.time-input input');
    await minutes.fill('600');
    await page.getByRole('button', { name: '반영' }).click();
    await expect(page.getByRole('status').filter({ hasText: '1~480분 사이의 작업 시간을 입력해 주세요.' })).toBeVisible();

    await minutes.fill('30');
    await page.getByRole('button', { name: '반영' }).click();
    await expect(page.locator('tr.row-active')).toContainText('3.0h');
    await expect(page.locator('.stat-card').nth(2)).toContainText('8.0h');
  });

  test('tier filter and supply tab', async ({ page }) => {
    await page.goto('/admin');
    await page.getByLabel('상담 등급 필터').selectOption('3');
    await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
    await page.getByRole('tab', { name: /공급 확인 이력/ }).click();
    await expect(page.locator('.data-table tbody tr')).toHaveCount(7);
  });
});
