import { pageMetadata } from '@/lib/page-metadata';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeading, Roles, SectionTitle } from '@/components/ui';
import { ServicePreview, ServiceSteps } from '@/components/home/service-preview';
import { tiers } from '@/lib/data';
import { costNotice, responseNotice } from '@/lib/service-content';

export const metadata = pageMetadata(
  '서비스 소개·운영 주체',
  '로지루프(LogiLoop)는 지음부동산중개법인이 운영하는 물류 콘텐츠·공급/수요 매칭 플랫폼입니다. 창고 임대·3PL 물류사 비교, 상담 절차와 운영 주체의 역할을 확인하세요.',
  '/about',
);

const faqs = [
  ['현재 임차료보다 낮은 조건을 찾을 수 있나요?', '현재 임차료·관리비와 면적·시설 조건을 기준으로 비용을 낮출 수 있는 후보를 검토합니다. 실제 절감 여부는 후보 견적, 이전비·원상복구비·추가 운송비를 확인한 뒤 안내합니다. 미확인 비용은 0원으로 계산하지 않으며 현재 창고 유지가 유리할 수도 있습니다.'],
  ['조건이 정해지지 않아도 요청할 수 있나요?', '품목·물량·지역·온도·시점은 미정으로 남길 수 있습니다. 회사명·담당자·연락처를 남겨주시면 필요한 조건부터 확인합니다.'],
  ['목록에 원하는 후보가 없으면 어떻게 하나요?', '희망 조건을 남겨주세요. 공개 목록 외 후보 탐색 가능 여부를 확인합니다. 등록 후보가 없다는 것이 해당 지역에 공급이 없다는 뜻은 아닙니다.'],
  ['비교함에 담으면 바로 견적을 받나요?', '비교함은 공개 조건을 모아 보는 기능입니다. 검토 요청 후 화주의 품목·물량·일정을 확인하고 수용 가능 여부와 견적을 검토합니다.'],
  ['비용과 일정은 언제 알 수 있나요?', `${costNotice} ${responseNotice}`],
  ['로지루프가 직접 물류를 운영하나요?', '로지루프는 요구조건 정리와 후보 비교·연결을 돕습니다. 물류 운영은 계약한 물류사가, 공간 제공은 임대인이 담당합니다.'],
];

export default function Page() {
  return <div className="page">
    <PageHeading eyebrow="로지루프 by 지음" title="조건 정리부터 후보 비교까지" audience="물류사 변경·창고 확보·운영방식을 검토하는 제조·유통기업을 위해" description="로지루프는 지음부동산중개법인이 운영하는 물류 콘텐츠·공급/수요 매칭 플랫폼입니다. 화주의 조건을 정리하고 공간과 물류사 후보를 검토합니다.">
      <Link className="button button-dark" href="/consultation">물류 요청하기<ArrowRight size={17} /></Link><Link className="text-button" href="/warehouses">공개 후보 살펴보기</Link>
    </PageHeading>
    <section className="landing-section"><SectionTitle title="요청하면 받는 것과 진행 과정" /><ServiceSteps /></section>
    <section className="landing-section"><SectionTitle title="필요한 업무 범위를 함께 정합니다" /><div className="three-cols about-tiers">{tiers.map((tier) => <div className="panel" key={tier.id}><span className="eyebrow">{tier.eyebrow}</span><h2>{tier.name}</h2><p>{tier.description}</p><strong>{tier.result}</strong><p>{tier.price}</p></div>)}</div></section>
    <ServicePreview />
    <section className="panel landing-section">
      <SectionTitle title="현재 임차료를 기준으로 비용 절감 대안 검토" />
      <p>전국 어디든 현재 창고의 임차 조건을 알려주세요. 필요한 면적·시설·입지 조건을 맞춰 더 낮은 비용의 후보를 검토합니다.</p>
      <div className="three-cols">
        <div><h3>01 · 현재 조건 확인</h3><p>월 임차료·관리비·VAT 기준을 확인하고 보증금은 별도로 구분합니다.</p></div>
        <div><h3>02 · 후보와 같은 기준으로 비교</h3><p>면적·온도·층고·차량 진입 등 필수조건을 충족하는지와 월 비용을 함께 확인합니다.</p></div>
        <div><h3>03 · 유지 또는 이전 검토</h3><p>이전비·원상복구비·운영 공백·추가 운송비를 반영해 검토합니다. 절감액은 실제 견적 확인 후 안내합니다.</p></div>
      </div>
      <div className="hero-actions"><Link className="button button-dark" href="/consultation?situation=rent-review">현재 임차료 비교 요청하기<ArrowRight size={17} /></Link></div>
    </section>
    <section className="panel landing-section"><SectionTitle title="누가 무엇을 담당하나요?" /><Roles /><p className="muted small">운영 주체: 지음부동산중개법인(주) · 공간 거래의 중개 업무는 지음부동산중개법인이 담당합니다.</p></section>
    <section className="panel landing-section"><SectionTitle title="대응 권역과 비용" /><div className="three-cols"><div><h3>전국 어디든 검토 가능</h3><p>전국 어느 지역이든 희망 지역과 필요한 조건을 알려주세요. 지역별 창고·물류사 후보를 검토합니다.</p></div><div><h3>복수 지역도 함께 검토</h3><p>여러 지역의 후보를 함께 살펴보고 입지·비용·운영 조건을 비교합니다. 후보별 최신 공급 조건과 수용 가능 여부는 별도로 확인합니다.</p></div><div><h3>업무 범위와 비용</h3><p>{costNotice} 후보 탐색·비교·전환 지원에서 필요한 범위를 협의합니다.</p></div></div></section>
    <section className="landing-section"><SectionTitle title="요청 전에 자주 묻는 질문" /><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    <div className="inline-help"><strong>조건이 미정이어도 시작할 수 있습니다.</strong><Link href="/consultation">물류 요청하기<ArrowRight size={17} /></Link></div>
  </div>;
}
