import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ListingForm } from '@/components/admin/listing-form';
import { DemoNotice, PageHeading } from '@/components/ui';
import { requireAdmin } from '@/lib/auth';
import { visibilityLabels } from '@/lib/data';
import { getAdminListing } from '@/lib/listings';
import { isDbConfigured } from '@/lib/supabase';

export const metadata: Metadata = { title: '매물 수정' };

export default async function Page(props: PageProps<'/admin/listings/[id]'>) {
  await requireAdmin();
  const { id } = await props.params;
  const item = isDbConfigured() ? await getAdminListing(id) : undefined;
  if (!item) notFound();
  return (
    <div className="page admin-page">
      <PageHeading eyebrow="EDIT LISTING" title={item.name} description={`현재 ${visibilityLabels[item.visibility]} 상태 · 노출 변경은 목록에서 합니다.`} />
      <DemoNotice>주소는 동·권역 단위까지만 입력합니다. 저장 즉시 공개 화면에 반영됩니다(공개 상태인 경우).</DemoNotice>
      <ListingForm initial={item} />
    </div>
  );
}
