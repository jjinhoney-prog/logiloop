import { expect, test, type Page } from '@playwright/test';

async function select(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

const STORAGE_KEY = 'logiloop:compare';

test.describe('catalog filters', () => {
  test('filters combine and reset; empty state is shown', async ({ page }) => {
    await page.goto('/warehouses');
    await expect(page.locator('.catalog-card')).toHaveCount(4);

    await select(page, '지역', '경남');
    await expect(page.locator('.catalog-card')).toHaveCount(3);

    await select(page, '온도', '냉장');
    await expect(page.locator('.catalog-card')).toHaveCount(1);
    await expect(page.locator('.catalog-card .card-title')).toHaveText(/양산 냉장 보관 물류센터/);

    await select(page, '온도', '냉동');
    await expect(page.getByText('현재 선택 조건에 등록된 예시 후보가 없습니다.')).toBeVisible();

    await page.getByRole('button', { name: '필터 초기화' }).click();
    await expect(page.locator('.catalog-card')).toHaveCount(4);
  });

  test('search is case-insensitive and clearable; area sort orders largest first', async ({ page }) => {
    await page.goto('/partners');
    const search = page.getByLabel('지역, 시설 또는 서비스 검색');
    await search.fill('b2b');
    await expect(page.locator('.catalog-card')).toHaveCount(1);
    await page.getByRole('button', { name: '검색어 지우기' }).click();
    await expect(page.locator('.catalog-card')).toHaveCount(3);
    await expect(page.locator('.select-field', { hasText: '면적' })).toHaveCount(0);

    await page.goto('/warehouses');
    await select(page, '정렬', '면적 큰 순');
    await expect(page.locator('.catalog-card .card-title').first()).toHaveText(/양산/);
  });
});

test.describe('comparison list', () => {
  test('limits to three with a toast, persists across reload and shows the dock', async ({ page }) => {
    await page.goto('/warehouses');
    const toggles = page.getByRole('button', { name: /비교$/ });
    for (let i = 0; i < 3; i++) await toggles.nth(i).click();
    await expect(page.locator('.comparison-dock')).toContainText('3개 후보를 담았습니다');
    await toggles.nth(3).click();
    await expect(page.getByRole('status').filter({ hasText: '비교 후보는 최대 3개까지 담을 수 있습니다.' })).toBeVisible();
    await expect(page.locator('.nav-count')).toHaveText('3');

    await page.reload();
    await expect(page.locator('.nav-count')).toHaveText('3');
    await expect(page.locator('.compare-toggle.selected')).toHaveCount(3);
  });

  test('restores from the prototype storage key and drops invalid ids', async ({ page }) => {
    await page.addInitScript((key) => localStorage.setItem(key, JSON.stringify(['nope', 'busan-01', 'busan-01', 'partner-01'])), STORAGE_KEY);
    await page.goto('/compare');
    await expect(page.locator('.comparison-table thead th')).toHaveCount(3);
    await expect(page.getByText('2 / 3개 후보', { exact: false })).toBeVisible();

    await page.getByRole('button', { name: '부산권 수출입 3PL 파트너 비교에서 제거' }).click();
    await expect(page.locator('.comparison-table thead th')).toHaveCount(2);

    const cta = page.getByRole('link', { name: '이 후보로 상담 준비' });
    await expect(cta).toHaveAttribute('href', '/consultation?tier=2&candidates=busan-01');

    await page.getByRole('button', { name: '모두 비우기' }).click();
    await expect(page.getByText('비교할 후보를 담아보세요.')).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe('[]');
  });

  test('detail page toggles the comparison list and links to consultation', async ({ page }) => {
    await page.goto('/warehouses/busan-01');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('부산 신항권 상온 물류창고');
    await expect(page.getByRole('link', { name: '이 물건 문의' })).toHaveAttribute('href', '/consultation?tier=1&target=busan-01');
    await expect(page.getByRole('link', { name: '다른 후보까지 비교' })).toHaveAttribute('href', '/consultation?tier=2&target=busan-01');
    await page.getByRole('button', { name: '비교함 담기' }).click();
    await expect(page.getByRole('button', { name: '비교함 담김 · 해제' })).toBeVisible();
    await expect(page.locator('.nav-count')).toHaveText('1');
  });
});

test.describe('location · access', () => {
  test('without keys: map fallback and “거리 계산 설정 전” in the table', async ({ page }) => {
    await page.goto('/warehouses/busan-01');
    const section = page.locator('.location-section');
    await expect(section.getByRole('heading', { name: '창고 위치·접근성' })).toBeVisible();
    await expect(section).toContainText('권역 대표 위치이며 실제 매물 위치가 아닙니다.');
    await expect(section.getByText('지도 설정 전')).toBeVisible();
    await expect(section.locator('.distance-table tbody tr')).toHaveCount(5);
    await expect(section.locator('.distance-table tbody tr').first()).toContainText('거리 계산 설정 전입니다.');
    await section.getByRole('button', { name: '창고 위치·접근성 안내' }).click();
    await expect(section.getByRole('tooltip')).toContainText('카카오모빌리티 경로 기준 추정치이며 시간대·차종(대형 화물차)에 따라 달라질 수 있습니다.');
  });

  test('renders distances from /api/distance (mocked) and partner pages use their own title and accent', async ({ page }) => {
    await page.route('**/api/distance?id=partner-02', (route) =>
      route.fulfill({
        json: [
          { hub: '부산신항', km: 31.4, minutes: 38 },
          { hub: '부산북항', km: null, minutes: null, note: '확인 불가' },
          { hub: '김해공항', km: 12, minutes: 17 },
          { hub: '서부산IC', km: 15.2, minutes: 19 },
          { hub: '동김해IC (남해고속도로)', km: 3.1, minutes: 6 },
        ],
      }),
    );
    await page.goto('/partners/partner-02');
    const section = page.locator('.location-section.location-partner');
    await expect(section.getByRole('heading', { name: '물류사 운영 거점·접근성' })).toBeVisible();
    await expect(section).toContainText('실제 업체 위치가 아닙니다.');
    const first = section.locator('.distance-table tbody tr').first();
    await expect(first).toContainText('31.4km');
    await expect(first).toContainText('약 38분');
    await expect(section.locator('.distance-table tbody tr').nth(1)).toContainText('확인 불가');
    await expect(page.locator('.detail-banner-partner')).toBeVisible();
  });
});

test.describe('routing', () => {
  for (const path of ['/warehouses/partner-01', '/partners/busan-01', '/insights/unknown', '/no-such-page']) {
    test(`404 for ${path}`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다.' })).toBeVisible();
    });
  }

  test('security headers and noindex are preserved', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response!.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(headers['x-powered-by']).toBeUndefined();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page).toHaveTitle('로지루프 | 전국 물류거점 비교');
  });

  test('pages do not request Google Fonts at runtime', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (req) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) external.push(req.url());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
  });
});
