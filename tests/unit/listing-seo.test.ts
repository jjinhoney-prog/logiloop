import { describe, expect, test, vi } from 'vitest';
import { seedListings } from '@/lib/seed-listings';
import { listingMetadata } from '@/lib/listing-seo';

const { getPublicListings, isDbConfigured } = vi.hoisted(() => ({ getPublicListings: vi.fn(), isDbConfigured: vi.fn() }));
vi.mock('@/lib/listings', () => ({ getPublicListings }));
vi.mock('@/lib/supabase', () => ({ isDbConfigured }));
import sitemap from '@/app/sitemap';

describe('공개 검색 대상 구분', () => {
  test('가상 창고·파트너는 열람 가능해도 검색 색인을 허용하지 않는다', () => {
    for (const item of seedListings) {
      expect(listingMetadata(item).robots).toEqual({ index: false, follow: true });
      expect(listingMetadata(item).description).toContain('가상 예시');
    }
  });

  test('실제 등록 매물만 사이트맵에 포함하고 자신의 주소를 대표 주소로 사용한다', async () => {
    const real = { ...seedListings[0], id: 'zium-10001', sourceUrl: 'https://ziumrealty.com/item/view/10001' };
    isDbConfigured.mockReturnValue(true);
    getPublicListings.mockResolvedValue([...seedListings, real]);
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain('https://logiloop.co.kr/warehouses/zium-10001');
    for (const example of seedListings) expect(urls.some((url) => url.endsWith(`/${example.id}`))).toBe(false);
    expect(listingMetadata(real).alternates?.canonical).toBe('/warehouses/zium-10001');
    expect(listingMetadata(real).robots).toEqual({ index: true, follow: true });
  });

  test('DB 미연결 시 가상 매물을 사이트맵으로 제출하지 않는다', async () => {
    isDbConfigured.mockReturnValue(false);
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => /\/(warehouses|partners)\/[^/]+$/.test(url))).toBe(false);
    expect(urls).toContain('https://logiloop.co.kr/warehouses/regions/busan-gangseo');
  });
});
