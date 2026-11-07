import { expect, test } from 'vitest';
import { emptyQuoteSpec, normalizeQuoteSpec, normalizeQuoteResponse, quoteTotal } from '@/lib/quotes';
test('unknown money is not a free quote', () => {
  const spec = emptyQuoteSpec();
  expect(quoteTotal(spec, { availability: '가능', center: '부산', start: '즉시', rates: Array(6).fill(''), minimum: '', extra: '', setup: '', vat: '별도', validUntil: '2099-01-01', note: '' }).monthly).toBeNull();
});
test('same volume, minimum and separate recurring cost are calculated explicitly', () => {
  const spec = { ...emptyQuoteSpec(), quantities: ['100','50','1000','0','0','0'] };
  const response = { availability: '가능', center: '부산', start: '즉시', rates: ['10000','3000','500','','',''], minimum: '2000000', extra: '100000', setup: '300000', vat: '별도', validUntil: '2099-01-01', note: '' };
  expect(quoteTotal(spec, response)).toMatchObject({ monthly: 2100000, firstMonth: 2400000 });
  expect(quoteTotal(spec, {...response, availability:'불가'}).monthly).toBeNull();
});
test('rejects negative quantities and invalid dates, tolerates blank unknown costs', () => {
  expect(() => normalizeQuoteSpec({...emptyQuoteSpec(), quantities: ['-1','','','','','']})).toThrow();
  expect(() => normalizeQuoteResponse({})).toThrow();
});

test('expired or VAT-unknown responses cannot be shown as comparable totals', () => {
  const spec={...emptyQuoteSpec(),quantities:Array(6).fill('1')};
  const response={availability:'가능',center:'센터',start:'즉시',rates:Array(6).fill('1'),minimum:'0',extra:'0',setup:'0',vat:'포함',validUntil:'2000-01-01',note:''};
  expect(quoteTotal(spec,response).monthly).toBeNull();
  expect(quoteTotal(spec,{...response,validUntil:'2099-01-01',vat:'확인 필요'}).monthly).toBeNull();
});

test('proxy entry keeps the partner original and marks the source', async () => {
  const { normalizeProxyResponse } = await import('@/lib/quotes');
  const reply = { availability: '가능', center: '녹산', start: '12월', rates: ['18000','2500','700','','',''], minimum: '1500000', extra: '0', setup: '', vat: '별도', validUntil: '2099-01-01', note: '' };
  expect(() => normalizeProxyResponse({ ...reply, original: '' })).toThrow();
  const saved = normalizeProxyResponse({ ...reply, original: '팔레트 18,000 / VAT 별도' }, new Date('2026-11-06T00:00:00Z'));
  expect(saved).toMatchObject({ source: '담당자 정리', original: '팔레트 18,000 / VAT 별도', enteredAt: '2026-11-06T00:00:00.000Z', rates: reply.rates });
  expect(normalizeQuoteResponse({ ...reply, original: 'x', source: '담당자 정리' })).toMatchObject({ source: '업체 회신' });
  expect(normalizeQuoteResponse({ ...reply, original: 'x' }).original).toBeUndefined();
});

test('deadline countdown uses Korea time and reminder accepts partner formats', async () => {
  const { daysUntilDeadline, quoteReminderText } = await import('@/lib/quotes');
  const now = Date.parse('2026-11-05T16:00:00Z'); // 2026-11-06 01:00 KST
  expect(daysUntilDeadline('2026-11-06', now)).toBe(0);
  expect(daysUntilDeadline('2026-11-09', now)).toBe(3);
  expect(daysUntilDeadline('2026-11-04', now)).toBe(-2);
  const text = quoteReminderText('12345678-aaaa-bbbb-cccc-000000000000', 'A물류', { ...emptyQuoteSpec(), item: '화장품', region: '녹산', temperature: '상온', deadline: '2026-11-04' }, now);
  expect(text).toContain('경과');
  expect(text).toContain('귀사 견적서');
});
