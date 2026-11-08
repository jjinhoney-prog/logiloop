import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { readPartner } from '@/lib/partner-store';
import { partnerListingDraft } from '@/lib/partner-listing';
import { getAdminListing } from '@/lib/listings';
import { ListingForm } from '@/components/admin/listing-form';
import { DemoNotice, PageHeading } from '@/components/ui';
import { requireAdmin } from '@/lib/auth';

export const metadata: Metadata = { title: '매물 등록' };

export default async function Page(props: PageProps<'/admin/listings/new'>) {
  await requireAdmin();
  const { partner } = await props.searchParams;
  let draft;
  if (partner !== undefined) {
    if (typeof partner !== 'string' || !/^[1-9]\d*$/.test(partner) || !Number.isSafeInteger(Number(partner))) notFound();
    const record = await readPartner(Number(partner));
    if (!record) notFound();
    if (record.doc.profile.disclosure !== '업체명·서비스 공개 희망') {
      return <div className="page admin-page"><PageHeading eyebrow="PARTNER" title="공개 범위 확인 필요" description="업체와 공개 범위를 협의한 뒤 3PL 업체 정보의 공개 희망 범위를 저장해 주세요." /></div>;
    }
    draft = partnerListingDraft(Number(partner), record.doc.profile);
    if (await getAdminListing(draft.id!)) redirect(`/admin/listings/${draft.id}`);
  }
  return (
    <div className="page admin-page">
      <PageHeading eyebrow="NEW LISTING" title="매물 등록" description="등록한 매물은 비공개로 저장됩니다. 확인을 마친 뒤 목록에서 공개로 바꿔 주세요." />
      <DemoNotice>오프마켓·비공개 의뢰 매물은 공개로 전환하지 마세요. 주소는 동·권역 단위까지만 입력합니다.</DemoNotice>
      {draft && <p className="muted">등록된 업체명·대표 운영 지역·서비스·온도대를 가져왔습니다. 공개 문구와 권역 대표 좌표를 확인한 뒤 저장하고, 매물 관리에서 공개로 전환하세요. 이후 업체 정보 보완 내용은 자동 반영되지 않습니다.</p>}
      <ListingForm draft={draft} />
    </div>
  );
}
