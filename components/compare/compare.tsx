'use client';

import Link from 'next/link';
import { ArrowRight, Info, Plus, X } from 'lucide-react';
import { useCompare } from '@/components/providers/compare-provider';
import { DemoNotice, Empty, PageHeading } from '@/components/ui';
import { findListing, listingHref } from '@/lib/data';
import type { Listing } from '@/lib/types';

const rows: [label: string, get: (item: Listing) => string][] = [
  ['유형', (i) => (i.type === 'warehouse' ? '직접 임차 후보' : '3PL 위탁 후보')],
  ['지역', (i) => i.district],
  ['온도대', (i) => i.temperature],
  ['공간·처리 규모', (i) => i.capacity],
  ['서비스', (i) => i.service],
  ['비용 조건', (i) => i.price],
  ['일정', (i) => i.available],
  ['검토할 화주', (i) => i.suitability],
  ['미확인 사항', (i) => i.limitation],
  ['화주 조건 수용 확인', () => '확인 대기'],
];

export default function Compare() {
  const { selected, toggle, clear, ready } = useCompare();
  const items = selected.map(findListing).filter((item): item is Listing => Boolean(item));

  return (
    <div className="page">
      <PageHeading eyebrow="COMPARE YOUR OPTIONS" title="후보 비교함" description="최대 3개 후보의 조건을 한눈에 살펴보세요.">
        <Link className="button button-outline" href="/warehouses">
          <Plus size={16} />
          후보 추가
        </Link>
      </PageHeading>
      <DemoNotice>예시 후보의 공개 조건 비교입니다. 담당자가 검토한 견적·제안서가 아닙니다.</DemoNotice>
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
        </Empty>
      ) : (
        <>
          <div className="results-bar">
            <p>
              <strong>{items.length}</strong> / 3개 후보 <span>· 이 브라우저에만 저장됩니다</span>
            </p>
            <button className="text-button" onClick={clear}>
              모두 비우기
            </button>
          </div>
          <div className="comparison-table-wrap">
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
                      <span className="chip">
                        {i.region} · {i.temperature}
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
            <Info size={22} />
            <div>
              <h3>다음 단계는 ‘같은 조건’의 견적 확인입니다.</h3>
              <p>품목·물량·온도·차량·입고일을 확인하고, 비용과 서비스의 포함·제외 항목을 맞춰 비교합니다. 미확인 비용은 0원으로 계산하지 않습니다.</p>
            </div>
            <Link className="button button-dark" href={`/consultation?tier=2&candidates=${items.map((i) => i.id).join(',')}`}>
              이 후보로 상담 준비
              <ArrowRight size={17} />
            </Link>
          </div>
        </>
      )}
      <section className="panel comparison-note">
        <h3>비교할 때 함께 확인합니다</h3>
        <div className="three-cols">
          <div>
            <b>01 · 필수조건</b>
            <p>온도, 취급 품목, 차량 접근, 입고일과 최소 처리 능력을 먼저 확인합니다.</p>
          </div>
          <div>
            <b>02 · 총비용</b>
            <p>운영비와 보증금·초기 자금을 구분하고 일회성 비용을 중복 계산하지 않습니다.</p>
          </div>
          <div>
            <b>03 · 전환 부담</b>
            <p>이전 일정, 인력·설비와 운영 공백까지 확인합니다.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
