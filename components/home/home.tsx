import Link from 'next/link';
import { ArrowRight, Truck, Warehouse, type LucideIcon } from 'lucide-react';
import { costNotice, responseNotice } from '@/lib/service-content';
import { ServicePreview, ServiceSteps } from './service-preview';
import { HomeMotion } from './home-motion';

const purposes: { id: string; title: string; hint: string; icon: LucideIcon }[] = [
  { id: 'outsource', title: '물류를 맡길 곳이 필요해요', hint: '보관·입출고를 맡길 물류사 찾기', icon: Truck },
  { id: 'space', title: '직접 사용할 창고가 필요해요', hint: '지역·면적·시설에 맞는 공간 찾기', icon: Warehouse },
];

const faqs = [
  ['조건이 정해지지 않아도 요청할 수 있나요?', '네. 품목·물량·지역·온도·시점은 미정으로 남길 수 있습니다. 회사명·담당자·연락처를 남겨주시면 필요한 조건부터 확인합니다.'],
  ['전국 어느 지역이든 요청할 수 있나요?', '네. 희망 지역을 알려주시면 창고·물류사 후보를 검토합니다. 여러 지역을 함께 검토할 수 있으며, 후보별 최신 조건과 수용 가능 여부는 별도로 확인합니다.'],
  ['요청 후 진행과 비용은 어떻게 되나요?', `${responseNotice} ${costNotice}`],
];

export default function Home() {
  return (
    <HomeMotion><div className="page home-page home-focused">
      <section className="home-intro home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <div className="eyebrow"><span className="accent-line" />전국 물류사·창고 매칭 · 로지루프 by 지음</div>
          <h1 id="home-title">우리 회사에 맞는<br /><span>물류사와 창고를 찾으세요.</span></h1>
          <p>물류를 맡길 운영사가 필요한가요, 직접 사용할 창고가 필요한가요? 로지루프 담당자가 조건을 정리하고, 후보별 비용과 운영 조건을 비교해 드립니다.</p>
          <div className="hero-actions">
            <Link className="button button-dark hero-consultation" data-funnel-placement="hero" href="/consultation">물류사·창고 찾기 요청<ArrowRight size={17} /></Link>
            <Link className="text-button" href="#comparison-preview">후보 비교표 예시 보기</Link>
          </div>
          <p className="home-request-note">정해지지 않은 조건은 미정으로 남겨도 됩니다.</p>
          <div className="hero-partner-entry">
            <span>3PL·물류사를 운영하시나요?</span>
            <Link href="/partnership">3PL 업체 등록<ArrowRight size={15} /></Link>
          </div>
        </div>

        <div className="problem-picker" role="group" aria-labelledby="problem-title">
          <h2 id="problem-title">지금 필요한 것은 무엇인가요?</h2>
          <div className="problem-options">
            {purposes.map(({ id, title, hint, icon: Icon }) => (
              <Link className="problem-option" data-funnel-placement="situation" href={`/consultation?situation=${id}`} key={id}>
                <Icon size={22} aria-hidden="true" />
                <strong>{title}</strong>
                <span>{hint}</span>
              </Link>
            ))}
          </div>
          <div className="problem-more">
            <Link data-funnel-placement="situation" href="/consultation?situation=unsure">어떤 방식이 맞는지 모르겠어요<ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      <section className="home-results" aria-labelledby="results-title">
        <h2 id="results-title">요청한 조건이, 선택할 수 있는 비교표가 됩니다.</h2>
        <ServiceSteps />
      </section>

      <ServicePreview compact />

      <section className="home-trust" aria-labelledby="trust-title">
        <div>
          <h2 id="trust-title">지음의 담당자가 검토하고 연결합니다.</h2>
          <p>로지루프는 지음부동산중개법인이 운영하는 물류 매칭 서비스입니다. 담당자가 요구조건을 정리하고 후보별 확인 사항을 비교해 드립니다.</p>
          <Link className="text-button" href="/about">서비스 범위 자세히 보기<ArrowRight size={15} /></Link>
        </div>
        <dl className="home-roles">
          <div><dt>조건 정리·후보 비교</dt><dd>로지루프</dd></div>
          <div><dt>공간 거래 중개</dt><dd>지음부동산중개법인</dd></div>
          <div><dt>물류 운영·공간 제공</dt><dd>계약한 물류사·임대인</dd></div>
        </dl>
      </section>

      <section className="home-faq" aria-labelledby="faq-title">
        <h2 id="faq-title">요청 전에 확인하세요.</h2>
        <div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="home-final-request">
        <h2>지역과 조건을 알려주세요.<br />맞는 후보를 찾는 일부터 함께합니다.</h2>
        <p>전국 어디든 요청 가능 · 미정인 조건은 담당자와 정리</p>
        <Link className="button button-dark" data-funnel-placement="bottom" href="/consultation">물류사·창고 찾기 요청<ArrowRight size={17} /></Link>
      </section>

      <section className="home-supplier" aria-labelledby="supplier-title">
        <div>
          <h2 id="supplier-title">물류사·창고주이신가요?</h2>
          <p>시설과 서비스를 등록하고 조건이 맞는 화주 요청을 받아보세요. 전국 파트너의 참여를 받으며, 공개 범위는 등록 전에 협의합니다.</p>
        </div>
        <Link className="button button-yellow" href="/partnership">3PL·창고 파트너 등록<ArrowRight size={17} /></Link>
      </section>
    </div></HomeMotion>
  );
}
