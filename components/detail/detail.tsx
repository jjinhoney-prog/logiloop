import OfficialPartnerPhotos from '@/components/catalog/official-partner-photos';
import {officialPartnerMedia} from '@/lib/official-partner-media';
import { operatingRegionLabel } from '@/lib/partner-regions';
import PartnerGallery from './partner-gallery';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleHelp, MapPin, Truck, Warehouse } from 'lucide-react';
import type { ReactNode } from 'react';
import { DemoNotice, PageHeading, SectionTitle, TempChip } from '@/components/ui';
import { capacityLabel, isExampleListing, temperatureTone } from '@/lib/data';
import type { Listing } from '@/lib/types';
import { warehouseReviewQuestions } from '@/lib/listing-seo';
import { warehouseRegions, matchesWarehouseRegion, warehouseRegionHref } from '@/lib/warehouse-regions';
import { DetailCompareButton } from './detail-compare-button';
import { LocationSection } from './location-section';

const checkLabels = ['공급자 입력', '서류 확인', '현장 확인', '해당 화주 조건 수용 확인'];

export default function Detail({ item }: { item: Listing }) {
  const warehouse = item.type === 'warehouse';
  const officialMedia = !warehouse ? officialPartnerMedia[item.id] : undefined;
  const logoOrPhoto = item.imageUrl || officialMedia?.logo.url;
  const example = isExampleListing(item);
  const region = warehouseRegions.find((entry) => matchesWarehouseRegion(item, entry));
  const Icon = warehouse ? Warehouse : Truck;
  const specs: [string, ReactNode][] = [
    [warehouse ? '소재 권역' : '운영 지역', !warehouse && item.operatingRegions?.length ? item.operatingRegions.map(operatingRegionLabel).join(' · ') : item.district],
    ['온도대', <TempChip key="temp" value={item.temperature} />],
    ['규모', item.area ? `${item.area.toLocaleString()}㎡ (${capacityLabel(item)})` : item.capacity],
    ...(warehouse ? [['층고', item.height || '확인 필요'], ['전력', item.power || '확인 필요']] as [string, ReactNode][] : []),
    ['비용', item.price],
    ['입주·수용 일정', item.available],
    ['제공 서비스', item.service],
  ];
  return (
    <div className={warehouse ? "page" : "page partner-detail"}>
      <Link className="back-link" href={region ? warehouseRegionHref(region.slug) : warehouse ? '/warehouses' : '/partners'}>
        <ArrowLeft size={16} />
        {region ? `${region.name} 창고 임대 목록` : '목록으로'}
      </Link>
      <div className={warehouse ? undefined : "partner-identity"}>
        {!warehouse && logoOrPhoto && <figure className="detail-photo detail-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoOrPhoto} alt={`${item.name} 로고`} referrerPolicy="no-referrer"/>
        </figure>}
      <PageHeading eyebrow={warehouse ? 'LOGISTICS SPACE' : ''} title={item.name} description={!warehouse && item.operatingRegions?.length ? item.operatingRegions.map(operatingRegionLabel).join(' · ') : item.district} />
      </div>
      <DemoNotice>
        {example ? '가상 예시 자료입니다. 실제 업체·공실·가격·수용 능력을 나타내지 않습니다.' : warehouse ? '지음부동산중개법인 등록 매물입니다. 임대 조건과 입주 가능일은 상담 시 다시 확인합니다.' : '업체 등록 정보를 기준으로 한 소개입니다. 실제 물량 수용 여부는 요청 후 확인합니다.'}
      </DemoNotice>
      <div className="detail-layout">
        <div>
          {warehouse && (logoOrPhoto ? (
            <figure className={warehouse ? "detail-photo" : "detail-photo detail-logo"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoOrPhoto} alt={`${item.name} ${warehouse ? '외관 사진' : '로고'}`} referrerPolicy="no-referrer" />
              <figcaption>{warehouse ? '지음부동산 등록 사진 · 현재 상태는 현장 확인 시 다시 봅니다.' : officialMedia ? '공식 홈페이지·블로그 회사 로고' : '업체가 등록한 회사 로고'}</figcaption>
            </figure>
          ) : (
          <div className={warehouse ? `detail-banner temp-${temperatureTone(item.temperature)}` : 'detail-banner detail-banner-partner'}>
            <Icon size={70} strokeWidth={1} />
            <div>
              <span>{warehouse ? 'SPACE PROFILE' : 'SERVICE PROFILE'}</span>
              <h2>
                {item.region} · {item.temperature}
              </h2>
              <p>{item.publicPartner?.photos?.length ? '현장·작업 사진은 아래 업체 제공 자료에서 확인하세요.' : '현장 사진은 실제 자료 확보 후 제공됩니다.'}</p>
            </div>
          </div>
          ))}
          <section className="panel">
            <SectionTitle title="기본 조건" />
            <dl className="spec-grid">
              {specs.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="tags">
              {item.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </section>
          {!warehouse && item.publicPartner && <section className="panel"><h2>업체 운영 조건</h2><p>취급 품목: {item.publicPartner.categories.join(' · ') || '확인 필요'}</p>{item.publicPartner.centers.map((c,i)=><div className="public-center" key={i}><h3>{c.province} {c.district}</h3><p>{c.temperatures.join(' · ')} / {c.services.join(' · ')}</p><dl className="spec-grid"><div><dt>보관 총능력</dt><dd>{c.total||'확인 필요'}</dd></div><div><dt>현재 여유량</dt><dd>{c.spare||'확인 필요'}</dd></div><div><dt>수용 시작</dt><dd>{c.availableAt||'협의 필요'}</dd></div><div><dt>확인 기준일</dt><dd>{c.checkedAt||'확인 필요'}</dd></div></dl></div>)}</section>}
          <LocationSection item={item} />
          <section className="panel">
            <SectionTitle title="확인 상태를 구분합니다" help={`기준일: ${example ? '예시 자료' : '지음부동산 등록 정보'} · 가용 조건은 제안 전에 다시 확인합니다. 현장 확인이 모든 서비스 품질을 보증하지 않습니다.`} />
            <div className="verification-list">
              {item.checks.map((check, i) => {
                const pending = !check || check.includes('대기') || check.includes('미확인');
                return (
                  <div key={check}>
                    <span className={pending ? 'check-pending' : 'check-example'}>{pending ? <CircleHelp size={17} /> : <Check size={17} />}</span>
                    <div>
                      <strong>{checkLabels[i]}</strong>
                      <p>{check || '확인 대기'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="panel">
            <SectionTitle title="검토할 조건" />
            <div className="reason-block">
              <span>{warehouse ? '적합성을 검토할 화주' : '회사 소개 · 검토 대상'}</span>
              <p>{item.suitability}</p>
            </div>
            <div className="reason-block caution">
              <span>확인이 필요한 사항</span>
              <p>{item.limitation}</p>
            </div>
            {warehouse && !example && (
              <div className="reason-block">
                <span>물류 운영 전 확인할 질문</span>
                <ul>
                  {warehouseReviewQuestions(item).map((question) => <li key={question}>{question}</li>)}
                </ul>
              </div>
            )}
          </section>
          {!warehouse && <PartnerGallery photos={item.publicPartner?.photos??[]}/>}
          {!warehouse && <OfficialPartnerPhotos id={item.id}/>}
        </div>
        <aside className="detail-contact">
          {warehouse && <div className="eyebrow">NEXT STEP</div>}
          <h2>
            이 후보가
            <br />
            우리 조건에 맞을까요?
          </h2>
          <p>품목·물량·일정에 대한 수용 여부를 확인한 뒤 후보와 견적을 연결합니다.</p>
          <Link className="button button-dark" href={warehouse ? `/consultation?tier=1&target=${item.id}` : `/quote/request?target=${item.id}`}>
            이 {warehouse ? '물건' : '업체'} 문의
            <ArrowRight size={16} />
          </Link>
          <Link className="button button-outline" href={warehouse ? `/consultation?tier=2&target=${item.id}` : `/quote/request?target=${item.id}`}>
            다른 후보까지 비교
          </Link>
          <DetailCompareButton id={item.id} />
          {item.sourceUrl && (
            <a className="button button-outline" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
              지음부동산 매물 상세
              <ArrowUpRight size={16} />
            </a>
          )}
          <hr />
          <p className="small">
            <MapPin size={15} />
            세부 위치와 실제 가용 조건은 담당자 확인이 필요합니다.
          </p>
        </aside>
      </div>
    </div>
  );
}
