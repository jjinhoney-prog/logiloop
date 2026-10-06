import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { isExampleListing } from '@/lib/data';
import { parseListingForm } from '@/lib/listing-form';
import { sanitizeSelection } from '@/lib/logic';
import { checkPassword, createSessionToken, SESSION_MAX_AGE_SECONDS, verifySessionToken } from '@/lib/session';

const SECRET = 'test-session-secret-0123456789abcdef';
const NOW = Date.UTC(2026, 9, 6, 3, 0, 0);

describe('admin session', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_PASSWORD', 'correct horse');
    vi.stubEnv('SESSION_SECRET', SECRET);
  });
  afterEach(() => vi.unstubAllEnvs());

  test('password check is exact', () => {
    expect(checkPassword('correct horse')).toBe(true);
    expect(checkPassword('correct horse ')).toBe(false);
    expect(checkPassword('')).toBe(false);
  });

  test('a fresh token verifies until it expires', () => {
    const token = createSessionToken(NOW);
    expect(verifySessionToken(token, NOW + 1000)).toBe(true);
    expect(verifySessionToken(token, NOW + SESSION_MAX_AGE_SECONDS * 1000 + 1)).toBe(false);
  });

  test('tampered or malformed tokens are rejected', () => {
    const token = createSessionToken(NOW);
    const [expires, signature] = token.split('.');
    expect(verifySessionToken(`${Number(expires) + 99999999}.${signature}`, NOW)).toBe(false);
    expect(verifySessionToken(`${expires}.${signature}x`, NOW)).toBe(false);
    expect(verifySessionToken(`${token}.extra`, NOW)).toBe(false);
    expect(verifySessionToken('', NOW)).toBe(false);
  });

  test('changing the password or the secret signs everyone out', () => {
    const token = createSessionToken(NOW);
    vi.stubEnv('ADMIN_PASSWORD', 'new password');
    expect(verifySessionToken(token, NOW)).toBe(false);
    vi.stubEnv('ADMIN_PASSWORD', 'correct horse');
    vi.stubEnv('SESSION_SECRET', `${SECRET}-rotated`);
    expect(verifySessionToken(token, NOW)).toBe(false);
  });

  test('a short secret or missing password disables sessions', () => {
    const token = createSessionToken(NOW);
    vi.stubEnv('SESSION_SECRET', 'short');
    expect(verifySessionToken(token, NOW)).toBe(false);
    vi.stubEnv('SESSION_SECRET', SECRET);
    vi.stubEnv('ADMIN_PASSWORD', '');
    expect(checkPassword('')).toBe(false);
    expect(verifySessionToken(token, NOW)).toBe(false);
  });
});

function form(values: Record<string, string>) {
  const data = new FormData();
  const base: Record<string, string> = {
    id: 'gimhae-02',
    type: 'warehouse',
    name: '김해 진례 상온 창고',
    region: '김해',
    province: '경남',
    district: '진례면 · 제조 거점',
    temperature: '상온',
    area: '1,320',
    capacity: '약 400평',
    tags: '도크, 마당, 도크, ',
    lat: '35.24',
    lng: '128.75',
  };
  for (const [key, value] of Object.entries({ ...base, ...values })) data.set(key, value);
  return data;
}

describe('listing form', () => {
  test('valid input is normalised', () => {
    const { value, errors } = parseListingForm(form({}), { requireId: true });
    expect(errors).toEqual({});
    expect(value.area).toBe(1320);
    expect(value.tags).toEqual(['도크', '마당']);
    expect(value.checks).toEqual(['확인 대기', '확인 대기', '확인 대기', '확인 대기']);
    expect(value.price).toBe('조건 협의');
  });

  test('required fields, id format and coordinates are validated', () => {
    const { errors } = parseListingForm(form({ id: 'Busan 02', name: ' ', lat: '0', lng: 'abc', temperature: '영하' }), { requireId: true });
    expect(Object.keys(errors).sort()).toEqual(['id', 'lat', 'lng', 'name', 'temperature']);
  });

  test('id is not required when editing', () => {
    expect(parseListingForm(form({ id: '' }), { requireId: false }).errors).toEqual({});
  });

  test('detailed street addresses are refused to protect off-market listings', () => {
    expect(parseListingForm(form({ district: '녹산동 1234번지' }), { requireId: true }).errors.district).toContain('동·권역 단위');
    expect(parseListingForm(form({ name: '녹산산단321로 45 창고' }), { requireId: true }).errors.name).toBeDefined();
    expect(parseListingForm(form({ limitation: '진입로 2곳, 램프 1개' }), { requireId: true }).errors).toEqual({});
  });

  test('source url accepts only Zium listing pages and marks the listing as real', () => {
    expect(parseListingForm(form({ sourceUrl: 'https://ziumrealty.com/item/view/10967' }), { requireId: true }).value.sourceUrl).toBe('https://ziumrealty.com/item/view/10967');
    expect(parseListingForm(form({ sourceUrl: 'https://competitor.example/item/1' }), { requireId: true }).errors.sourceUrl).toBeDefined();
    expect(parseListingForm(form({ sourceUrl: 'javascript:alert(1)' }), { requireId: true }).errors.sourceUrl).toBeDefined();
    expect(isExampleListing({ sourceUrl: undefined })).toBe(true);
    expect(isExampleListing({ sourceUrl: 'https://ziumrealty.com/item/view/1' })).toBe(false);
  });

  test('“확인 필요” is an allowed temperature', () => {
    expect(parseListingForm(form({ temperature: '확인 필요' }), { requireId: true }).errors).toEqual({});
  });

  test('partners drop warehouse-only fields', () => {
    const { value } = parseListingForm(form({ type: 'partner', height: '9m' }), { requireId: true });
    expect(value.area).toBeUndefined();
    expect(value.height).toBeUndefined();
  });
});

describe('comparison ids before the catalog loads', () => {
  test('only well-formed ids survive', () => {
    expect(sanitizeSelection(['busan-01', '<script>', 'busan-01', 3, 'a'], null)).toEqual(['busan-01']);
  });
});
