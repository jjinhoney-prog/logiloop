'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCompare } from '@/components/providers/compare-provider';
import { CatalogCard, DemoNotice, Empty, PageHeading } from '@/components/ui';
import { listings } from '@/lib/data';
import { filterListings } from '@/lib/logic';
import type { ListingType } from '@/lib/types';
import { ComparisonDock } from './comparison-dock';
import { Filters, type FilterState } from './filters';

type Sort = 'default' | 'name' | 'area';

const initialFilters: FilterState = { query: '', region: '전체 지역', temperature: '전체 온도', size: '전체 면적' };

export default function Catalog({ type }: { type: ListingType }) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sort, setSort] = useState<Sort>('default');
  const { selected } = useCompare();
  const warehouse = type === 'warehouse';

  let results = filterListings(listings, { ...filters, type });
  if (sort === 'area') results = [...results].sort((a, b) => (b.area || 0) - (a.area || 0));
  if (sort === 'name') results = [...results].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  function reset() {
    setFilters(initialFilters);
    setSort('default');
  }

  return (
    <div className="page">
      <PageHeading
        eyebrow={warehouse ? 'FIND YOUR SPACE' : 'FIND YOUR PARTNER'}
        title={warehouse ? '창고·물류센터' : '물류사·3PL'}
        description={warehouse ? '전국 시·도에서 희망 지역을 고르고, 필요한 물류거점 조건을 살펴보세요.' : '품목과 온도, 필요한 서비스에 맞는 물류 파트너를 살펴보세요.'}
      >
        <Link className="button button-outline" href="/consultation">
          맞는 후보 추천받기
          <ArrowRight size={17} />
        </Link>
      </PageHeading>
      <DemoNotice>전국 지역 선택을 지원합니다. 현재 등록 자료는 부울경의 가상 예시이며, 다른 권역은 공급 자료 확보 후 등록합니다.</DemoNotice>
      <Filters warehouse={warehouse} value={filters} onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))} onReset={reset} />
      <div className="results-bar">
        <p>
          전체 <strong>{results.length}</strong>개 <span>· 예시 데이터</span>
        </p>
        <select aria-label="정렬" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="default">기본 순</option>
          <option value="name">이름 순</option>
          {warehouse && <option value="area">면적 큰 순</option>}
        </select>
      </div>
      {results.length ? (
        <div className="catalog-grid">
          {results.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Empty title="현재 선택 조건에 등록된 예시 후보가 없습니다." description="해당 지역의 실제 공급 유무를 뜻하지 않습니다. 상담 준비서에 희망 지역과 조건을 남겨보세요.">
          <Link className="button button-dark" href="/consultation">
            상담 준비하기
          </Link>
          <button className="button button-outline" onClick={reset}>
            필터 초기화
          </button>
        </Empty>
      )}
      <div className="inline-help">
        <div>
          <strong>딱 맞는 조건이 보이지 않나요?</strong>
          <p>아직 정해지지 않은 항목은 ‘모름’으로 시작할 수 있습니다.</p>
        </div>
        <Link href="/consultation">
          요구조건 알려주기
          <ArrowRight size={18} />
        </Link>
      </div>
      {selected.length > 0 && <ComparisonDock count={selected.length} />}
    </div>
  );
}
