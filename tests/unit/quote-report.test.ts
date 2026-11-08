import { expect, test } from 'vitest';
import { emptyQuoteSpec, type QuoteResponse } from '@/lib/quotes';
import { baselineFrom, buildReport, emptySettings, normalizeReply, normalizeSettings, type ReportQuote } from '@/lib/quote-report';

const spec = { ...emptyQuoteSpec(), item: '생활용품', region: '부산 강서', temperature: '상온', start: '즉시', deadline: '2099-01-01', quantities: ['100', '0', '1000', '0', '0', '0'] };
const reply = (rates: string[], extra: Partial<QuoteResponse> = {}): QuoteResponse => ({ availability: '가능', center: '녹산 1센터', start: '즉시', rates, minimum: '0', extra: '0', setup: '0', vat: '별도', validUntil: '2099-01-01', note: '', ...extra });
const quotes: ReportQuote[] = [
  { id: 'q1', partnerId: 1, partnerName: '비싼물류', spec, state: '회신 완료', response: reply(['20000', '', '1000', '', '', '']) },
  { id: 'q2', partnerId: 2, partnerName: '싼물류', spec, state: '회신 완료', response: reply(['10000', '', '800', '', '', '']) },
  { id: 'q3', partnerId: 3, partnerName: '부가세미정', spec, state: '회신 완료', response: reply(['1', '', '1', '', '', ''], { vat: '확인 필요' }) },
  { id: 'q4', partnerId: 4, partnerName: '불가업체', spec, state: '회신 완료', response: reply(Array(6).fill(''), { availability: '불가' }) },
  { id: 'q5', partnerId: 5, partnerName: '미회신', spec, state: '전달 완료', response: null },
];
const base = { groupId: '00000000-0000-4000-8000-000000000001', quotes, partners: { 2: { regions: ['부산 강서구'], services: ['보관'], temperatures: ['상온'], categories: [], metrics: { sameDayRate: '99', asOf: '2026-10-01' } } }, replies: [], issuedAt: '2026-11-01T00:00:00Z', expiresAt: null, now: Date.parse('2026-11-01') };

test('orders comparable quotes by monthly cost and keeps partner names anonymous unless revealed', () => {
  const view = buildReport({ ...base, settings: emptySettings(), baseline: null });
  expect(view.rows.map(r => r.label)).toEqual(['A업체', 'B업체', 'C업체']);
  expect(view.rows[0]).toMatchObject({ id: 'q2', monthly: 1800000 });
  expect(view.rows[2]).toMatchObject({ id: 'q3', monthly: null, reason: '부가세 기준 확인 필요' });
  expect(JSON.stringify(view)).not.toContain('싼물류');
  expect(view.rows[0].center).not.toContain('녹산');
  expect(view).toMatchObject({ pending: 1, declined: 1, summary: { min: 1800000, max: 3000000 } });
  const revealed = buildReport({ ...base, settings: { ...emptySettings(), revealed: ['q2'], recommended: ['q2'] }, baseline: null });
  expect(revealed.rows[0]).toMatchObject({ label: '싼물류', center: '녹산 1센터', recommended: true });
  expect(revealed.summary.recommended).toEqual(['싼물류']);
});

test('difference to current cost needs an exact amount with the same VAT basis', () => {
  const view = buildReport({ ...base, settings: emptySettings(), baseline: { amount: 2000000, vat: '별도' } });
  expect(view.rows[0]).toMatchObject({ diffMonthly: 200000, diffAnnual: 2400000 });
  expect(view.rows[1]).toMatchObject({ diffMonthly: -1000000 });
  const vat = buildReport({ ...base, settings: emptySettings(), baseline: { amount: 2000000, vat: '포함' } });
  expect(vat.rows[0].diffMonthly).toBeNull();
  expect(vat.rows[0].diffReason).toContain('부가세 기준 상이');
  expect(baselineFrom({ currentCost: '', currentCostVat: '별도' })).toBeNull();
  expect(baselineFrom({ currentCost: '1500000', currentCostVat: '' })).toBeNull();
  expect(baselineFrom({ currentCost: '1500000', currentCostVat: '포함' })).toEqual({ amount: 1500000, vat: '포함' });
});

test('partner metrics are labeled as supplier-provided until documents are confirmed', () => {
  const view = buildReport({ ...base, settings: emptySettings(), baseline: null });
  expect(view.rows[0].metrics).toEqual([['당일출고율', '99%']]);
  expect(view.rows[0].metricSource).toContain('업체 제공');
  const checked = buildReport({ ...base, partners: { 2: { ...base.partners[2], review: { documents: '확인', checkedAt: '2026-10-20T00:00:00Z' } } }, settings: emptySettings(), baseline: null });
  expect(checked.rows[0].metricSource).toContain('자료 확인 (2026-10-20)');
});

test('settings and shipper replies only reference quotes in the same group', () => {
  expect(() => normalizeSettings({ comment: '', recommended: ['other'], revealed: [], stage: '견적 수집' }, ['q1'])).toThrow();
  expect(() => normalizeSettings({ comment: '', recommended: [], revealed: [], stage: '없는 단계' }, ['q1'])).toThrow();
  expect(normalizeSettings({ comment: ' 의견 ', recommended: ['q1', 'q1'], revealed: [], stage: '리포트 발송' }, ['q1'])).toMatchObject({ comment: '의견', recommended: ['q1'] });
  expect(() => normalizeReply({ choice: '현장 확인 요청', quoteIds: [], message: '' }, ['q1'])).toThrow();
  expect(() => normalizeReply({ choice: '보류', quoteIds: ['x'], message: '' }, ['q1'])).toThrow();
  expect(normalizeReply({ choice: '현장 확인 요청', quoteIds: ['q1'], message: '다음 주 화요일' }, ['q1']).choice).toBe('현장 확인 요청');
});
