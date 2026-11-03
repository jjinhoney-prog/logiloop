import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Catalog from '@/components/catalog/catalog';
import { getPublicListings } from '@/lib/listings';
import { findWarehouseRegion, matchesWarehouseRegion, warehouseRegionHref } from '@/lib/warehouse-regions';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/warehouses/regions/[region]'>): Promise<Metadata> {
  const region = findWarehouseRegion((await params).region);
  if (!region) notFound();
  return {
    title: region.title,
    description: region.description,
    alternates: { canonical: warehouseRegionHref(region.slug) },
    openGraph: { title: region.title, description: region.description, url: warehouseRegionHref(region.slug), type: 'website' },
  };
}

export default async function Page({ params }: PageProps<'/warehouses/regions/[region]'>) {
  const region = findWarehouseRegion((await params).region);
  if (!region) notFound();
  const items = (await getPublicListings('warehouse')).filter((item) => matchesWarehouseRegion(item, region));
  return <Catalog key={region.slug} type="warehouse" items={items} region={region} />;
}
