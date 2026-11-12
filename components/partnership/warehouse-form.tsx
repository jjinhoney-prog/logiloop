'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy, Download } from 'lucide-react';
import { emptyWarehouse, normalizeWarehouse, warehouseSummary, type WarehouseErrors, type WarehouseProfile, type WarehouseView } from '@/lib/warehouse-profile';
import { WarehouseFields } from './warehouse-fields';

/** 화면에서 가장 위에 있는 오류 칸으로 이동한다. */
const focusError = (errors: WarehouseErrors) => requestAnimationFrame(() => {
  const fields = Object.keys(errors).map(key => document.getElementById(`warehouse-${key}`)).filter((el): el is HTMLElement => Boolean(el));
  fields.sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)[0]?.focus();
});
/** 고친 항목의 오류만 지우고, 새 오류는 제출할 때 보여준다. */
const keepFixed = (previous: WarehouseErrors, next: WarehouseErrors) => Object.fromEntries(Object.keys(previous).filter(key => next[key]).map(key => [key, next[key]]));

export function WarehouseForm({ stored }: { stored: boolean }) {
  const [profile, setProfile] = useState(emptyWarehouse);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<WarehouseErrors>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const [receipt, setReceipt] = useState<{ id: number; link: string; profile: WarehouseProfile } | null>(null);
  const [copied, setCopied] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    const validated = normalizeWarehouse(profile, consent);
    setErrors(validated.errors); setError('');
    if (Object.keys(validated.errors).length) { focusError(validated.errors); return; }
    busy.current = true; setPending(true);
    try {
      const response = await fetch('/api/partnership/warehouse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: validated.profile, consent, website }) });
      const result = await response.json();
      if (!response.ok) { if (result.fields) { setErrors(result.fields); focusError(result.fields); } throw new Error(result.error || '접수하지 못했습니다.'); }
      if (!result.id || !result.token) throw new Error('접수 결과를 확인하지 못했습니다. 담당자에게 확인해 주세요.');
      setReceipt({ id: result.id, link: `${window.location.origin}/partnership/warehouse/manage#${result.id}.${result.token}`, profile: validated.profile });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      requestAnimationFrame(() => document.getElementById('warehouse-success')?.focus());
    } catch (err) { setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : '연결이 끊겼습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.'); }
    finally { busy.current = false; setPending(false); }
  }
  if (receipt) return <div className="page partner-page"><section className="partner-success" aria-labelledby="warehouse-success"><Check size={30} /><h1 id="warehouse-success" tabIndex={-1}>창고 등록이 접수되었습니다.</h1><p>접수번호 <strong>#{receipt.id}</strong> · {receipt.profile.province} {receipt.profile.district} {receipt.profile.facilityType}</p><p>담당자가 조건을 확인한 뒤 연락드립니다.<br />등록 정보는 아직 공개되지 않았습니다.</p>
    <div className="partner-link-box"><h2>보완 링크를 보관해 주세요.</h2><p>회원가입 없이 상세 주소·도크·관리비·자료 링크를 추가할 수 있습니다. 이 링크를 가진 사람은 등록 정보를 수정할 수 있으므로 담당자만 보관해 주세요. 유효기간은 30일입니다.</p><label className="form-field"><span>창고 정보 보완 링크</span><input value={receipt.link} readOnly onFocus={e => e.target.select()} /></label>
      <div className="partner-actions"><button type="button" className="button button-outline" onClick={async () => { try { await navigator.clipboard.writeText(receipt.link); setCopied(true); } catch { setError('복사하지 못했습니다. 위 링크를 선택해 직접 복사해 주세요.'); } }}><Copy size={16} />링크 복사</button><button type="button" className="button button-outline" onClick={() => { const url = URL.createObjectURL(new Blob([`로지루프 창고 등록 #${receipt.id}\n${warehouseSummary(receipt.profile)}\n\n비공개 보완 링크 (30일 유효):\n${receipt.link}`], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = '로지루프_창고등록_접수내역.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}><Download size={16} />접수내역 저장</button></div><p role="status">{copied ? '보완 링크를 복사했습니다.' : ''}</p>
    </div>{error && <p role="alert" className="field-error">{error}</p>}<a className="button button-yellow" href={receipt.link}>상세정보 보완하기<ArrowRight size={16} /></a><Link className="text-button" href="/">홈으로</Link>
  </section></div>;
  return <div className="page partner-page"><header className="partner-heading"><h1>창고·물류센터 임대 등록</h1><p>위치·면적·임대 조건을 알려주세요.<br />조건이 맞는 화주 요청이 들어오면 로지루프 담당자가 연결합니다.</p></header>
    <div className="partner-layout"><form className="partner-form" onSubmit={submit} noValidate>
      {!stored && <p className="partner-error" role="status">현재 온라인 접수를 준비 중입니다. 급하시면 상담 페이지로 문의해 주세요.</p>}
      <fieldset disabled={pending} className="partner-form-body"><WarehouseFields profile={profile} onChange={p => { setProfile(p); setErrors(previous => keepFixed(previous, normalizeWarehouse(p, consent).errors)); }} errors={errors} />
        <div className="sr-only" aria-hidden="true"><label>웹사이트 확인<input name="website" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></label></div>
        <div className="partner-consent"><label><input id="warehouse-consent" type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setErrors(previous => { const next = { ...previous }; delete next.consent; return next; }); }} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'warehouse-consent-error' : undefined} /><span>등록 검토·연락을 위한 개인정보 수집·이용, 상담 기록 저장과 메일 발송 서비스의 국외 이전에 동의합니다. (필수)</span></label><Link className="text-button" href="/privacy" target="_blank">개인정보 처리 안내</Link>{errors.consent && <p id="warehouse-consent-error" className="field-error">{errors.consent}</p>}</div>
      </fieldset>{error && <p role="alert" className="partner-error">{error}</p>}<button type="submit" className="button button-yellow partner-submit" disabled={pending} aria-busy={pending}>{pending ? '접수 중…' : '창고 임대 등록 신청'}<ArrowRight size={17} /></button><p className="partner-submit-note">제출 후 바로 공개되지 않습니다. 담당자가 조건을 확인한 뒤 공개 범위를 정합니다.</p>
    </form><aside className="partner-side"><h2>등록 후 이렇게 진행합니다.</h2><ol><li><strong>접수 내용 확인</strong><p>담당자가 남겨주신 연락처로 연락해 조건을 확인합니다.</p></li><li><strong>상세정보 보완</strong><p>전용 링크에서 상세 주소·도크·관리비·자료를 추가합니다.</p></li><li><strong>목록 공개·화주 연결</strong><p>확인한 정보로 창고 목록에 공개하고 조건이 맞는 화주 요청을 연결합니다.</p></li></ol><p>상세 주소와 연락처는 공개하지 않습니다. 화주 연결은 로지루프 담당자가 진행합니다.</p><Link className="text-button" href="/partnership">3PL 업체 등록</Link><Link className="text-button" href="/consultation">창고를 찾는 화주이신가요?</Link></aside></div>
  </div>;
}

export function WarehouseProfileEditor({ view, onSave, adminControls }: { view: WarehouseView; onSave: (profile: WarehouseProfile, revision: string) => Promise<WarehouseView>; adminControls?: ReactNode }) {
  const [profile, setProfile] = useState(view.profile);
  const [revision, setRevision] = useState(view.revision);
  const [errors, setErrors] = useState<WarehouseErrors>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy.current) return;
    const normalized = normalizeWarehouse(profile, true, false); setErrors(normalized.errors); setMessage(''); setError('');
    if (Object.keys(normalized.errors).length) { focusError(normalized.errors); return; }
    busy.current = true; setPending(true);
    try { const result = await onSave(normalized.profile, revision); setProfile(result.profile); setRevision(result.revision); setMessage('창고 정보를 저장했습니다.'); }
    catch (err) { setError(err instanceof Error ? err.message : '저장하지 못했습니다.'); }
    finally { busy.current = false; setPending(false); }
  }
  return <form onSubmit={submit} noValidate className="partner-form"><fieldset disabled={pending} className="partner-form-body"><WarehouseFields profile={profile} onChange={p => { setProfile(p); setMessage(''); setErrors(previous => keepFixed(previous, normalizeWarehouse(p, true, false).errors)); }} errors={errors} detailed />{adminControls}</fieldset>{error && <p role="alert" className="partner-error">{error}</p>}<p role="status">{message}</p><button type="submit" className="button button-yellow partner-submit" disabled={pending}>{pending ? '저장 중…' : '창고 정보 저장'}</button></form>;
}
