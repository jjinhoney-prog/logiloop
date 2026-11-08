import { pageMetadata } from '@/lib/page-metadata';
import Catalog from '@/components/catalog/catalog';
import { getPublicListings } from '@/lib/listings';

export const metadata = pageMetadata(
  '물류사·3PL 찾기 | 보관·입출고 위탁 비교',
  '보관·입출고·포장·배송 등 필요한 업무를 기준으로 물류사·3PL 후보를 검토하세요. 희망 지역과 물량, 온도 조건을 정리해 위탁 운영 상담을 요청할 수 있습니다.',
  '/partners',
);

export const dynamic = 'force-dynamic';

export default async function Page(props:PageProps<'/partners'>) {
  const params=await props.searchParams;
  const initial=Object.fromEntries(['query','region','temperature','service','category'].flatMap(key=>typeof params[key]==='string'?[[key,(params[key] as string).slice(0,100)]]:[]));
  return <><Catalog initial={initial} type="partner" items={await getPublicListings('partner')} /></>;
}
