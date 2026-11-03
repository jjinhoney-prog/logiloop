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
