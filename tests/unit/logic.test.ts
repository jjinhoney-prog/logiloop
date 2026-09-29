import { describe, expect, test } from 'vitest';
import { filterListings, sanitizeSelection, toggleSelection, validateInquiry } from '@/lib/logic';

const fixtures = [
  { id: 'a', type: 'warehouse' as const, name: '부산 상온', region: '부산', temperature: '상온', area: 1650, district: '신항', tags: ['도크'], service: '보관' },
  { id: 'b', type: 'warehouse' as const, name: '김해 창고', region: '김해', temperature: '냉장', area: 660, district: '김해', tags: [], service: '식품' },
  { id: 'c', type: 'partner' as const, name: '부산 파트너', region: '부산', temperature: '상온', district: '신항', tags: ['B2B'], service: '출고' },
];

describe('filterListings', () => {
  test('filters combine type, temperature, region, area and text', () => {
    expect(filterListings(fixtures, { type: 'warehouse', region: '부산', temperature: '상온', size: '1,000㎡ 이상', query: ' 도크 ' }).map((x) => x.id)).toEqual(['a']);
  });
  test('size filter excludes unknown area rather than treating it as zero', () => {
    expect(filterListings(fixtures, { size: '1,000㎡ 미만' }).map((x) => x.id)).toEqual(['b']);
  });
  test('search includes services and is case insensitive', () => {
    expect(filterListings(fixtures, { query: 'b2b' }).map((x) => x.id)).toEqual(['c']);
  });
  test('unavailable temperature produces an empty result', () => {
    expect(filterListings(fixtures, { temperature: '냉동' })).toHaveLength(0);
  });
  test('province filter includes local regions', () => {
    const withProvince = [...fixtures, { ...fixtures[1], id: 'd', province: '경남' }];
    expect(filterListings(withProvince, { region: '경남' }).map((x) => x.id)).toEqual(['d']);
  });
  test('no filters returns every item', () => {
    expect(filterListings(fixtures)).toHaveLength(3);
  });
});

describe('toggleSelection', () => {
  test('comparison limits to three and removes selected item', () => {
    expect(toggleSelection(['a', 'b', 'c'], 'd')).toEqual(['a', 'b', 'c']);
    expect(toggleSelection(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggleSelection([], 'a')).toEqual(['a']);
  });
  test('comparison does not mutate source array', () => {
    const a = ['a'];
    toggleSelection(a, 'b');
    expect(a).toEqual(['a']);
  });
});

describe('sanitizeSelection', () => {
  test('drops unknown ids, duplicates and extras', () => {
    expect(sanitizeSelection(['x', 'a', 'a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd'])).toEqual(['a', 'b', 'c']);
  });
  test('non-array input becomes empty', () => {
    expect(sanitizeSelection({ a: 1 }, ['a'])).toEqual([]);
    expect(sanitizeSelection(null, ['a'])).toEqual([]);
  });
});

describe('validateInquiry', () => {
  const valid = { name: '테스트', company: '테스트 회사', phone: '010-1234-5678', item: '아직 모름', consent: true };
  test('unknown item and valid Korean phone are permitted', () => {
    expect(validateInquiry(valid)).toEqual({});
  });
  test('empty and whitespace-only contact fields are rejected', () => {
    const errors = validateInquiry({ ...valid, name: ' ', company: '', phone: '123', item: ' ' });
    expect(Object.keys(errors).sort()).toEqual(['company', 'item', 'name', 'phone']);
  });
  test('preparation-only acknowledgement is mandatory', () => {
    expect(validateInquiry({ ...valid, consent: false }).consent).toBeTruthy();
  });
  test('partnership does not require item at first contact', () => {
    expect(validateInquiry({ ...valid, item: '' }, true)).toEqual({});
  });
  test('phone accepts spaces and landline length, rejects non-zero prefix', () => {
    expect(validateInquiry({ ...valid, phone: '051 123 4567' }).phone).toBeUndefined();
    expect(validateInquiry({ ...valid, phone: '1012345678' }).phone).toBeDefined();
    expect(validateInquiry({ ...valid, phone: '010123456789' }).phone).toBeDefined();
  });
});
