import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PageHeading } from '@/components/ui';
import { articles } from '@/lib/data';

export const metadata: Metadata = { title: '물류 가이드' };

export default function Page() {
  return (
    <div className="page">
      <PageHeading eyebrow="LOGISTICS, MADE CLEAR" title="물류 가이드" description="우리 회사의 다음 선택을 위한 조건과 질문을 정리했습니다." />
      <div className="guide-feature">
        <div>
          <span className="eyebrow">START HERE</span>
          <h2>
            빌릴까, 맡길까.
            <br />
            답보다 먼저 필요한 기준.
          </h2>
          <p>
            인력, 물량, 총비용과 전환 부담.
            <br />
            운영방식을 고르기 전 확인할 항목을 살펴보세요.
          </p>
          <Link className="button button-lime" href="/insights/lease-or-3pl">
            운영방식 가이드 읽기
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="guide-options">
          <span>
            01 <b>직접 임차</b>
          </span>
          <span>
            02 <b>3PL 위탁</b>
          </span>
          <span>
            03 <b>혼합 운영</b>
          </span>
        </div>
      </div>
      <div className="insight-grid">
        {articles.map((a, i) => (
          <Link className="insight-card" key={a.id} href={`/insights/${a.id}`}>
            <div className="insight-number">
              0{i + 1}
              <ArrowUpRight size={23} />
            </div>
            <span className="eyebrow">{a.category}</span>
            <h2>{a.title}</h2>
            <p>{a.description}</p>
            <div>
              {a.read} 읽기<span>가이드 보기 →</span>
            </div>
          </Link>
        ))}
      </div>
      <p className="muted small">로지루프 전략백서 v1.3 기반의 서비스 안내입니다. 개별 업체의 견적이나 현장 조건은 포함하지 않습니다.</p>
    </div>
  );
}
