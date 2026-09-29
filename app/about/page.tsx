import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeading, Roles, SectionTitle } from '@/components/ui';
import { tiers } from '@/lib/data';

export const metadata: Metadata = { title: '서비스·역할 안내' };

const steps = ['간편 신청', '담당자 진단 및 등급 판정', '요구조건 확인', '후보 선별·수용 여부·견적 확인', '등급별 결과물 제공', '실사·조건 협의·계약', '이전·초기 운영 진행 확인', '다음 검토 일정'];

export default function Page() {
  return (
    <div className="page">
      <PageHeading eyebrow="ABOUT LOGILOOP" title="필요한 만큼의 비교, 명확한 역할." description="로지루프는 전국 물류 네트워크 구축을 목표로, 화주의 지역별 거점 선택과 운영방식 비교를 돕는 플랫폼입니다." />
      <section className="about-statement">
        <span className="eyebrow">OUR PROMISE</span>
        <h2>
          물류사만 비교하고 싶으시면 그것만.
          <br />
          빌릴지 맡길지 고민이시면 그것까지.
        </h2>
        <p>요구조건은 한 번 정리하고, 후보의 적합성·가용 능력·비용·전환 부담을 함께 살펴봅니다. 권역별 파트너와 공급 자료를 확보하며 전국으로 범위를 넓혀갑니다.</p>
      </section>
      <SectionTitle title="필요한 깊이만큼 상담합니다" />
      <div className="three-cols about-tiers">
        {tiers.map((t) => (
          <div className="panel" key={t.id}>
            <span className="eyebrow">LEVEL 0{t.id}</span>
            <h2>{t.name}</h2>
            <p>{t.description}</p>
            <strong>{t.price}</strong>
            <p>{t.result}</p>
          </div>
        ))}
      </div>
      <section className="panel">
        <SectionTitle title="상담·비교·전환 지원 창구의 일원화" />
        <Roles />
      </section>
      <section className="panel">
        <SectionTitle title="진행 과정" />
        <div className="timeline">
          {steps.map((s, i) => (
            <div key={s}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              {s}
            </div>
          ))}
        </div>
        <p className="muted">일정과 비용은 업무 범위 확인 후 안내합니다. 비교 결과가 ‘지금 그대로가 낫다’일 수도 있습니다.</p>
      </section>
      <Link className="button button-dark" href="/consultation">
        필요한 도움 선택하기
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}
