'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useCompare } from '@/components/providers/compare-provider';
import { COMPARE_LIMIT } from '@/lib/logic';

/** 셸에서 모든 공개 화면에 띄운다. 홈·상세에서 담은 후보도 바로 비교함으로 이동할 수 있다. */
export function ComparisonDock() {
  const { selected } = useCompare();
  if (!selected.length) return null;
  const full = selected.length >= COMPARE_LIMIT;
  return (
    <div className="comparison-dock">
      <span>
        <b>{selected.length}</b>개 후보를 담았습니다
        <small>{full ? '최대 3개 · 가득 참' : `${COMPARE_LIMIT - selected.length}개 더 담을 수 있음`}</small>
      </span>
      <Link className="button button-lime" href="/compare">
        비교함 보기
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
