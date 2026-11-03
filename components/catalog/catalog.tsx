'use client';

import { Select } from '@/components/ui/select';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CatalogCard, DemoNotice, Empty, PageHeading } from '@/components/ui';
import { isExampleListing } from '@/lib/data';
import { filterListings } from '@/lib/logic';
import type { Listing, ListingType } from '@/lib/types';
import { Filters, type FilterState } from './filters';
import { operationChecks, operationCoverage, warehouseRegions, warehouseRegionHref, type WarehouseRegion } from '@/lib/warehouse-regions';
import regionStyles from './region-guide.module.css';
import {useCompare} from '@/components/providers/compare-provider';
import PartnerRow from './partner-row';

type Sort = 'default' | 'name' | 'area' | 'checked';

const initialFilters: FilterState = { query: '', region: '전체 지역', temperature: '전체 온도', size: '전체 면적', service: '전체 작업', category: '전체 품목' };

export default function Catalog({ type, items, region, initial }: { type: ListingType; items: Listing[]; region?: WarehouseRegion; initial?: Partial<FilterState> }) {
  const [filters, setFilters] = useState<FilterState>({...initialFilters,...initial});
  const {selected} = useCompare();
  const [sort, setSort] = useState<Sort>('default');
  const warehouse = type === 'warehouse';
  const examplesOnly = items.length > 0 && items.every(isExampleListing);
  const serviceOptions = [...new Set(items.filter((item) => item.type === 'partner').flatMap((item) => item.service.split('·').map((service) => service.trim()).filter(Boolean)))].sort();
  const requestParams = new URLSearchParams({ situation: warehouse ? 'space' : 'outsource' });
  if (region) {
    requestParams.set('region', region.requestRegion);
    if (region.requestDetail) requestParams.set('regionDetail', region.requestDetail);
  }
  if (filters.region !== '전체 지역') requestParams.set('region', filters.region);
  if (filters.temperature !== '전체 온도') requestParams.set('temperature', filters.temperature);
  if (filters.size !== '전체 면적') requestParams.set('size', filters.size);
  if (filters.query.trim()) requestParams.set('query', filters.query.trim());
  if (filters.service !== '전체 작업') requestParams.set('service', filters.service);
  if(filters.category !== '전체 품목') requestParams.set('category',filters.category);
  if(!warehouse && selected.length)requestParams.set('candidates',selected.join(','));
  const requestHref = `${warehouse?'/consultation':'/quote/request'}?${requestParams.toString()}` as const;

  let results = filterListings(items, { ...filters, type });

  if (sort === 'area') results = [...results].sort((a, b) => (b.area || 0) - (a.area || 0));
  if (sort === 'checked') results = [...results].sort((a,b) => { const date=(item:Listing)=>Math.max(0,...(item.publicPartner?.centers??[]).map(c=>Date.parse(c.checkedAt??'')||0));return date(b)-date(a); });
  if (sort === 'name') results = [...results].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  function change(patch:Partial<FilterState>) {
    const next={...filters,...patch};setFilters(next);
    if(!warehouse){const params=new URLSearchParams();for(const [key,value] of Object.entries(next))if(value&&value!==initialFilters[key as keyof FilterState])params.set(key,value);window.history.replaceState(null,'',`${window.location.pathname}${params.size?'?'+params:''}`);}
  }
  function reset() {
    change(initialFilters);
    setSort('default');
  }

  return (
    <div className={warehouse ? "page" : "page partner-catalog"}>
      <PageHeading
        eyebrow={region ? '' : warehouse ? 'FIND YOUR SPACE' : ''}
        title={region?.title ?? (warehouse ? '창고·물류센터' : '물류사·3PL')}
        audience={warehouse ? '외부 창고나 새 물류거점이 필요한 제조·유통기업을 위해' : '보관·출고를 맡기거나 물류사를 변경하려는 화주를 위해'}
        description={region?.description ?? (warehouse ? '지역·면적·시설 조건을 살펴보고 비교함에 담으세요. 원하는 공간이 없으면 필요한 조건을 남겨주세요.' : '취급 품목·온도대·처리 규모·제공 작업을 살펴보세요. 내 물량의 실제 수용 가능 여부는 요청 후 확인합니다.')}
      >
        <Link className="button button-dark" href={requestHref}>
          이 조건으로 물류 요청하기
          <ArrowRight size={17} />
        </Link>
        <Link className="text-button" href="/compare">담은 후보 비교하기</Link>
      </PageHeading>
      {warehouse && (
        <nav className={regionStyles.navigation} aria-label="지역별 창고 임대">
          <Link href="/warehouses" aria-current={!region ? 'page' : undefined}>전체 지역</Link>
          {warehouseRegions.map((entry) => (
            <Link key={entry.slug} href={warehouseRegionHref(entry.slug)} aria-current={region?.slug === entry.slug ? 'page' : undefined}>{entry.name} 창고 임대</Link>
          ))}
        </nav>
      )}
      {region && (
        <details className={regionStyles.guide}>
          <summary>{region.name} 창고를 비교할 때 확인할 3가지</summary>
          <p>{region.focus}</p>
          {region.questions.map(([title, body]) => <div key={title}><h2>{title}</h2><p>{body}</p></div>)}
          <Link href={`/insights/${region.guideId}`}>{region.guideLabel}</Link>
        </details>
      )}
      {region && (() => { const cov = operationCoverage(items); return (
        <details className={regionStyles.guide}>
          <summary>{region.name} 후보 현장 확인 체크리스트 · 운영 관점</summary>
          <p>임대료와 면적이 같아도 운영 비용은 아래 항목에서 갈립니다. 상담 시 필요한 기준을 함께 알려주시면 후보별로 확인해 드립니다.</p>
          <ul className={regionStyles.checks}>{operationChecks.map(([title, body]) => <li key={title}><strong>{title}</strong><span>{body}</span></li>)}</ul>
          {cov.total > 0 && <p className={regionStyles.coverage}>현재 공개 매물 {cov.total}건 중 층고 표기 {cov.height}건 · 전력 표기 {cov.power}건 · 면적 표기 {cov.area}건. 표기되지 않은 항목은 현장 확인 대상입니다.</p>}
        </details>
      ); })()}
      <ol className="catalog-steps" aria-label="목록 이용 순서"><li>01 · 조건으로 찾기</li><li>02 · 비교함 담기</li><li>03 · 후보 검토 요청</li></ol>
      {!warehouse && <details className="catalog-explainer"><summary>3PL 이용 안내</summary><strong>3PL: 보관·입출고 등 물류업무를 외부 업체에 맡기는 방식</strong><p>공개된 운영 정보를 기준으로 살펴보는 목록입니다. 처리 가능량과 내 조건 수용 여부는 별도 확인합니다.</p></details>}
      <DemoNotice>
        {region ? '지음부동산 등록 매물입니다. 현재 공실·임대 조건·입주 가능일은 상담 시 다시 확인합니다.' : examplesOnly ? '현재 목록은 부울경 가상 예시입니다. 물류 요청은 전국 어디든 검토 가능합니다.' : '‘예시’ 표시가 없는 매물은 지음부동산 등록 매물입니다.'}
      </DemoNotice>
      <Filters warehouse={warehouse} fixedRegion={region?.name} value={filters} serviceOptions={serviceOptions} onChange={change} onReset={reset} />
      {!warehouse && <div className="tags" aria-label="선택한 검색 조건">{Object.entries(filters).filter(([key,value])=>value&&value!==initialFilters[key as keyof FilterState]).map(([key,value])=><button className="text-button" key={key} onClick={()=>change({[key]:initialFilters[key as keyof FilterState]})}>{value} 해제</button>)}</div>}
      <div className="results-bar">
        <p>
          전체 <strong>{results.length}</strong>개 {examplesOnly && <span>· 예시 데이터</span>}
        </p>
        <Select label="정렬" value={sort} onChange={(value) => setSort(value as Sort)} options={[{ value: 'default', label: '기본 순' }, { value: 'name', label: '이름 순' }, ...(!warehouse?[{value:'checked',label:'여유량 최근 확인 순'}]:[]), ...(warehouse ? [{ value: 'area', label: '면적 큰 순' }] : [])]} />
      </div>
      {results.length ? (
        <div className={warehouse ? "catalog-grid" : "partner-stack"}>
          {results.map((item) => (
            warehouse ? <CatalogCard key={item.id} item={item} /> : <PartnerRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Empty title={examplesOnly ? '현재 선택 조건에 등록된 예시 후보가 없습니다.' : '현재 선택 조건에 등록된 후보가 없습니다.'} description="해당 지역의 실제 공급 유무를 뜻하지 않습니다. 상담 준비서에 희망 지역과 조건을 남겨보세요.">
          <Link className="button button-dark" href={requestHref}>
            이 조건으로 후보 찾기 요청
          </Link>
          <button className="button button-outline" onClick={reset}>
            필터 초기화
          </button>
        </Empty>
      )}
      <div className="inline-help">
        <div>
          <strong>딱 맞는 조건이 보이지 않나요?</strong>
        </div>
        <Link href={requestHref}>
          요구조건 알려주기
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
