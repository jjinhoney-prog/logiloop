import { Select } from '@/components/ui/select';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { regions, sizes, temperatures } from '@/lib/data';

export interface FilterState {
  query: string;
  region: string;
  temperature: string;
  size: string;
}

export function Filters({
  warehouse,
  value,
  onChange,
  onReset,
}: {
  warehouse: boolean;
  value: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
}) {
  return (
    <div className="filter-panel">
      <div className="search-field">
        <Search size={19} />
        <input
          aria-label="지역, 시설 또는 서비스 검색"
          placeholder={warehouse ? '지역, 시설명, 필요한 설비를 검색하세요' : '지역, 업체명, 필요한 서비스를 검색하세요'}
          value={value.query}
          onChange={(e) => onChange({ query: e.target.value })}
        />
        {value.query && (
          <button aria-label="검색어 지우기" onClick={() => onChange({ query: '' })}>
            ×
          </button>
        )}
      </div>
      <div className="filter-row">
        <span className="filter-label">
          <SlidersHorizontal size={16} />
          상세 조건
        </span>
        <div className="select-field">
          <span>지역</span>
          <Select label="지역" value={value.region} onChange={(value) => onChange({ region: value })} options={regions} />
        </div>
        <div className="select-field">
          <span>온도</span>
          <Select label="온도" value={value.temperature} onChange={(value) => onChange({ temperature: value })} options={temperatures} />
        </div>
        {warehouse && (
          <div className="select-field">
            <span>면적</span>
            <Select label="면적" value={value.size} onChange={(value) => onChange({ size: value })} options={sizes} />
          </div>
        )}
        <button className="reset-button" onClick={onReset}>
          <RotateCcw size={15} />
          초기화
        </button>
      </div>
    </div>
  );
}
