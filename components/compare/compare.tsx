'use client';

import Link from 'next/link';
import { ArrowRight, Plus, X } from 'lucide-react';
import { useCompare } from '@/components/providers/compare-provider';
import type { ReactNode } from 'react';
import { DemoNotice, Empty, PageHeading, TempChip, TypeBadge } from '@/components/ui';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { capacityLabel, listingHref } from '@/lib/data';
import type { Listing } from '@/lib/types';

const commonRows: [label: string, get: (item: Listing) => ReactNode][] = [
  ['유형', (i) => <TypeBadge type={i.type} />],
  ['지역', (i) => i.district],
  ['온도대', (i) => <TempChip value={i.temperature} />],
  ['비용 조건', (i) => i.price],
  ['일정', (i) => i.available],
  ['검토할 화주', (i) => i.suitability],
  ['미확인 사항', (i) => i.limitation],
  ['화주 조건 수용 확인', () => '확인 대기'],
];

const NEXT_STEP_HELP =
  '필수조건(온도·품목·차량·입고일) → 총비용(운영비와 보증금 구분, 미확인 비용은 0원으로 계산하지 않음) → 전환 부담(이전 일정·인력·운영 공백) 순서로 확인합니다.';

export default function Compare({ catalog }: { catalog: Listing[] }) {
  const { selected, toggle, clear, ready } = useCompare();
  const items = selected.map((id) => catalog.find((item) => item.id === id)).filter((item): item is Listing => Boolean(item));

  const mixed = items.some((item) => item.type === 'warehouse') && items.some((item) => item.type === 'partner');
  const warehouseOnly = items.length > 0 && items.every((item) => item.type === 'warehouse');
  const specificRows: typeof commonRows = mixed ? [
    ['운영방식', (i) => i.type === 'warehouse' ? '공간 임차 · 직접 운영 검토' : '물류업무 위탁 검토'],
    ['공간·처리 규모', (i) => capacityLabel(i)],
    ['서비스·시설', (i) => i.service],
    ['직접 준비할 업무', (i) => i.type === 'warehouse' ? '운영 인력·장비·전산·입출고 관리' : '재고·주문 정보 제공, 위탁 범위 밖 업무'],
    ['함께 확인할 비용', (i) => i.type === 'warehouse' ? '임대료 외 인건비·장비·관리비 / 보증금 별도' : '보관·입출고·포장·반품·최소 이용료'],
  ] : warehouseOnly ? [
    ['면적·규모', (i) => capacityLabel(i)],
    ['층고', (i) => i.height || '확인 필요'],
    ['전력', (i) => i.power || '확인 필요'],
    ['시설·이용 조건', (i) => i.service],
  ] : [
    ['보관·처리 규모', (i) => capacityLabel(i)],
    ['작업 범위', (i) => i.service],
    ['취급 품목·작업 확인', (i) => i.tags.join(' · ') || '확인 필요'],
  ];
  const rows = [...commonRows.slice(0, 3), ...specificRows, ...commonRows.slice(3)];
  const requestHref = `/consultation?tier=${mixed ? 3 : 2}&candidates=${items.map((i) => i.id).join(',')}` as const;
  const requestLabel = mixed ? '운영방식 비교 요청하기' : items.length === 1 ? '이 후보 검토 요청하기' : '담은 후보 비교 요청하기';

  return (
    <div className={`page${items.length ? ' compare-with-action' : ''}`}>
      <PageHeading eyebrow="COMPARE YOUR OPTIONS" title="후보 비교함" audience="눈여겨본 공간·물류사의 차이를 확인하려는 화주를 위해" description="최대 3개 후보의 공개 조건을 비교합니다. 담은 후보 그대로 담당자에게 검토를 요청할 수 있습니다.">
        <Link className="button button-outline" href="/warehouses">
          <Plus size={16} />
          창고 후보 추가
        </Link>
        <Link className="text-button" href="/partners">물류사 후보 추가</Link>
      </PageHeading>
      {ready && items.length > 0 && <div className="compare-request-bar"><span>{items.length}개 후보 · {mixed ? '임차와 위탁 비교' : '선택 후보 검토'}</span><Link className="button button-dark" href={requestHref}>{requestLabel}<ArrowRight size={17} /></Link></div>}
      <DemoNotice>후보의 공개 조건 비교입니다. 담당자가 검토한 견적·제안서가 아닙니다.</DemoNotice>
      {!ready ? (
        <p role="status">비교함을 불러오는 중입니다.</p>
      ) : !items.length ? (
        <Empty title="비교할 후보를 담아보세요." description="창고·물류센터와 물류사에서 ‘+ 비교’를 누르면 여기에 모입니다.">
          <Link href="/warehouses" className="button button-dark">
            창고 살펴보기
            <ArrowRight size={16} />
          </Link>
          <Link href="/partners" className="button button-outline">
            물류사 살펴보기
          </Link>
          <Link className="text-button" href="/consultation?situation=unsure">후보 없이 조건부터 요청하기</Link>
        </Empty>
      ) : (
        <>
          {mixed && <div className="catalog-explainer"><strong>공간 임차와 물류업무 위탁을 함께 비교하고 있습니다.</strong><p>월세와 위탁 요금은 포함 범위가 다릅니다. 직접 수행할 업무·총비용·전환 부담을 함께 확인합니다.</p></div>}
          {items.length === 1 && <p className="muted small">후보 1개만으로도 수용 여부 검토를 요청할 수 있습니다. 다른 후보를 추가하면 차이를 함께 볼 수 있습니다.</p>}
          <div className="results-bar">
            <p>
              <strong>{items.length}</strong> / 3개 후보 <span>· 이 브라우저에만 저장됩니다</span>
            </p>
            <button className="text-button" onClick={clear}>
              모두 비우기
            </button>
          </div>
          <div className="comparison-table-wrap" tabIndex={0} role="region" aria-label="선택 후보 비교표, 좌우로 스크롤 가능">
            <table className="comparison-table">
              <caption className="sr-only">선택 후보의 공개 조건 비교</caption>
              <thead>
                <tr>
                  <th scope="col">비교 항목</th>
                  {items.map((i) => (
                    <th key={i.id} scope="col">
                      <button aria-label={`${i.name} 비교에서 제거`} className="remove-candidate" onClick={() => toggle(i.id)}>
                        <X size={17} />
                      </button>
                      <span className="compare-head-chips">
                        <span className="chip">{i.region}</span>
                        <TempChip value={i.temperature} />
                      </span>
                      <h3>{i.name}</h3>
                      <Link href={listingHref(i)}>
                        상세 보기
                        <ArrowRight size={14} />
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, get]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    {items.map((i) => (
                      <td key={i.id}>{get(i)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="comparison-summary">
            <div className="comparison-summary-title">
              <h3>다음 단계: 같은 조건으로 견적 확인</h3>
              <InfoTooltip label="견적 확인 기준" text={NEXT_STEP_HELP} />
            </div>
            <Link className="button button-dark" href={requestHref}>
              {requestLabel}
              <ArrowRight size={17} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
