import Link from 'next/link';
import type { Metadata } from 'next';
import InquiryForm from '@/components/inquiry/inquiry-form';
import { getPublicListings } from '@/lib/listings';
import { parseConsultationParams, parseRequestContext } from '@/lib/search-params';
import { isDbConfigured } from '@/lib/supabase';

export const metadata: Metadata = { robots: { index: false, follow: true }, title: '물류 요청' };

export default async function Page(props: PageProps<'/consultation'>) {
  const params = await props.searchParams;
  const { tier, targets } = parseConsultationParams(params);
  const context = parseRequestContext(params);
  // 공개 매물만 후보로 인정한다. 비공개 ID가 URL에 있어도 이름이 드러나지 않는다.
  const catalog = targets.length ? await getPublicListings() : [];
  const targetItems = targets
    .map((id) => catalog.find((item) => item.id === id))
    .filter((item) => item !== undefined)
    .map(({ id, name }) => ({ id, name }));
  return <><div className="page"><Link href="/quote/request" className="button button-outline">물량·작업 조건을 입력해 3PL 견적 요청</Link></div><InquiryForm initialTier={context.tier ?? tier} initialContext={context} targetItems={targetItems} stored={isDbConfigured()} /></>;
}
