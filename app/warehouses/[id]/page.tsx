import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Detail from '@/components/detail/detail';
import { listings } from '@/lib/data';

export const dynamicParams = false;

const find = (id: string) => listings.find((item) => item.id === id && item.type === 'warehouse');

export function generateStaticParams() {
  return listings.filter((item) => item.type === 'warehouse').map((item) => ({ id: item.id }));
}

export async function generateMetadata(props: PageProps<'/warehouses/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  return { title: find(id)?.name || '창고 상세' };
}

export default async function Page(props: PageProps<'/warehouses/[id]'>) {
  const { id } = await props.params;
  const item = find(id);
  if (!item) notFound();
  return <Detail item={item} />;
}
