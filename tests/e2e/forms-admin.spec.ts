import { expect, test, type Page } from '@playwright/test';

test.describe('consultation form', () => {
  test('reads tier and candidates from the URL; candidates appear only after submission', async ({ page }) => {
    await page.route('**/api/inquiry', (route) => route.fulfill({ json: { ok: true } }));
    await page.goto('/consultation?tier=3&candidates=busan-01,partner-01,bogus');
    await expect(page.getByRole('radio', { name: /운영방식 검토/ })).toBeChecked();
    await expect(page.locator('.target-summary')).toHaveCount(0);

    await page.getByRole('button', { name: '기본 조건 입력' }).click();
    await page.locator('#company').fill('예시 회사');
    await page.locator('#name').fill('테스트');
    await page.locator('#phone').fill('010-1234-5678');
    await page.locator('#item').fill('생활용품');
    await page.locator('#consent').check();
    await page.getByRole('button', { name: '준비서 확인' }).click();
    await expect(page.locator('.prepared-panel pre')).toContainText('검토 후보: 부산 신항권 상온 물류창고, 부산권 수출입 3PL 파트너');
    await expect(page.locator('.target-summary')).toHaveCount(0);

    await page.getByRole('button', { name: '상담 신청하기' }).click();
    await page.getByRole('dialog').getByRole('button', { name: '확인' }).click();
    await expect(page.locator('.target-summary span')).toHaveCount(2);
    await expect(page.locator('.target-summary')).toContainText('부산 신항권 상온 물류창고');
  });

  test('validates required fields, focuses the first error, then prepares an unsent summary', async ({ page, context }) => {
    await page.goto('/consultation');
    await page.getByRole('button', { name: '기본 조건 입력' }).click();
    await page.getByRole('button', { name: '준비서 확인' }).click();

    await expect(page.getByText('담당자 이름을 입력해 주세요.')).toBeVisible();
    await expect(page.getByText('회사명을 입력해 주세요.')).toBeVisible();
    await expect(page.getByText('연락 가능한 전화번호를 확인해 주세요.')).toBeVisible();
    await expect(page.getByText('취급 품목 또는 아직 모름을 입력해 주세요.')).toBeVisible();
    await expect(page.getByText('개인정보 수집·이용 및 국외 이전에 동의해 주세요.')).toBeVisible();
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

    await expect(page.getByText('READY TO SUBMIT · 신청 전')).toBeVisible();
    await expect(page.locator('.prepared-panel pre')).toContainText('회사: 예시 회사');
    await expect(page.locator('.prepared-panel pre')).toContainText('필요한 도움: 후보 연결');

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '준비서 다운로드' }).click()]);
    expect(download.suggestedFilename()).toBe('로지루프_상담_준비서.txt');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.getByRole('button', { name: '복사' }).click();
    await expect(page.getByRole('status').filter({ hasText: /복사/ })).toBeVisible();

    // 복사·다운로드만으로는 서버로 전송되지 않는다(‘신청하기’를 눌러야 전송).
    expect(requests).toEqual([]);
  });

  async function fillAndReview(page: Page) {
    await page.goto('/consultation?tier=2&target=busan-01');
    await page.getByRole('button', { name: '기본 조건 입력' }).click();
    await page.locator('#company').fill('예시 회사');
    await page.locator('#name').fill('테스트');
    await page.locator('#phone').fill('010-1234-5678');
    await page.locator('#item').fill('생활용품');
    await page.locator('#consent').check();
    await page.getByRole('button', { name: '준비서 확인' }).click();
  }

  test('submits to /api/inquiry and shows the completion modal (API mocked)', async ({ page }) => {
    let posted: Record<string, unknown> | undefined;
    await page.route('**/api/inquiry', async (route) => {
      posted = route.request().postDataJSON();
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({ json: { ok: true } });
    });
    await fillAndReview(page);

    const submit = page.getByRole('button', { name: '상담 신청하기' });
    await submit.click();
    await expect(page.getByRole('button', { name: '전송 중…' })).toBeDisabled();

    const dialog = page.getByRole('dialog', { name: '접수되었습니다.' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('영업일 기준 1일 내 연락드립니다.');
    expect(posted).toMatchObject({ company: '예시 회사', tier: 2, partnership: false, targets: ['busan-01'], website: '', consent: true });

    await dialog.getByRole('button', { name: '확인' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: '신청 완료' })).toBeDisabled();
    await expect(page.getByText('SUBMITTED · 접수 완료')).toBeVisible();
  });

  test('failure shows a toast guiding to download and allows retry (API mocked)', async ({ page }) => {
    await page.route('**/api/inquiry', (route) => route.fulfill({ status: 503, json: { ok: false, error: '접수 설정 전입니다. 준비서를 내려받아 보관해 주세요.' } }));
    await fillAndReview(page);
    await page.getByRole('button', { name: '상담 신청하기' }).click();
    await expect(page.getByRole('status').filter({ hasText: '접수 설정 전입니다.' })).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: '상담 신청하기' })).toBeEnabled();
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
    await expect(page.getByRole('button', { name: '파트너 신청하기' })).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '준비서 다운로드' }).click()]);
    expect(download.suggestedFilename()).toBe('로지루프_파트너_준비서.txt');
  });
});

test.describe('admin workspace', () => {
  test('is closed to visitors who are not signed in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto('/admin/listings/new');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test('wrong password is refused; the right one opens the workspace and logout closes it', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('비밀번호').fill('wrong-password');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page.locator('#login-error')).toHaveText('비밀번호가 맞지 않습니다.');

    await page.getByLabel('비밀번호').fill('e2e-admin-password');
    await page.getByRole('button', { name: '로그인' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('운영 워크스페이스');
    await expect(page.getByText('DB 연결 전입니다.', { exact: false })).toBeVisible();

    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
