import type { Metadata } from 'next';
import Catalog from '@/components/catalog/catalog';

export const metadata: Metadata = { title: '물류사·3PL' };

export default function Page() {
  return <Catalog type="partner" />;
}
