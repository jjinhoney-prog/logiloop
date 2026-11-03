'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadQuoteReport, saveQuoteReport, updateQuoteReportLink } from '@/app/admin/quotes/actions';
import { emptySettings, reportStages, type ReportSettings, type ReportStage, type ReportView } from '@/lib/quote-report';
import { ReportBody } from './quote-report';

type Loaded = Extract<Awaited<ReturnType<typeof loadQuoteReport>>, { ok: true }>;

/** 견적 묶음별 화주 리포트: 의견·추천·업체명 공개·단계 → 링크 발급 → 직접 전달 기록. */
export function ReportAdmin({ groupId, quotes }: { groupId: string; quotes: { id: string; partnerName: string }[] }) {
  const router = useRouter();
  const [data, setData] = useState<Loaded | null>(null); const [settings, setSettings] = useState<ReportSettings>(emptySettings);
  const [link, setLink] = useState(''); const [delivery, setDelivery] = useState(''); const [preview, setPreview] = useState<ReportView | null>(null);
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [pending, setPending] = useState(false); const busy = useRef(false);
  const apply = useCallback((result: Awaited<ReturnType<typeof loadQuoteReport>>) => {
    if (!result.ok) { setError(result.error); return; }
    setData(result); setSettings(result.report?.settings ?? emptySettings()); setPreview(result.view); setError('');
  }, []);
  const load = useCallback(async () => apply(await loadQuoteReport(groupId)), [apply, groupId]);
  // 묶음이 바뀌면 부모가 key로 다시 마운트하므로 여기서는 불러오기만 한다.
  useEffect(() => { let alive = true; loadQuoteReport(groupId).then(r => { if (alive) apply(r); }); return () => { alive = false; }; }, [apply, groupId]);
  async function run(task: () => Promise<{ ok: boolean; error?: string; token?: string }>, done: string) {
    if (busy.current) return; busy.current = true; setPending(true); setError(''); setMessage('');
    try { const r = await task(); if (!r.ok) throw new Error(r.error); if (r.token) setLink(`${window.location.origin}/quote/report#${groupId}.${r.token}`); setMessage(done); await load(); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : '처리하지 못했습니다.'); } finally { busy.current = false; setPending(false); }
  }
  const toggle = (key: 'recommended' | 'revealed', id: string, on: boolean) => setSettings(s => ({ ...s, [key]: on ? [...s[key], id] : s[key].filter(x => x !== id) }));
  const report = data?.report; const revision = report?.revision ?? '';
  return <section className="panel quote-report-admin"><h2>화주용 비교 리포트</h2>
    <p className="muted small">업체 회신 금액은 위 비교표와 같은 계산을 씁니다. 업체명은 &lsquo;공개&rsquo;를 선택한 업체만 표시되고 나머지는 A·B·C로 익명 처리됩니다. 링크는 발급 후 30일간 유효하며 자동 발송하지 않습니다.</p>
    {error && <p role="alert" className="field-error">{error}</p>}
    <fieldset disabled={pending || !data} className="partner-form-body">
      <label className="form-field"><span>리포트 진행 단계</span><select value={settings.stage} onChange={e => setSettings({ ...settings, stage: e.target.value as ReportStage })}>{reportStages.map(s => <option key={s}>{s}</option>)}</select></label>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>업체</th><th>추천 표시</th><th>업체명 공개</th></tr></thead><tbody>{quotes.map(q => <tr key={q.id}><td>{q.partnerName}</td><td><input type="checkbox" aria-label={`${q.partnerName} 추천`} checked={settings.recommended.includes(q.id)} onChange={e => toggle('recommended', q.id, e.target.checked)} /></td><td><input type="checkbox" aria-label={`${q.partnerName} 업체명 공개`} checked={settings.revealed.includes(q.id)} onChange={e => toggle('revealed', q.id, e.target.checked)} /></td></tr>)}</tbody></table></div>
      <label className="form-field"><span>담당자 의견 · 화주에게 표시</span><textarea rows={5} maxLength={3000} value={settings.comment} onChange={e => setSettings({ ...settings, comment: e.target.value })} placeholder="비용 외에 비교한 운영 조건, 추천 이유, 확인이 남은 항목" /></label>
      <div className="partner-actions">
        <button type="button" className="button button-yellow" onClick={() => run(() => saveQuoteReport(groupId, revision, settings), '리포트 설정을 저장했습니다.')}>리포트 설정 저장</button>
        <button type="button" className="button button-outline" disabled={!report} onClick={() => run(() => updateQuoteReportLink(groupId, revision, 'link'), '새 리포트 링크를 발급했습니다. 이전 링크는 무효입니다. 화주에게 직접 전달한 뒤 전달 완료를 기록하세요.')}>리포트 링크 발급·재발급</button>
      </div>
      {link && <label className="form-field"><span>화주 리포트 링크</span><input readOnly value={link} onFocus={e => e.target.select()} /></label>}
      {report?.issuedAt && !report.sentAt && <><label className="form-field"><span>전달 기록 · 채널/수신 담당자</span><input maxLength={300} value={delivery} onChange={e => setDelivery(e.target.value)} placeholder="예: 화주 담당자에게 카카오톡으로 직접 전달" /></label><button type="button" className="button button-yellow" onClick={() => run(() => updateQuoteReportLink(groupId, revision, 'sent', delivery), '전달 완료로 기록했습니다. 이제 화주가 링크를 열 수 있습니다.')}>직접 전달 완료 기록</button></>}
    </fieldset>
    {report && <p className="muted small">{report.sentAt ? `전달 완료 ${new Date(report.sentAt).toLocaleString('ko-KR')} · ${report.deliveryNote}` : report.issuedAt ? '링크 발급됨 · 전달 기록 전에는 화주가 열 수 없습니다.' : '링크 미발급'}{report.expiresAt ? ` · 만료 ${new Date(report.expiresAt).toLocaleDateString('ko-KR')}` : ''}</p>}
    {!!report?.replies.length && <><h3>화주 응답</h3><ul>{report.replies.map(r => <li key={r.at}>{new Date(r.at).toLocaleString('ko-KR')} · <strong>{r.choice}</strong>{r.quoteIds.length ? ` · ${r.quoteIds.map(id => quotes.find(q => q.id === id)?.partnerName ?? '').join(', ')}` : ''}{r.message ? ` · ${r.message}` : ''}</li>)}</ul></>}
    <p role="status">{message}</p>
    {preview && <details><summary>저장된 설정 기준 화주 화면 미리보기</summary><ReportBody view={preview} /></details>}
  </section>;
}
