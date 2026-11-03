import { expect, test } from 'vitest';
import { costFromNote, inquiryLead, leadGrade, withCostLine } from '@/lib/lead';
import { decodeShipperQuote, emptyShipperQuote, encodeShipperQuote, normalizeShipperQuote, SHIPPER_QUOTE_PREFIX } from '@/lib/shipper-quote';
import { normalizeMetrics, metricRows } from '@/lib/partner-metrics';

test('lead grade combines current logistics cost and switching time', () => {
  expect(leadGrade('3,000만원 이상', '1개월 이내')).toBe('A');
  expect(leadGrade('1,500만~3,000만원', '1~3개월')).toBe('A');
  expect(leadGrade('500만~1,500만원', '1~3개월')).toBe('B');
  expect(leadGrade('500만원 미만', '비교만 원함')).toBe('C');
  expect(leadGrade('', '아직 모름')).toBe('미분류');
  expect(leadGrade('모름', '')).toBe('미분류');
});

test('simple consultation keeps the cost range in the note without a schema change', () => {
  const note = withCostLine('창고 이전 검토', '1,500만~3,000만원');
  expect(note.split('\n')[0]).toBe('현재 월 물류비: 1,500만~3,000만원');
  expect(costFromNote(note)).toBe('1,500만~3,000만원');
  expect(withCostLine('메모', '임의 값')).toBe('메모');
  expect(inquiryLead({ kind: 'consultation', note, timing: '3개월 이내' })).toBe('A');
  expect(inquiryLead({ kind: 'partnership', note, timing: '1개월 이내' })).toBe('미분류');
});

test('shipper lead fields validate and old stored requests still decode', () => {
  const base = { ...emptyShipperQuote(), shareConsent: true };
  expect(normalizeShipperQuote({ ...base, currentCost: '12000000' }).errors.currentCostVat).toBeTruthy();
  expect(normalizeShipperQuote({ ...base, costRange: '많음' }).errors.costRange).toBeTruthy();
  expect(normalizeShipperQuote({ ...base, currentCost: '12,000,000', currentCostVat: '별도' }).errors.currentCost).toBeTruthy();
  const ok = normalizeShipperQuote({ ...base, costRange: '3,000만원 이상', switchTiming: '1개월 이내', currentCost: '32000000', currentCostVat: '별도', contractEnd: '2027-01-31' });
  expect(ok.errors).toEqual({});
  expect(decodeShipperQuote(encodeShipperQuote(ok.value, ''))?.requirements.currentCost).toBe('32000000');
  const legacy = Object.fromEntries(Object.entries(emptyShipperQuote()).filter(([key]) => !['costRange', 'currentCost', 'currentCostVat', 'switchTiming', 'contractEnd'].includes(key)));
  const decoded = decodeShipperQuote(SHIPPER_QUOTE_PREFIX + JSON.stringify({ requirements: legacy, note: '' }));
  expect(decoded?.requirements.costRange).toBe('');
});

test('partner metrics require numeric ranges and an as-of date', () => {
  const errors: Record<string, string> = {};
  expect(normalizeMetrics({ sameDayRate: '101', shipperCount: '2.5', returnHandling: '빠름' }, errors)).toEqual({});
  expect(Object.keys(errors).sort()).toEqual(['metrics.returnHandling', 'metrics.sameDayRate', 'metrics.shipperCount']);
  const e2: Record<string, string> = {};
  normalizeMetrics({ lossRate: '0.02' }, e2);
  expect(e2['metrics.asOf']).toBeTruthy();
  const e3: Record<string, string> = {};
  const ok = normalizeMetrics({ lossRate: '0.02', shipperCount: '25', asOf: '2026-10-01' }, e3, Date.parse('2026-11-01'));
  expect(e3).toEqual({});
  expect(metricRows(ok)).toEqual([['오출고·파손 등 인정 로스율', '0.02%'], ['현재 운영 화주사 수', '25곳']]);
});
