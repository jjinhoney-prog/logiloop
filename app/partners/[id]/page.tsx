import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Detail from '@/components/detail/detail';
import { listings } from '@/lib/data';

export const dynamicParams = false;

const find = (id: string) => listings.find((item) => item.id === id && item.type === 'partner');

export function generateStaticParams() {
  return listings.filter((item) => item.type === 'partner').map((item) => ({ id: item.id }));
}

export async function generateMetadata(props: PageProps<'/partners/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  return { title: find(id)?.name || '물류사 상세' };
}

export default async function Page(props: PageProps<'/partners/[id]'>) {
  const { id } = await props.params;
  const item = find(id);
  if (!item) notFound();
  return <Detail item={item} />;
}
