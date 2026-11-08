import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { pageMetadata } from '@/lib/page-metadata';
import { PageHeading, SectionTitle } from '@/components/ui';
import { ServiceSteps } from '@/components/home/service-preview';
import { RenewalChecklist } from '@/components/tools/renewal-checklist';
import { renewalServiceParam } from '@/lib/renewal-checklist';
import { responseCommitment } from '@/lib/service-content';

export const metadata = pageMetadata(
  '2027 물류 계약 갱신 점검',
  '3PL 위탁·창고 임차 계약 만료를 앞둔 기업을 위한 갱신 점검표입니다. 통지 기한, 비용 항목, 운영 이슈, 대안 비교까지 12개 항목을 확인하세요.',
  '/contract-renewal',
);

const situations = [
  { title: '3PL 계약이 만료됩니다', description: '단가와 서비스 조건을 같은 기준으로 다른 후보와 비교합니다.', cta: '물류사 비교 요청', href: `/consultation?situation=change&service=${renewalServiceParam}` },
  { title: '창고 임차 계약이 만료됩니다', description: '현재 임차 조건을 기준으로 재계약과 이전을 비교합니다.', cta: '임차 조건 비교 요청', href: `/consultation?situation=rent-review&service=${renewalServiceParam}` },
  { title: '운영 방식부터 다시 봅니다', description: '위탁과 임차 중 내년 물량에 맞는 방식을 검토합니다.', cta: '운영 방식 검토 요청', href: `/consultation?situation=contract&service=${renewalServiceParam}` },
] as const;

export default function Page() {
  return <div className="page renewal-page">
    <PageHeading eyebrow="2027 계약 갱신 점검" title="2027년 물류 계약, 갱신 전에 점검하세요." audience="3PL 위탁·창고 임차 계약 만료를 앞둔 제조·유통기업을 위해" description="재계약 여부를 정하기 전에 통지 기한, 실제 비용, 운영 이슈, 대안을 확인합니다." />

    <section className="landing-section"><SectionTitle title="점검표 12개 항목" /><RenewalChecklist />
      <p className="renewal-tool-link">위탁과 임차 비용이 궁금하다면 <Link href="/cost-compare">비용 비교 도구</Link>로 먼저 계산해 보세요.</p>
    </section>

    <section className="landing-section"><SectionTitle title="확인되지 않은 항목은 함께 정리합니다" />
      <div className="three-cols">{situations.map((item) => <div className="panel renewal-option" key={item.title}><h3>{item.title}</h3><p>{item.description}</p><Link className="button button-dark" href={item.href}>{item.cta}<ArrowRight size={17} /></Link></div>)}</div>
      <p className="renewal-note">접수 후 {responseCommitment} · 비용은 업무 범위 확인 후 안내합니다. 계약 해석이 필요한 사항은 법률 전문가 검토가 필요합니다.</p>
    </section>

    <section className="landing-section"><SectionTitle title="요청 후 진행 과정" /><ServiceSteps /></section>
  </div>;
}
