'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  cleanCostInput, compareCosts, defaultPeriod, formatManwon, leaseMonthlyFields, leaseOnceFields, outsourceMonthlyFields, outsourceOnceFields,
  parseCostInput, periodOptions, type CostField, type CostInputs,
} from '@/lib/cost-compare';

const requestHref = `/consultation?situation=unsure&service=${encodeURIComponent('위탁·임차 비용 비교 도구 이용 후 요청')}` as const;

function CostGroup({ title, fields, values, onChange }: { title: string; fields: CostField[]; values: Record<string, string>; onChange: (key: string, value: string) => void }) {
  return <fieldset className="cost-group"><legend>{title}</legend>{fields.map((field) => (
    <label className="form-field" key={field.key}>
      <span>{field.label}</span>
      <div className="cost-input">
        <input inputMode="decimal" autoComplete="off" placeholder="미입력" value={values[field.key] ?? ''} onChange={(event) => onChange(field.key, event.target.value)} aria-describedby={`${field.key}-hint`} />
        <em>만원</em>
      </div>
      <small id={`${field.key}-hint`}>{field.hint}</small>
    </label>
  ))}</fieldset>;
}

export function CostCompare() {
  // 입력창에는 입력 중인 글자("12.")를 그대로 두고, 계산할 때만 숫자로 바꾼다.
  const [values, setValues] = useState<Record<string, string>>({});
  const [months, setMonths] = useState(defaultPeriod);
  const result = useMemo(() => {
    const inputs: CostInputs = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, parseCostInput(value)]));
    return compareCosts(inputs, months);
  }, [values, months]);
  const update = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: cleanCostInput(value) }));
  const breakdown = (side: typeof result.outsource, hasEnd: boolean) => `월 ${formatManwon(side.monthly)} · 초기 ${formatManwon(side.start)}${hasEnd ? ` · 종료 ${formatManwon(side.end)}` : ''}`;
  const crossover = result.breakEvenMonths === null ? '' : result.evenMonths !== null
    ? ` 일회성 비용이 큰 쪽은 ${result.evenMonths}개월에 합계가 같아지고 ${result.breakEvenMonths}개월부터 낮아집니다.`
    : ` 일회성 비용이 큰 쪽은 ${result.breakEvenMonths}개월부터 합계가 낮아집니다.`;
  const missing = [...result.outsource.missing, ...result.lease.missing];

  return <div className="cost-tool">
    <form className="cost-form" onSubmit={(event) => event.preventDefault()}>
      <fieldset className="cost-period"><legend>비교 기간</legend>{periodOptions.map((option) => (
        <label key={option} className={months === option ? 'checked' : ''}><input type="radio" name="period" checked={months === option} onChange={() => setMonths(option)} />{option}개월</label>
      ))}</fieldset>
      <div className="cost-columns">
        <section aria-labelledby="cost-outsource"><h2 id="cost-outsource">3PL 위탁</h2>
          <CostGroup title="매월 드는 비용" fields={outsourceMonthlyFields} values={values} onChange={update} />
          <CostGroup title="한 번 드는 비용" fields={outsourceOnceFields} values={values} onChange={update} />
        </section>
        <section aria-labelledby="cost-lease"><h2 id="cost-lease">창고 임차·직접 운영</h2>
          <CostGroup title="매월 드는 비용" fields={leaseMonthlyFields} values={values} onChange={update} />
          <CostGroup title="한 번 드는 비용" fields={leaseOnceFields} values={values} onChange={update} />
        </section>
      </div>
    </form>

    <section className="cost-result" aria-labelledby="cost-result-title" aria-live="polite">
      <h2 id="cost-result-title">{months}개월 비교 결과</h2>
      {!result.ready ? <p>양쪽에 월 비용을 하나 이상 입력하면 합계가 표시됩니다.</p> : <>
        <dl>
          <div><dt>3PL 위탁</dt><dd>{formatManwon(result.outsource.total)}</dd><small>{breakdown(result.outsource, outsourceOnceFields.some((field) => field.timing === 'end'))}</small></div>
          <div><dt>창고 임차·직접 운영</dt><dd>{formatManwon(result.lease.total)}</dd><small>{breakdown(result.lease, leaseOnceFields.some((field) => field.timing === 'end'))}</small></div>
        </dl>
        {result.complete ? <p className="cost-verdict">{result.lower === 'same' ? '입력값 기준 두 방식의 합계가 같습니다.' : `입력값 기준 ${result.lower === 'outsource' ? '3PL 위탁' : '창고 임차'}의 합계가 ${formatManwon(result.gap!)} 낮습니다.`}{crossover}</p>
          : <p className="cost-missing"><strong>확인 필요</strong> 미입력 {missing.length}개 항목({missing.join(', ')})은 합계에 포함되지 않았습니다. 0원이 아니라면 금액을 입력해야 비교할 수 있습니다. 해당 비용이 없으면 0을 입력해 주세요.</p>}
      </>}
      <Link className="button button-dark" href={requestHref}>실제 후보와 비교 요청하기<ArrowRight size={17} /></Link>
      <p className="cost-note">입력값은 브라우저에서만 계산하며 저장·전송하지 않습니다. 보증금은 돌려받는 금액이라 합계에서 제외합니다. 이 결과는 참고용이며 실제 견적이 아닙니다. 물량·계약 조건에 따라 달라집니다.</p>
    </section>
  </div>;
}
