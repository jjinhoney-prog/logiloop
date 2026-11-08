import { describe, expect, test } from 'vitest';
import { cleanCostInput, compareCosts, formatManwon, parseCostInput } from '@/lib/cost-compare';
import { parseRequestContext } from '@/lib/search-params';

const full = { storage: 100, handling: 50, outsourceExtra: 0, onboarding: 100, rent: 80, maintenance: 10, labor: 30, equipment: 0, moveIn: 500, restore: 100 };

describe('cost comparison', () => {
  test('distinguishes blank from zero', () => {
    expect(parseCostInput('')).toBeNull();
    expect(parseCostInput('0')).toBe(0);
    expect(parseCostInput('1,200만원')).toBe(1200);
  });

  test('keeps the decimal point instead of multiplying by ten', () => {
    expect(parseCostInput('12.5')).toBe(12.5);
    expect(parseCostInput('1,200.5')).toBe(1200.5);
    expect(parseCostInput('12.56')).toBe(12.5);
    expect(cleanCostInput('12.')).toBe('12.');
    expect(cleanCostInput('1234.5.6')).toBe('1,234.5');
    expect(cleanCostInput('.5')).toBe('0.5');
    expect(formatManwon(compareCosts({ storage: 12.5, handling: 0.1, rent: 0.2 }, 1).outsource.total)).toBe('12.6만원');
  });

  test('shows no verdict while any cost is unknown', () => {
    const result = compareCosts({ storage: 100, rent: 80 }, 24);
    expect(result).toMatchObject({ ready: true, complete: false, lower: null, gap: null, breakEvenMonths: null });
    expect(result.outsource.total).toBe(2400);
    expect(result.lease.missing).toContain('월 관리비');
  });

  test('needs a monthly cost on both sides', () => {
    expect(compareCosts({ storage: 100 }, 24).ready).toBe(false);
    expect(compareCosts({ storage: 0, rent: 0 }, 24).ready).toBe(true);
  });

  test('compares totals and finds the break-even month', () => {
    const result = compareCosts(full, 24);
    expect(result.outsource.total).toBe(3700);
    expect(result.lease.total).toBe(3480);
    expect(result).toMatchObject({ complete: true, lower: 'lease', gap: 220, breakEvenMonths: 17, evenMonths: null });
    expect(compareCosts(full, 12).lower).toBe('outsource');
  });

  test('separates the tie month from the month one side becomes cheaper', () => {
    // 일회성 비용 차이 600, 월 비용 차이 30 → 20개월에 같고 21개월부터 임차가 낮다.
    const tie = { ...full, storage: 140, handling: 0, onboarding: 0, rent: 80, maintenance: 10, labor: 20, moveIn: 500, restore: 100 };
    expect(compareCosts(tie, 24)).toMatchObject({ evenMonths: 20, breakEvenMonths: 21 });
    expect(compareCosts(tie, 20).lower).toBe('same');
  });

  test('reports start and end one-off costs separately', () => {
    const { lease, outsource } = compareCosts(full, 24);
    expect(lease).toMatchObject({ start: 500, end: 100, once: 600 });
    expect(outsource).toMatchObject({ start: 100, end: 0, once: 100 });
  });

  test('has no break-even when one side is cheaper on both', () => {
    expect(compareCosts({ ...full, moveIn: 0, restore: 0, onboarding: 100 }, 24).breakEvenMonths).toBeNull();
  });
});

describe('new request situations', () => {
  test('urgent and contract reach the form', () => {
    expect(parseRequestContext({ situation: 'urgent' })).toMatchObject({ help: '급하게 보관 공간이 필요해요', tier: 1 });
    expect(parseRequestContext({ situation: 'contract' })).toMatchObject({ help: '정기 물류 계약을 검토해요', tier: 2 });
  });
});
