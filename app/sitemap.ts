import type { MetadataRoute } from 'next';
import { articles, isExampleListing } from '@/lib/data';
import { getPublicListings } from '@/lib/listings';
import { isDbConfigured } from '@/lib/supabase';
import { warehouseRegions, warehouseRegionHref } from '@/lib/warehouse-regions';

// 공개 상태 변경을 반영하고, DB 미연결 시 예시 매물은 제출하지 않는다.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ['/', '/about', '/warehouses', '/partners', '/partnership', '/insights'];
  const listings = isDbConfigured() ? await getPublicListings() : [];
  return [
    ...paths,
    ...warehouseRegions.map((region) => warehouseRegionHref(region.slug)),
    ...articles.map((article) => `/insights/${article.id}`),
    ...listings.filter((listing) => !isExampleListing(listing)).map((listing) => `/${listing.type === 'warehouse' ? 'warehouses' : 'partners'}/${encodeURIComponent(listing.id)}`),
  ].map((path) => ({ url: `https://logiloop.co.kr${path}` }));
}
