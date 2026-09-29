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
        <label className="select-field">
          <span>지역</span>
          <select value={value.region} onChange={(e) => onChange({ region: e.target.value })}>
            {regions.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="select-field">
          <span>온도</span>
          <select value={value.temperature} onChange={(e) => onChange({ temperature: e.target.value })}>
            {temperatures.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        {warehouse && (
          <label className="select-field">
            <span>면적</span>
            <select value={value.size} onChange={(e) => onChange({ size: e.target.value })}>
              {sizes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        )}
        <button className="reset-button" onClick={onReset}>
          <RotateCcw size={15} />
          초기화
        </button>
      </div>
    </div>
  );
}
