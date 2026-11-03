'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { reportStages, shipperChoices, type ReportView, type ShipperChoice } from '@/lib/quote-report';

const won = (v: number | null) => v === null ? '확인 필요' : `${v.toLocaleString('ko-KR')}원`;
const raw = (v: string) => v === '' ? '확인 필요' : `${Number(v).toLocaleString('ko-KR')}원`;
export const REPORT_DISCLAIMER = '※ 본 자료는 업체 회신 시점·조건 기준이며 실제 계약 조건과 다를 수 있습니다. 최종 결정 전 현장 확인과 계약 조건 검토를 권장합니다.';

/** 관리자 미리보기와 화주 화면이 같이 쓰는 리포트 본문. */
export function ReportBody({ view }: { view: ReportView }) {
  const stageIndex = reportStages.indexOf(view.stage);
  const comparable = view.rows.filter(r => r.monthly !== null);
  return <article className="quote-report">
    <header className="report-head">
      <p className="report-eyebrow">LOGILOOP 3PL 비교 리포트</p>
      <h1>비교 리포트 #{view.number}</h1>
      <dl className="report-meta"><div><dt>발행</dt><dd>{view.issuedAt.slice(0, 10)}</dd></div><div><dt>열람 기한</dt><dd>{view.validUntil || '링크 발급 후 30일'}</dd></div><div><dt>비교 업체</dt><dd>{view.rows.length}곳{view.pending ? ` · 미회신 ${view.pending}곳` : ''}{view.declined ? ` · 수용 불가 ${view.declined}곳` : ''}</dd></div></dl>
    </header>
    <ol className="report-steps" aria-label="진행 단계">{reportStages.filter(s => s !== '종결').map((s, i) => <li key={s} className={i < stageIndex ? 'done' : i === stageIndex ? 'current' : ''} aria-current={i === stageIndex ? 'step' : undefined}>{s}</li>)}</ol>

    <section className="report-section"><h2>요청 조건</h2>
      <p className="muted small">모든 업체에 같은 수량·단위로 요청했습니다.</p>
      <dl className="report-grid"><div><dt>품목</dt><dd>{view.spec.item || '확인 필요'}</dd></div><div><dt>희망 지역</dt><dd>{view.spec.region || '확인 필요'}</dd></div><div><dt>온도</dt><dd>{view.spec.temperature || '확인 필요'}</dd></div><div><dt>시작</dt><dd>{view.spec.start || '협의'}</dd></div><div><dt>SKU</dt><dd>{view.spec.sku || '확인 필요'}</dd></div><div><dt>피크</dt><dd>{view.spec.peak || '확인 필요'}</dd></div></dl>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="요청 수량 표"><table className="data-table"><thead><tr><th>항목</th>{view.spec.quantities.map(q => <th key={q.item}>{q.item}</th>)}</tr></thead><tbody><tr><th scope="row">월 수량</th>{view.spec.quantities.map(q => <td key={q.item}>{q.quantity === '' ? '확인 필요' : `${Number(q.quantity).toLocaleString('ko-KR')} ${q.unit}`}</td>)}</tr></tbody></table></div>
    </section>

    <section className="report-section report-summary"><h2>요약</h2>
      <div className="report-kpis">
        <div><span>확정 가능한 월 비용 범위</span><strong>{comparable.length ? `${won(view.summary.min)} ~ ${won(view.summary.max)}` : '확인 필요'}</strong><small>VAT 기준은 업체별 표기 참조</small></div>
        <div><span>현재 월 물류비</span><strong>{view.baseline ? won(view.baseline.amount) : '미입력'}</strong><small>{view.baseline ? `VAT ${view.baseline.vat}` : '정확액을 알려주시면 차액을 계산합니다'}</small></div>
        <div><span>담당자 추천</span><strong>{view.summary.recommended.join(', ') || '검토 중'}</strong><small>비용과 운영 조건을 함께 본 의견</small></div>
      </div>
      {view.comment && <div className="report-comment"><h3>담당자 의견</h3><p>{view.comment}</p></div>}
    </section>

    <section className="report-section"><h2>업체별 비교</h2>
      <p className="muted small">월 비용 = max(6개 항목 합계, 월 최소요금) + 월 별도 비용. 단가·최소요금·VAT 기준·유효기간이 모두 확인된 견적만 금액을 표시하고 순서를 매깁니다.</p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="업체별 비교 표"><table className="data-table"><thead><tr><th>업체</th><th>운영 지역</th><th>수용</th><th>월 비용</th><th>첫 달 비용</th><th>VAT</th><th>현재 대비 월 차액</th><th>유효기간</th></tr></thead>
        <tbody>{view.rows.map(r => <tr key={r.id}><th scope="row">{r.label}{r.recommended && <small><span className="status-tag amber">추천</span></small>}</th><td>{r.region || '—'}</td><td>{r.availability}</td><td>{won(r.monthly)}{r.monthly === null && <small>{r.reason}</small>}</td><td>{won(r.firstMonth)}</td><td>{r.vat}</td><td>{r.diffMonthly === null ? <small>{r.diffReason}</small> : <>{Math.abs(r.diffMonthly).toLocaleString('ko-KR')}원 {r.diffMonthly >= 0 ? '낮음' : '높음'}<small>12개월 환산 {Math.abs(r.diffAnnual!).toLocaleString('ko-KR')}원</small></>}</td><td>{r.validUntil}</td></tr>)}</tbody></table></div>
      {!view.rows.length && <p>아직 비교할 수 있는 회신이 없습니다.</p>}
      {view.rows.length > 0 && <><h3>항목별 단가</h3><div className="table-scroll" tabIndex={0} role="region" aria-label="항목별 단가 표"><table className="data-table"><thead><tr><th>업체</th>{view.spec.quantities.map(q => <th key={q.item}>{q.item}<small>{q.unit}</small></th>)}<th>월 최소요금</th><th>월 별도</th><th>초기 1회</th></tr></thead>
        <tbody>{view.rows.map(r => <tr key={r.id}><th scope="row">{r.label}</th>{r.rates.map(x => <td key={x.item}>{raw(x.rate)}</td>)}<td>{raw(r.minimum)}</td><td>{raw(r.extra)}</td><td>{raw(r.setup)}</td></tr>)}</tbody></table></div><p className="muted small">총액보다 항목별 단가 구조를 함께 비교하세요. 물량이 바뀌면 순서가 달라질 수 있습니다.</p></>}
    </section>

    <section className="report-section"><h2>업체 상세</h2>
      {view.rows.map(r => <details key={r.id} className="report-partner" open={r.recommended}><summary><strong>{r.label}</strong><span>{r.availability} · {won(r.monthly)}</span></summary>
        <dl className="report-grid"><div><dt>운영 지역</dt><dd>{r.region || '확인 필요'}</dd></div><div><dt>회신 센터</dt><dd>{r.center || '확인 필요'}</dd></div><div><dt>수용 시작</dt><dd>{r.start || '확인 필요'}</dd></div><div><dt>서비스</dt><dd>{r.services.join(' · ') || '확인 필요'}</dd></div><div><dt>온도대</dt><dd>{r.temperatures.join(' · ') || '확인 필요'}</dd></div><div><dt>취급 품목</dt><dd>{r.categories.join(' · ') || '확인 필요'}</dd></div></dl>
        <h3>월 비용 산출</h3><div className="table-scroll" tabIndex={0} role="region" aria-label={`${r.label} 월 비용 산출 표`}><table className="data-table"><thead><tr><th>항목</th><th>수량</th><th>단가</th><th>금액</th></tr></thead><tbody>{r.rates.map(x => <tr key={x.item}><td>{x.item}</td><td>{x.quantity === '' ? '확인 필요' : `${Number(x.quantity).toLocaleString('ko-KR')} ${x.unit}`}</td><td>{raw(x.rate)}</td><td>{won(x.amount)}</td></tr>)}</tbody></table></div>
        {r.metrics.length > 0 && <><h3>출고 품질·안정성 지표</h3><p className="muted small">{r.metricSource}</p><dl className="report-grid">{r.metrics.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></>}
        {r.note && <><h3>업체 회신 조건</h3><p>{r.note}</p></>}
      </details>)}
    </section>
    <p className="report-disclaimer">{REPORT_DISCLAIMER}</p>
  </article>;
}

export default function QuoteReportPage() {
  const [view, setView] = useState<ReportView | null>(null); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [pending, setPending] = useState(false);
  const [choice, setChoice] = useState<ShipperChoice>('현장 확인 요청'); const [picked, setPicked] = useState<string[]>([]); const [note, setNote] = useState('');
  const credentials = useRef({ id: '', token: '' }); const busy = useRef(false);
  useEffect(() => {
    let controller: AbortController | undefined;
    async function load() {
      controller?.abort(); controller = new AbortController(); const signal = controller.signal;
      const [id, token] = window.location.hash.slice(1).split('.'); credentials.current = { id, token };
      setView(null); setError('');
      try { const res = await fetch('/api/quote/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, action: 'load' }), cache: 'no-store', signal }); const data = await res.json(); if (!res.ok) throw new Error(data.error); if (!signal.aborted) setView(data.view); }
      catch (err) { if (!signal.aborted) setError(err instanceof Error ? err.message : '불러오지 못했습니다.'); }
    }
    void load(); const changed = () => { void load(); }; window.addEventListener('hashchange', changed);
    return () => { controller?.abort(); window.removeEventListener('hashchange', changed); };
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy.current || !view) return; busy.current = true; setPending(true); setError(''); setMessage('');
    try { const res = await fetch('/api/quote/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...credentials.current, action: 'reply', reply: { choice, quoteIds: picked, message: note } }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setView(data.view); setNote(''); setMessage('요청을 전달했습니다. 지음 담당자가 일정과 다음 절차를 안내합니다.'); }
    catch (err) { setError(err instanceof Error ? err.message : '전달하지 못했습니다.'); } finally { busy.current = false; setPending(false); }
  }
  return <div className="page quote-report-page">
    {error && <p role="alert" className="field-error">{error}</p>}
    {view ? <>
      <div className="report-tools no-print"><button type="button" className="button button-outline" onClick={() => { document.querySelectorAll<HTMLDetailsElement>('.quote-report details').forEach(d => { d.open = true; }); window.print(); }}>PDF로 저장·인쇄</button></div>
      <ReportBody view={view} />
      <form className="panel report-next no-print" onSubmit={submit}><h2>다음 단계 선택</h2><p>선택만으로 계약이 진행되지 않습니다. 담당자가 확인 후 연락드립니다.</p>
        <fieldset disabled={pending} className="partner-form-body">
          <div className="shipper-options" role="radiogroup" aria-label="다음 단계">{shipperChoices.map(c => <label key={c} className="shipper-option"><input type="radio" name="choice" checked={choice === c} onChange={() => setChoice(c)} /><span>{c}</span></label>)}</div>
          {choice !== '보류' && <fieldset className="shipper-choice"><legend>대상 업체 {choice === '현장 확인 요청' ? '· 1곳 이상' : '· 선택'}</legend><div className="shipper-options">{view.rows.map(r => <label key={r.id} className="shipper-option"><input type="checkbox" checked={picked.includes(r.id)} onChange={e => setPicked(e.target.checked ? [...picked, r.id] : picked.filter(x => x !== r.id))} /><span>{r.label}</span></label>)}</div></fieldset>}
          <label className="form-field"><span>요청 내용 · 선택</span><textarea maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder="희망 방문 일정, 추가로 확인할 조건 등을 적어 주세요." /></label>
        </fieldset>
        <p role="status">{message}</p><button className="button button-yellow" disabled={pending}>{pending ? '전달 중…' : '담당자에게 전달'}</button>
        {view.replies.length > 0 && <details><summary>전달한 요청 {view.replies.length}건</summary><ul>{view.replies.map(r => <li key={r.at}>{r.at.slice(0, 16).replace('T', ' ')} · {r.choice}{r.quoteIds.length ? ` · ${r.quoteIds.map(id => view.rows.find(x => x.id === id)?.label ?? '').join(', ')}` : ''}</li>)}</ul></details>}
      </form>
    </> : !error && <p role="status">리포트를 불러오는 중…</p>}
  </div>;
}
