import type { Metadata } from 'next';
import Catalog from '@/components/catalog/catalog';
import { getPublicListings } from '@/lib/listings';

export const metadata: Metadata = { title: '창고·물류센터' };

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <Catalog type="warehouse" items={await getPublicListings('warehouse')} />;
}
