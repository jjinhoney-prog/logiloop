import type { Metadata } from 'next';
import { ListingForm } from '@/components/admin/listing-form';
import { DemoNotice, PageHeading } from '@/components/ui';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: '매물 등록' };

export default async function Page() {
  await requireAdmin();
  return (
    <div className="page admin-page">
      <PageHeading eyebrow="NEW LISTING" title="매물 등록" description="등록한 매물은 비공개로 저장됩니다. 확인을 마친 뒤 목록에서 공개로 바꿔 주세요." />
      <DemoNotice>오프마켓·비공개 의뢰 매물은 공개로 전환하지 마세요. 주소는 동·권역 단위까지만 입력합니다.</DemoNotice>
      <ListingForm />
    </div>
  );
}
