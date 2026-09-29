import type { Metadata } from 'next';
import Compare from '@/components/compare/compare';

export const metadata: Metadata = { title: '후보 비교함' };

export default function Page() {
  return <Compare />;
}
