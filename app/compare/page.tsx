import type { Metadata } from 'next';
import Compare from '@/components/compare/compare';
import { getPublicListings } from '@/lib/listings';

export const metadata: Metadata = { title: '후보 비교함' };

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <Compare catalog={await getPublicListings()} />;
}
