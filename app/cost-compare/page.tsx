import { pageMetadata } from '@/lib/page-metadata';
import { PageHeading } from '@/components/ui';
import { CostCompare } from '@/components/tools/cost-compare';

export const metadata = pageMetadata(
  '3PL 위탁·창고 임차 비용 비교',
  '3PL 위탁과 창고 임차·직접 운영 비용을 같은 기간으로 비교합니다. 보관비·작업비·임차료·인건비·초기비를 입력해 합계와 비용이 뒤바뀌는 시점을 확인하세요.',
  '/cost-compare',
);

export default function Page() {
  return <div className="page">
    <PageHeading eyebrow="비용 비교" title="3PL 위탁과 창고 임차, 같은 기간으로 비교합니다." description="받은 견적이나 현재 비용을 입력하세요. 모르는 항목은 비워두면 ‘확인 필요’로 표시합니다." />
    <CostCompare />
  </div>;
}
