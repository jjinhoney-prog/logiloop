import type { Metadata } from 'next';
import Catalog from '@/components/catalog/catalog';

export const metadata: Metadata = { title: '창고·물류센터' };

export default function Page() {
  return <Catalog type="warehouse" />;
}
