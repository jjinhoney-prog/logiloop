import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function ComparisonDock({ count }: { count: number }) {
  return (
    <div className="comparison-dock">
      <span>
        <b>{count}</b>개 후보를 담았습니다
      </span>
      <Link className="button button-lime" href="/compare">
        비교함 보기
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
