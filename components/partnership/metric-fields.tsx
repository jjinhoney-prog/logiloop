'use client';
import { metricFields, returnHandlingOptions, type MetricKey } from '@/lib/partner-metrics';
import type { PartnerErrors, PartnerProfile } from '@/lib/partner-profile';

/** 출고 품질·보험·인력 지표. 모두 선택 입력이며 기준일을 함께 받는다. */
export function PartnerMetricFields({ profile, onChange, errors }: { profile: PartnerProfile; onChange: (p: PartnerProfile) => void; errors: PartnerErrors }) {
  const metrics = profile.metrics ?? {};
  const set = (key: MetricKey, value: string) => onChange({ ...profile, metrics: { ...metrics, [key]: value } });
  return <section className="partner-form-section" aria-labelledby="partner-metric-title">
    <h2 id="partner-metric-title">출고 품질·안정성 지표 · 선택</h2>
    <p className="muted small">화주에게 보내는 비교 리포트에 &lsquo;업체 제공&rsquo; 값으로 표시됩니다. 담당자가 자료를 확인하면 &lsquo;자료 확인&rsquo;으로 바뀝니다. 측정하지 않은 항목은 비워 두세요.</p>
    <div className="partner-grid">
      {metricFields.map(([key, label, type, placeholder]) => {
        const id = `partner-metrics.${key}`; const err = errors[`metrics.${key}`];
        const common = { id, value: metrics[key] ?? '', 'aria-invalid': Boolean(err), 'aria-describedby': err ? `${id}-error` : undefined };
        return <label className="form-field" key={key}>
          <span>{label}{type === 'percent' ? ' (%)' : ''}</span>
          {type === 'choice'
            ? <select {...common} onChange={e => set(key, e.target.value)}><option value="">선택하세요</option>{returnHandlingOptions.map(o => <option key={o}>{o}</option>)}</select>
            : <input {...common} type={type === 'date' ? 'date' : 'text'} inputMode={type === 'percent' ? 'decimal' : type === 'integer' ? 'numeric' : undefined} maxLength={200} placeholder={placeholder} onChange={e => set(key, e.target.value)} />}
          {err && <small className="field-error" id={`${id}-error`}>{err}</small>}
        </label>;
      })}
    </div>
  </section>;
}
