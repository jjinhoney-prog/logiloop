'use client';

import { Check, Plus } from 'lucide-react';
import { useCompare } from '@/components/providers/compare-provider';

export function DetailCompareButton({ id }: { id: string }) {
  const { selected, toggle } = useCompare();
  const isSelected = selected.includes(id);
  return (
    <button className="text-button" onClick={() => toggle(id)}>
      {isSelected ? <Check size={16} /> : <Plus size={16} />}비교함 {isSelected ? '담김 · 해제' : '담기'}
    </button>
  );
}
