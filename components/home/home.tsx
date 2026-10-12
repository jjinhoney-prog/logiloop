import Link from 'next/link';
import { ArrowLeftRight, ArrowRight, Search, Snowflake, Warehouse, type LucideIcon } from 'lucide-react';
import { ServicePreview } from './service-preview';

// 시안 logiloop-landing_261013 기준. 각 문제는 /consultation의 요청 상황(id)으로 이어진다.
const problems: { id: string; title: string; hint: string; icon: LucideIcon }[] = [
  { id: 'change', title: '물류사 변경', hint: '지금 운영사의 비용·품질·대응이 맞지 않을 때', icon: ArrowLeftRight },
  { id: 'outsource', title: '3PL 탐색', hint: '처음으로 물류를 맡길 운영사를 찾을 때', icon: Search },
  { id: 'space', title: '공간 확보', hint: '직접 운영할 창고·물류센터가 필요할 때', icon: Warehouse },
  { id: 'cold', title: '저온 운영', hint: '냉장·냉동 보관과 출고가 필요할 때', icon: Snowflake },
];

export default function Home() {
  return (
    <div className="page home-page home-focused">
      <section className="home-intro home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <div className="eyebrow"><span className="accent-line" />부산·경남 화주 물류 매칭</div>
          <h1 id="home-title">물류 조건만 남기세요.<br /><span>3PL과 창고는 저희가 찾습니다.</span></h1>
          <p>물량과 품목을 알려주시면 담당자가 조건을 정리하고 맞는 3PL과 창고 후보를 비교해 드립니다. 모르는 항목은 미정으로 두셔도 됩니다.</p>
          <div className="hero-actions">
            <Link className="button button-dark hero-consultation" data-funnel-placement="hero" href="/consultation">물류 요청하기<ArrowRight size={17} /></Link>
            <Link className="text-button" href="#comparison-preview">비교표 예시 보기</Link>
          </div>
        </div>

        <div className="problem-picker" role="group" aria-labelledby="problem-title">
          <h2 id="problem-title">어떤 문제를 풀어야 하나요?</h2>
          <div className="problem-options">
            {problems.map(({ id, title, hint, icon: Icon }) => (
              <Link className="problem-option" data-funnel-placement="situation" href={`/consultation?situation=${id}`} key={id}>
                <Icon size={22} aria-hidden="true" />
                <strong>{title}</strong>
                <span>{hint}</span>
              </Link>
            ))}
          </div>
          <div className="problem-more">
            <Link data-funnel-placement="situation" href="/consultation?situation=rent-review">지금 내는 창고 임차료 검토<ArrowRight size={14} /></Link>
            <Link data-funnel-placement="situation" href="/consultation?situation=unsure">어떤 방식이 맞는지 모르겠어요<ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      <ServicePreview compact />

      <section className="home-final-request">
        <h2>조건이 미정이어도 시작할 수 있습니다.</h2>
        <Link className="button button-dark" data-funnel-placement="bottom" href="/consultation">물류 요청하기<ArrowRight size={17} /></Link>
        <Link className="home-partner-link" href="/partnership">물류사·창고주이신가요? 파트너 참여</Link>
      </section>
    </div>
  );
}
