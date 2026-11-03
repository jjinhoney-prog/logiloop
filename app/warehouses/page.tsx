import { pageMetadata } from '@/lib/page-metadata';
import Catalog from '@/components/catalog/catalog';
import { getPublicListings } from '@/lib/listings';

export const metadata = pageMetadata(
  '부산·경남 창고 임대·물류센터 찾기',
  '부산 강서구·김해·양산 등 창고·물류센터 등록 매물을 지역, 면적, 온도 조건으로 비교하세요. 임대 조건과 시설 정보를 확인하고 필요한 공간의 후보 상담을 요청하세요.',
  '/warehouses',
);

export const dynamic = 'force-dynamic';

export default async function Page() {
  return <Catalog type="warehouse" items={await getPublicListings('warehouse')} />;
}
