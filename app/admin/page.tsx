import type { Metadata } from 'next';
import Admin from '@/components/admin/admin';

export const metadata: Metadata = { title: '운영 워크스페이스 · 데모' };

export default function Page() {
  return <Admin />;
}
