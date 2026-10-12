import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { requestSituations } from '@/lib/service-content';
import { ServicePreview } from './service-preview';

const groups = [
  { title: '지금 비용을 줄이고 싶어요', hint: '임차료 · 물류사 비용 비교', situations: ['rent-review', 'change'] },
  { title: '새 창고·물류사가 필요해요', hint: '공간 확보 · 물류 위탁 · 저온 운영', situations: ['space', 'outsource', 'cold'] },
];

export default function Home() {
  return (
    <div className="page home-page home-focused">
      <section className="home-intro">
        <div>
          <div className="eyebrow"><span className="accent-line" />로지루프 by 지음</div>
          <h1>지금 내는 창고·물류비,<br /><span>비교해보셨나요?</span></h1>
          <p>현재 조건을 알려주시면, 창고·물류사 후보와 비용을 함께 검토합니다.</p>
          <div className="hero-actions">
            <Link className="button button-dark hero-consultation" data-funnel-placement="hero" href="/consultation">내 조건 비교 요청하기<ArrowRight size={17} /></Link>
            <Link className="text-button" href="#comparison-preview">비교표 예시 보기</Link>
          </div>
          <p className="hero-footnote">전국 어디든 검토 가능 · 모르는 조건은 미정으로</p>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="situations-title">
        <h2 id="situations-title" className="landing-title">어떤 도움이 필요하세요?</h2>
        <div className="home-choices">
          {groups.map((group) => (
            <details className="home-choice" name="home-needs" key={group.title}>
              <summary><strong>{group.title}</strong><span>{group.hint}</span><ChevronDown size={18} /></summary>
              <div className="choice-options">
                {group.situations.map((id) => {
                  const situation = requestSituations.find((item) => item.id === id)!;
                  return <Link data-funnel-placement="situation" href={`/consultation?situation=${id}`} key={id}>{situation.title}<ArrowRight size={15} /></Link>;
                })}
              </div>
            </details>
          ))}
          <Link className="home-choice home-choice-direct" data-funnel-placement="situation" href="/consultation?situation=unsure">
            <strong>어떤 방식이 맞는지 모르겠어요</strong><span>창고 임차와 물류 위탁부터 비교</span><ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <ServicePreview compact />

      <section className="home-final-request">
        <h2>조건이 미정이어도 시작할 수 있습니다.</h2>
        <Link className="button button-dark" data-funnel-placement="bottom" href="/consultation">내 조건 비교 요청하기<ArrowRight size={17} /></Link>
        <Link className="home-partner-link" href="/partnership">물류사·창고주이신가요? 파트너 참여</Link>
      </section>
    </div>
  );
}
