import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const DB = process.env.BENCHMARK_DB_URL || 'http://127.0.0.1:3303';
test.beforeEach(async ({ request }) => { await request.post(`${DB}/reset`); });

test('late partner quote in its own format → admin standard entry → shipper report without the original', async ({ page, request }, testInfo) => {
  test.setTimeout(90000); page.setDefaultTimeout(15000);
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': testInfo.project.name === 'mobile' ? '127.0.6.2' : '127.0.6.1' });
  const now = new Date().toISOString();
  const past = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const future = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  await request.post(`${DB}/rest/v1/inquiries`, { data: { kind: 'consultation', tier: 1, company: '정리 비공개 화주', name: '화주', phone: '01011112222', item: '생활용품', region: '부산', region_detail: '강서구', temperature: '상온', volume: '보관 100팔레트', timing: '즉시', note: '', source: '테스트', created_at: now, updated_at: now } });
  const group = randomUUID(); const id = randomUUID();
  const spec = { item: '생활용품', region: '부산 강서구', temperature: '상온', start: '즉시', sku: '', peak: '', operations: '', deadline: past, quantities: ['100', '0', '1000', '0', '0', '0'], units: ['팔레트·월', '팔레트', '주문건', '건', '건', '건'] };
  await request.post(`${DB}/rest/v1/quote_requests`, { data: [{ id, group_id: group, inquiry_id: 1, partner_id: 99, partner_name: '늦은 물류', spec, state: '전달 완료', revision: randomUUID(), sent_at: now, delivery_note: '이메일 전달' }] });

  await page.goto('/admin/login'); await page.getByLabel('비밀번호').fill('test-only-password'); await page.getByRole('button', { name: '로그인' }).click(); await expect(page).toHaveURL('/admin');
  await page.goto('/admin/quotes');
  const card = page.locator('section.quote-card').filter({ has: page.getByRole('heading', { name: '늦은 물류', exact: true }) });
  await expect(card.getByText(/기한 3일 경과/)).toBeVisible();
  await expect(card.getByRole('button', { name: '회신 독촉 문구 복사' })).toBeVisible();

  const original = '늦은물류_견적서.xlsx / 파레트 월 12,000원 · 출고 건당 600원 · 월 최소 100만원 · VAT 별도 · 비밀단서';
  await card.getByLabel(/업체 견적 원문/).fill(original);
  await card.getByLabel('가능 센터', { exact: true }).fill('강서 센터');
  await card.getByLabel('수용 시작일', { exact: true }).fill('즉시');
  await card.getByLabel('견적 유효기간', { exact: true }).fill(future);
  await card.getByLabel(/^보관 단가/).fill('12000'); await card.getByLabel(/^입고 단가/).fill('0'); await card.getByLabel(/^출고 단가/).fill('600');
  await card.getByLabel('월 최소요금 (6개 항목 합계 기준)').fill('1000000');
  await card.getByLabel('월 별도 비용 합계').fill('0'); await card.getByLabel('초기 1회 비용').fill('0');
  await card.getByLabel('부가세', { exact: true }).selectOption('별도');
  await expect(card.getByText('표준 기준 월 비용: 1,800,000원')).toBeVisible();
  await card.getByRole('checkbox', { name: /원문과 단가/ }).check();
  await card.getByRole('button', { name: '표준 양식으로 저장 · 회신 완료 처리' }).click();
  await expect(card.getByText('상태: 회신 완료', { exact: false })).toBeVisible();
  await expect(page.locator('section.quote-comparison').getByText('담당자 정리')).toBeVisible();
  await expect(page.locator('section.quote-comparison').getByText('1,800,000원').first()).toBeVisible();

  const panel = page.locator('section.quote-report-admin');
  await panel.getByRole('button', { name: '리포트 설정 저장' }).click();
  await expect(panel.getByRole('status')).toHaveText('리포트 설정을 저장했습니다.');
  await panel.getByRole('button', { name: '리포트 링크 발급·재발급' }).click();
  const [rid, token] = new URL(await panel.getByLabel('화주 리포트 링크').inputValue()).hash.slice(1).split('.');
  await panel.getByLabel('전달 기록 · 채널/수신 담당자').fill('테스트 · 실제 발송 없음');
  await panel.getByRole('button', { name: '직접 전달 완료 기록' }).click();
  await expect(panel.getByText(/전달 완료/)).toBeVisible();
  const loaded = await request.post('/api/quote/report', { data: { id: rid, token, action: 'load' } });
  expect(loaded.status()).toBe(200);
  const body = JSON.stringify(await loaded.json());
  expect(body).toContain('1800000');
  for (const secret of ['비밀단서', '늦은물류_견적서', '담당자 정리', '정리 비공개 화주']) expect(body).not.toContain(secret);
});

test('partner can still reply on the standard form within 7 days after the deadline, marked as late', async ({ page, request }, testInfo) => {
  test.setTimeout(90000); page.setDefaultTimeout(15000);
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': testInfo.project.name === 'mobile' ? '127.0.6.4' : '127.0.6.3' });
  const { createHash } = await import('node:crypto');
  const now = new Date().toISOString();
  const past = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  const future = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  await request.post(`${DB}/rest/v1/inquiries`, { data: { kind: 'consultation', tier: 1, company: '링크 화주', name: '화주', phone: '01011113333', item: '생활용품', region: '부산', region_detail: '강서구', temperature: '상온', volume: '', timing: '', note: '', source: '테스트', created_at: now, updated_at: now } });
  const id = randomUUID(); const token = 'c'.repeat(64);
  const spec = { item: '생활용품', region: '부산 강서구', temperature: '상온', start: '즉시', sku: '', peak: '', operations: '', deadline: past, quantities: ['100', '0', '1000', '0', '0', '0'], units: ['팔레트·월', '팔레트', '주문건', '건', '건', '건'] };
  // 기존 방식으로 회신기한에 맞춰 만료되도록 발급된 링크
  await request.post(`${DB}/rest/v1/quote_requests`, { data: [{ id, group_id: randomUUID(), inquiry_id: 1, partner_id: 98, partner_name: '링크 늦은 물류', spec, state: '전달 완료', revision: randomUUID(), access_hash: createHash('sha256').update(token).digest('hex'), expires_at: Date.parse(`${past}T23:59:59.999+09:00`), sent_at: now, delivery_note: '메일' }] });

  await page.goto(`/quote/respond#${id}.${token}`);
  await expect(page.getByRole('note')).toContainText('회신기한');
  await page.getByLabel('가능 센터', { exact: true }).fill('강서 센터');
  await page.getByLabel('수용 시작일', { exact: true }).fill('즉시');
  await page.getByLabel('견적 유효기간', { exact: true }).fill(future);
  await page.getByLabel(/^보관 단가/).fill('12000'); await page.getByLabel(/^출고 단가/).fill('600');
  await page.getByLabel('월 최소요금 (6개 항목 합계 기준)').fill('0'); await page.getByLabel('월 별도 비용 합계').fill('0');
  await page.getByLabel('부가세', { exact: true }).selectOption('별도');
  await expect(page.getByText('1,800,000원').first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('late-supplier-form.png'), fullPage: true });
  await page.getByRole('button', { name: '견적 회신 저장' }).click();
  await expect(page.getByRole('status').filter({ hasText: '견적 회신을 저장했습니다.' })).toBeVisible();

  await page.goto('/admin/login'); await page.getByLabel('비밀번호').fill('test-only-password'); await page.getByRole('button', { name: '로그인' }).click(); await expect(page).toHaveURL('/admin');
  await page.goto('/admin/quotes');
  const table = page.locator('section.quote-comparison');
  await expect(table.getByText('기한 후 회신')).toBeVisible();
  await expect(table.getByText('1,800,000원').first()).toBeVisible();
});
