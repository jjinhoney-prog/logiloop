import type { Metadata } from 'next';
import InquiryForm from '@/components/inquiry/inquiry-form';
import { parseConsultationParams } from '@/lib/search-params';

export const metadata: Metadata = { title: '상담 신청' };

export default async function Page(props: PageProps<'/consultation'>) {
  const { tier, targets } = parseConsultationParams(await props.searchParams);
  return <InquiryForm initialTier={tier} targets={targets} />;
}
