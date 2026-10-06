import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Detail from '@/components/detail/detail';
import { getPublicListing } from '@/lib/listings';

// 공개(published) 매물만 조회한다. 비공개·보관 매물은 URL을 직접 입력해도 404.
export const dynamic = 'force-dynamic';

const find = cache((id: string) => getPublicListing(id, 'warehouse'));

export async function generateMetadata(props: PageProps<'/warehouses/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  return { title: (await find(id))?.name || '창고 상세' };
}

export default async function Page(props: PageProps<'/warehouses/[id]'>) {
  const { id } = await props.params;
  const item = await find(id);
  if (!item) notFound();
  return <Detail item={item} />;
}
