'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { enterQuoteOnBehalf } from '@/app/admin/quotes/actions';
import { emptyQuoteResponse, quoteTotal, type QuoteResponse, type QuoteView } from '@/lib/quotes';
import { QuoteResponseFields } from './quote-fields';

/** 업체가 자체 견적서(엑셀·PDF·카톡)로 회신했을 때 담당자가 표준 양식으로 옮긴다. 저장하면 화주 비교 리포트에 바로 반영된다. */
export function ProxyEntry({ quote, onSaved }: { quote: QuoteView; onSaved: (view: QuoteView) => void }) {
  const router = useRouter();
  const [original, setOriginal] = useState(quote.response?.original ?? '');
  const [response, setResponse] = useState<QuoteResponse>(quote.response ?? emptyQuoteResponse());
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [pending, setPending] = useState(false); const busy = useRef(false);
  const total = quoteTotal(quote.spec, response);
  const money = (v: number | null) => v === null ? '확인 필요' : `${v.toLocaleString('ko-KR')}원`;
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy.current) return; busy.current = true; setPending(true); setError(''); setMessage('');
    try {
      const result = await enterQuoteOnBehalf(quote.id, quote.revision, { ...response, original });
      if (!result.ok) throw new Error(result.error);
      onSaved(result.view); setMessage('표준 양식으로 저장했습니다. 화주 비교 리포트에 반영됩니다.'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : '저장하지 못했습니다.'); }
    finally { busy.current = false; setPending(false); }
  }
  return <details className="quote-proxy" open={!quote.response && quote.state === '전달 완료'}>
    <summary>{quote.response?.source === '담당자 정리' ? '담당자 정리 견적 수정' : '업체 자체 견적서 → 표준 양식으로 정리'}</summary>
    <form onSubmit={submit}><fieldset disabled={pending} className="partner-form-body">
      <p className="muted small">업체가 링크 대신 자체 양식으로 보낸 견적을 옮깁니다. 회신기한이 지난 견적도 받을 수 있습니다. 업체 원문은 관리자 화면에만 보관되고 화주에게는 표준 비교표만 표시됩니다.</p>
      <label className="form-field"><span>업체 견적 원문 · 카톡·메일 본문 또는 파일명과 주요 수치</span><textarea rows={6} maxLength={8000} required value={original} onChange={e => setOriginal(e.target.value)} placeholder="예: OO물류_견적서_1105.xlsx / 보관 팔레트당 18,000원, 입고 2,500원, 출고 건당 700원, 월 최소 150만원, VAT 별도, 11/30까지 유효" /></label>
      <QuoteResponseFields spec={quote.spec} value={response} onChange={setResponse} />
      <p><strong>표준 기준 월 비용: {money(total.monthly)}</strong> · 첫 달 {money(total.firstMonth)} · {total.reason}</p>
      <p className="muted small">업체 단위가 다르면(평당·박스당 등) 위 공통 단위로 환산하고, 환산 근거를 추가 조건에 적으세요. 원문에 없는 항목은 빈칸(확인 필요)으로 둡니다.</p>
      <label className="quote-confirm"><input type="checkbox" required />원문과 단가·최소요금·부가세·유효기간을 대조했습니다.</label>
    </fieldset>
    {error && <p role="alert" className="field-error">{error}</p>}<p role="status">{message}</p>
    <button className="button button-yellow" disabled={pending}>{pending ? '저장 중…' : '표준 양식으로 저장 · 회신 완료 처리'}</button></form>
  </details>;
}
