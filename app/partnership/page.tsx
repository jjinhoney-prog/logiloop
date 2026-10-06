import type { Metadata } from 'next';
import InquiryForm from '@/components/inquiry/inquiry-form';
import { isDbConfigured } from '@/lib/supabase';

export const metadata: Metadata = { title: '파트너 참여' };

export const dynamic = 'force-dynamic';

export default function Page() {
  return <InquiryForm partnership stored={isDbConfigured()} />;
}
