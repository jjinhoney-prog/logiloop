import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, MapPin, Search, SlidersHorizontal, Workflow } from 'lucide-react';
import { CatalogCard, DemoNotice, SectionTitle } from '@/components/ui';
import { articles, listings, tiers } from '@/lib/data';
import type { TierIcon } from '@/lib/types';

const icons: Record<TierIcon, typeof Search> = { Search, SlidersHorizontal, Workflow };

const nationalRegions = ['수도권', '강원권', '충청권', '호남권', '영남권', '제주권'];

const processSteps = [
  ['01', '간편 신청'],
  ['02', '요구조건 확인'],
  ['03', '후보·견적 확인'],
  ['04', '비교 결과 안내'],
];

export default function Home() {
  return (
    <div className="page home-page">
      <div className="home-intro">
        <div>
          <div className="eyebrow">
            <span className="accent-line" />
            전국 물류거점 상담 플랫폼
          </div>
          <h1>
            전국을 잇는 물류,
            <br />
            <span>조건부터 함께.</span>
          </h1>
          <p>
            물류사만 비교하실 수도, 창고를 빌릴지부터 보실 수도 있습니다.
            <br className="desktop-break" />
            원하는 지역과 조건을 정리하고, 우리 회사의 다음 거점을 준비하세요.
          </p>
        </div>
        <div className="coverage-panel national-coverage">
          <div className="coverage-heading">
            <MapPin size={16} />
            NATIONWIDE VISION
          </div>
          <h2>
            전국을 연결하는
            <br />
            물류 네트워크를 향해.
          </h2>
          <div className="national-regions">
            {nationalRegions.map((region) => (
              <span key={region}>{region}</span>
            ))}
          </div>
          <div className="coverage-caption">전국망 구축 목표 · 권역별 공급 확보 예정</div>
        </div>
      </div>

      <SectionTitle index="01" title="어떤 도움이 필요하신가요?" />
      <div className="tier-grid">
        {tiers.map((tier) => {
          const Icon = icons[tier.icon];
          return (
            <Link className={`tier-card tier-${tier.id}`} href={`/consultation?tier=${tier.id}`} key={tier.id}>
              <div className="tier-card-top">
                <span className="tier-icon">
                  <Icon size={24} />
                </span>
                <span className="tier-number">0{tier.id}</span>
              </div>
              <p className="tier-eyebrow">{tier.eyebrow}</p>
              <h2>
                {tier.name}
                <ArrowUpRight size={22} />
              </h2>
              <p className="tier-description">{tier.description}</p>
              <div className="tier-result">
                <Check size={14} />
                {tier.result}
              </div>
              <div className="tier-price">
                {tier.price}
                <ArrowRight size={18} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="process-strip">
        <strong>
          한 번의 조건 정리,
          <br />
          <span>필요한 만큼의 비교.</span>
        </strong>
        {processSteps.map(([n, title]) => (
          <div key={n}>
            <span>{n}</span>
            {title}
          </div>
        ))}
        <Link href="/about" aria-label="상담 과정 자세히 보기">
          <ArrowUpRight size={22} />
        </Link>
      </div>

      <SectionTitle index="02" title="다음 물류거점의 조건을 살펴보세요" href="/warehouses" />
      <DemoNotice>현재는 부울경의 가상 예시를 제공합니다. 전국 지역을 선택할 수 있으며, 권역별 공급 자료는 확보 후 등록합니다.</DemoNotice>
      <div className="catalog-grid home-catalog">
        {listings.slice(0, 3).map((item) => (
          <CatalogCard key={item.id} item={item} />
        ))}
      </div>

      <div className="home-bottom">
        <div>
          <SectionTitle index="03" title="결정 전에 읽어보세요" href="/insights" />
          <div className="article-list">
            {articles.slice(0, 2).map((article, i) => (
              <Link href={`/insights/${article.id}`} key={article.id}>
                <span className="article-index">0{i + 1}</span>
                <div>
                  <small>{article.category}</small>
                  <h3>{article.title}</h3>
                </div>
                <ArrowUpRight size={22} />
              </Link>
            ))}
          </div>
        </div>
        <div className="help-card">
          <span className="eyebrow">NOT SURE YET?</span>
          <h2>
            조건이 아직
            <br />
            정해지지 않아도 괜찮습니다.
          </h2>
          <p>품목과 대략적인 물량부터 시작해 보세요.</p>
          <Link href="/consultation">
            내 조건 정리하기
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
