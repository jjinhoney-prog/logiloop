import type { Metadata } from 'next';
import Admin, { type AdminTab } from '@/components/admin/admin';
import { requireAdmin } from '@/lib/auth';
import { getInquiries } from '@/lib/inquiries';
import { getAdminListings } from '@/lib/listings';
import { isDbConfigured } from '@/lib/supabase';

export const metadata: Metadata = { title: '운영 워크스페이스' };

export default async function Page(props: PageProps<'/admin'>) {
  await requireAdmin();
  const { tab } = await props.searchParams;
  const initialTab: AdminTab = tab === 'listings' ? 'listings' : 'inquiries';
  if (!isDbConfigured()) return <Admin dbReady={false} inquiries={[]} listings={[]} initialTab={initialTab} />;
  const [inquiries, listings] = await Promise.all([getInquiries(), getAdminListings()]);
  return <Admin dbReady inquiries={inquiries} listings={listings} initialTab={initialTab} />;
}
