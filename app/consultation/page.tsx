import type { Metadata } from 'next';
import InquiryForm from '@/components/inquiry/inquiry-form';
import { getPublicListings } from '@/lib/listings';
import { parseConsultationParams } from '@/lib/search-params';
import { isDbConfigured } from '@/lib/supabase';

export const metadata: Metadata = { title: '상담 신청' };

export default async function Page(props: PageProps<'/consultation'>) {
  const { tier, targets } = parseConsultationParams(await props.searchParams);
  // 공개 매물만 후보로 인정한다. 비공개 ID가 URL에 있어도 이름이 드러나지 않는다.
  const catalog = targets.length ? await getPublicListings() : [];
  const targetItems = targets
    .map((id) => catalog.find((item) => item.id === id))
    .filter((item) => item !== undefined)
    .map(({ id, name }) => ({ id, name }));
  return <InquiryForm initialTier={tier} targetItems={targetItems} stored={isDbConfigured()} />;
}
