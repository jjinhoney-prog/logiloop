'use client';

import { Check } from 'lucide-react';
import { useCompare } from '@/components/providers/compare-provider';

/** 카탈로그 카드의 ‘+ 비교’ 버튼. 카드 본문은 서버에서 렌더하고 이 버튼만 클라이언트에서 동작한다. */
export function CompareToggle({ id }: { id: string }) {
  const { selected, toggle } = useCompare();
  const isSelected = selected.includes(id);
  return (
    <button onClick={() => toggle(id)} className={isSelected ? 'compare-toggle selected' : 'compare-toggle'} aria-pressed={isSelected}>
      {isSelected ? <Check size={14} /> : '+'} 비교
    </button>
  );
}
