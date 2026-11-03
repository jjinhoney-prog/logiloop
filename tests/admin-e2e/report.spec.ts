import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { emptyShipperQuote, SHIPPER_QUOTE_PREFIX, SHIPPER_QUOTE_TITLE } from '../../lib/shipper-quote';

const DB = process.env.BENCHMARK_DB_URL || 'http://127.0.0.1:3303';
test.beforeEach(async ({ request }) => { await request.post(`${DB}/reset`); });

async function respond(page: Page, link: string, future: string, rates: [string, string, string]) {
  await page.goto(link);
  await page.getByLabel('가능 센터', { exact: true }).fill('녹산 비공개센터');
  await page.getByLabel('수용 시작일', { exact: true }).fill('다음 달 1일');
  await page.getByLabel('견적 유효기간', { exact: true }).fill(future);
  for (const [i, name] of ['보관', '입고', '출고'].entries()) await page.getByLabel(new RegExp(`^${name} 단가`)).fill(rates[i]);
  await page.getByLabel('월 최소요금 (6개 항목 합계 기준)').fill('0');
  await page.getByLabel('월 별도 비용 합계').fill('0');
  await page.getByLabel('초기 1회 비용').fill('0');
  await page.getByLabel('부가세', { exact: true }).selectOption('별도');
  await page.getByRole('button', { name: '견적 회신 저장' }).click();
  await expect(page.getByRole('status').filter({ hasText: '견적 회신을 저장했습니다.' })).toBeVisible();
}

test('quote replies → anonymous shipper report → delivery record → shipper site-visit request', async ({ page, request }, testInfo) => {
  test.setTimeout(120000); page.setDefaultTimeout(15000);
  const ip = testInfo.project.name === 'mobile' ? '127.0.4.2' : '127.0.4.1';
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': ip });
  const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  for (const [i, company] of ['리포트 물류 가', '리포트 물류 나'].entries()) {
    const res = await request.post('/api/partnership', { headers: { 'x-forwarded-for': `127.0.5.${i + 1}` }, data: { consent: true, profile: { company, name: '업체담당', phone: '01012345678', quoteEmail: 'quote@example.com', regions: [{ province: '부산', district: '강서구' }], services: ['보관'], temperatures: ['상온'], websiteUrl: '', documentUrl: '', disclosure: '담당자와 협의 후 결정', note: '', centers: [], metrics: i === 0 ? { sameDayRate: '99.5', lossRate: '0.02', asOf: '2026-10-01' } : {} } } });
    expect(res.status()).toBe(201);
  }
  const requirements = { ...emptyShipperQuote(), shareConsent: true, currentCost: '2500000', currentCostVat: '별도', costRange: '500만~1,500만원', switchTiming: '1~3개월' };
  await request.post(`${DB}/rest/v1/inquiries`, { data: { kind: 'consultation', tier: 1, help: SHIPPER_QUOTE_TITLE, company: '리포트 비공개 화주', name: '화주담당', phone: '01099998888', item: '생활용품', region: '부산', region_detail: '강서구', temperature: '상온', volume: '보관 100팔레트', timing: '협의 필요', note: SHIPPER_QUOTE_PREFIX + JSON.stringify({ requirements, note: '' }), source: '테스트', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } });

  await page.goto('/admin/login'); await page.getByLabel('비밀번호').fill('test-only-password'); await page.getByRole('button', { name: '로그인' }).click(); await expect(page).toHaveURL('/admin');
  await expect(page.getByText('리드 B')).toBeVisible();
  await page.goto('/admin/quotes');
  await page.getByLabel('화주 상담 선택').selectOption({ label: '#3 리포트 비공개 화주' });
  await page.getByRole('checkbox', { name: /리포트 물류 가/ }).check(); await page.getByRole('checkbox', { name: /리포트 물류 나/ }).check();
  await page.getByLabel('취급 품목', { exact: true }).fill('생활용품'); await page.getByLabel('희망 지역', { exact: true }).fill('부산 강서구'); await page.getByLabel('필요 온도', { exact: true }).fill('상온'); await page.getByLabel('운영 시작일', { exact: true }).fill('즉시');
  await page.getByLabel('회신기한', { exact: true }).fill(future);
  for (const [name, value] of [['보관', '100'], ['입고', '0'], ['출고', '1000'], ['포장', '0'], ['택배', '0'], ['반품', '0']]) await page.getByLabel(`${name} 수량`, { exact: true }).fill(value);
  await page.getByRole('checkbox', { name: '업체에 전달할 조건과 화주 식별정보 제외 여부를 확인했습니다.' }).check();
  await page.getByRole('button', { name: '견적 요청 초안 저장' }).click();
  const links: string[] = [];
  for (const company of ['리포트 물류 가', '리포트 물류 나']) {
    const card = page.locator('section.quote-card').filter({ has: page.getByRole('heading', { name: company, exact: true }) });
    await card.getByRole('button', { name: '회신 링크 발급·재발급' }).click();
    links.push(await card.getByLabel(`${company} 회신 링크`).inputValue());
    await card.getByLabel('전달 기록 · 채널/수신 담당자').fill('시연용 · 실제 발송 없음');
    await card.getByRole('button', { name: '직접 전달 완료 기록' }).click();
    await expect(card.getByText('상태: 전달 완료', { exact: false })).toBeVisible();
  }
  await respond(page, links[0], future, ['15000', '0', '800']); // 2,300,000
  await respond(page, links[1], future, ['10000', '0', '700']); // 1,700,000

  await page.goto('/admin/quotes');
  const panel = page.locator('section.quote-report-admin');
  await expect(panel.getByRole('heading', { name: '화주용 비교 리포트' })).toBeVisible();
  await panel.getByRole('checkbox', { name: '리포트 물류 가 추천' }).check();
  await panel.getByLabel('담당자 의견 · 화주에게 표시').fill('출고 품질 지표를 제출한 업체를 추천합니다.');
  await panel.getByRole('button', { name: '리포트 설정 저장' }).click();
  await expect(panel.getByRole('status')).toHaveText('리포트 설정을 저장했습니다.');
  await panel.getByRole('button', { name: '리포트 링크 발급·재발급' }).click();
  const reportLink = await panel.getByLabel('화주 리포트 링크').inputValue();
  const [id, token] = new URL(reportLink).hash.slice(1).split('.');
  expect((await request.post('/api/quote/report', { data: { id, token, action: 'load' } })).status()).toBe(401);
  await panel.getByLabel('전달 기록 · 채널/수신 담당자').fill('화주 담당자에게 직접 전달 · 시연');
  await panel.getByRole('button', { name: '직접 전달 완료 기록' }).click();
  await expect(panel.getByText(/전달 완료/)).toBeVisible();

  const loaded = await request.post('/api/quote/report', { data: { id, token, action: 'load' } });
  expect(loaded.status()).toBe(200);
  const body = JSON.stringify(await loaded.json());
  for (const secret of ['리포트 물류 가', '리포트 물류 나', '리포트 비공개 화주', '01099998888', '녹산 비공개센터', 'access_hash', 'partnerId']) expect(body).not.toContain(secret);
  expect((await request.post('/api/quote/report', { data: { id, token: 'b'.repeat(64), action: 'load' } })).status()).toBe(401);

  await page.goto(reportLink);
  const report = page.locator('article.quote-report');
  await expect(report.getByRole('heading', { name: /비교 리포트 #/ })).toBeVisible();
  await expect(report.getByRole('rowheader', { name: 'A업체' }).first()).toBeVisible();
  await expect(report.getByText('1,700,000원 ~ 2,300,000원')).toBeVisible();
  await expect(report.getByText('800,000원 낮음')).toBeVisible();
  await expect(report.getByText('200,000원 낮음')).toBeVisible();
  await expect(report.getByText(/업체 제공 · 미확인/)).toBeVisible();
  await expect(report.getByText('출고 품질 지표를 제출한 업체를 추천합니다.')).toBeVisible();
  expect((await new AxeBuilder({ page }).include('.quote-report-page').analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('shipper-report.png'), fullPage: true });

  await page.getByRole('checkbox', { name: 'B업체' }).check();
  await page.getByLabel('요청 내용 · 선택').fill('다음 주 화요일 방문 희망');
  await page.getByRole('button', { name: '담당자에게 전달' }).click();
  await expect(page.getByRole('status').filter({ hasText: '요청을 전달했습니다.' })).toBeVisible();
  await expect(page.locator('.report-steps li.current')).toHaveText('현장 확인');

  await page.goto('/admin/quotes');
  await expect(panel.getByText(/현장 확인 요청 · 리포트 물류 가 · 다음 주 화요일 방문 희망/)).toBeVisible();
  await panel.getByLabel('리포트 진행 단계').selectOption('종결');
  await panel.getByRole('button', { name: '리포트 설정 저장' }).click();
  await expect(panel.getByRole('status')).toHaveText('리포트 설정을 저장했습니다.');
  expect((await request.post('/api/quote/report', { data: { id, token, action: 'load' } })).status()).toBe(401);
});
