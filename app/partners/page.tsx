import type { Metadata } from 'next';
import Catalog from '@/components/catalog/catalog';
import { getPublicListings } from '@/lib/listings';

export const metadata: Metadata = { title: '물류사·3PL' };

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <Catalog type="partner" items={await getPublicListings('partner')} />;
}
