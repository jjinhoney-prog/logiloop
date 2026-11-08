import type { Metadata } from 'next';
import InquiryForm from '@/components/inquiry/inquiry-form';
import { isDbConfigured } from '@/lib/supabase';
export const metadata: Metadata = { title: '창고·물류센터 임대 등록', robots: { index: false, follow: true } };
export const dynamic = 'force-dynamic';
export default function Page() {
  return <InquiryForm partnership stored={isDbConfigured()} initialContext={{ help: '창고·물류센터 임대 홍보' }} />;
}
