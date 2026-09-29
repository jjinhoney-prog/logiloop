import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, CircleHelp, MapPin, Truck, Warehouse } from 'lucide-react';
import { DemoNotice, PageHeading, SectionTitle } from '@/components/ui';
import type { Listing } from '@/lib/types';
import { DetailCompareButton } from './detail-compare-button';
import { LocationSection } from './location-section';

const checkLabels = ['공급자 입력', '서류 확인', '현장 확인', '해당 화주 조건 수용 확인'];

export default function Detail({ item }: { item: Listing }) {
  const warehouse = item.type === 'warehouse';
  const Icon = warehouse ? Warehouse : Truck;
  const specs = [
    ['소재 권역', item.district],
    ['온도대', item.temperature],
    ['규모', item.area ? `${item.area.toLocaleString()}㎡ (${item.capacity})` : item.capacity],
    ['비용', item.price],
    ['입주·수용 일정', item.available],
    ['제공 서비스', item.service],
  ];
  return (
    <div className="page">
      <Link className="back-link" href={warehouse ? '/warehouses' : '/partners'}>
        <ArrowLeft size={16} />
        목록으로
      </Link>
      <PageHeading eyebrow={warehouse ? 'LOGISTICS SPACE' : 'LOGISTICS PARTNER'} title={item.name} description={item.district} />
      <DemoNotice>가상 예시 자료입니다. 실제 업체·공실·가격·수용 능력을 나타내지 않습니다.</DemoNotice>
      <div className="detail-layout">
        <div>
          <div className={warehouse ? 'detail-banner' : 'detail-banner detail-banner-partner'}>
            <Icon size={70} strokeWidth={1} />
            <div>
              <span>{warehouse ? 'SPACE PROFILE' : 'SERVICE PROFILE'}</span>
              <h2>
                {item.region} · {item.temperature}
              </h2>
              <p>현장 사진은 실제 자료 확보 후 제공됩니다.</p>
            </div>
          </div>
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
          <LocationSection item={item} />
          <section className="panel">
            <SectionTitle title="확인 상태를 구분합니다" />
            <div className="verification-list">
              {item.checks.map((check, i) => {
                const pending = check.includes('대기');
                return (
                  <div key={check}>
                    <span className={pending ? 'check-pending' : 'check-example'}>{pending ? <CircleHelp size={17} /> : <Check size={17} />}</span>
                    <div>
                      <strong>{checkLabels[i]}</strong>
                      <p>{check}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="muted small">기준일: 예시 자료 · 가용 조건은 제안 전에 다시 확인합니다. 현장 확인이 모든 서비스 품질을 보증하지 않습니다.</p>
          </section>
          <section className="panel">
            <SectionTitle title="검토할 조건" />
            <div className="reason-block">
              <span>적합성을 검토할 화주</span>
              <p>{item.suitability}</p>
            </div>
            <div className="reason-block caution">
              <span>확인이 필요한 사항</span>
              <p>{item.limitation}</p>
            </div>
          </section>
        </div>
        <aside className="detail-contact">
          <div className="eyebrow">NEXT STEP</div>
          <h2>
            이 후보가
            <br />
            우리 조건에 맞을까요?
          </h2>
          <p>품목·물량·일정에 대한 수용 여부를 확인한 뒤 후보와 견적을 연결합니다.</p>
          <Link className="button button-dark" href={`/consultation?tier=1&target=${item.id}`}>
            이 {warehouse ? '물건' : '업체'} 문의
            <ArrowRight size={16} />
          </Link>
          <Link className="button button-outline" href={`/consultation?tier=2&target=${item.id}`}>
            다른 후보까지 비교
          </Link>
          <DetailCompareButton id={item.id} />
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
