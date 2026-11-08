'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy, Download } from 'lucide-react';
import { emptyPartner, normalizePartner, partnerSummary, type PartnerErrors, type PartnerProfile, type PartnerView } from '@/lib/partner-profile';
import { PartnerFields } from './profile-fields';

export function focusPartnerError(errors: PartnerErrors) {
  requestAnimationFrame(() => document.getElementById(`partner-${Object.keys(errors)[0]}`)?.focus());
}
export function PartnerForm() {
  const [profile, setProfile] = useState(emptyPartner);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<PartnerErrors>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [assetBusy, setAssetBusy] = useState(false);
  const busy = useRef(false);
  const [receipt, setReceipt] = useState<{ id: number; link: string; profile: PartnerProfile } | null>(null);
  const [copied, setCopied] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current || assetBusy) return;
    const validated = normalizePartner(profile, consent);
    setErrors(validated.errors); setError('');
    if (Object.keys(validated.errors).length) { focusPartnerError(validated.errors); return; }
    busy.current = true; setPending(true);
    try {
      const response = await fetch('/api/partnership', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: validated.profile, consent, website }) });
      const result = await response.json();
      if (!response.ok) { if (result.fields) { setErrors(result.fields); focusPartnerError(result.fields); } throw new Error(result.error || '접수하지 못했습니다.'); }
      if (!result.id || !result.token) throw new Error('접수 결과를 확인하지 못했습니다. 담당자에게 확인해 주세요.');
      setReceipt({ id: result.id, link: `${window.location.origin}/partnership/manage#${result.id}.${result.token}`, profile: validated.profile });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      requestAnimationFrame(() => document.getElementById('partner-success')?.focus());
    } catch (err) { setError(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : '연결이 끊겼습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.'); }
    finally { busy.current = false; setPending(false); }
  }
  if (receipt) return <div className="page partner-page"><section className="partner-success" aria-labelledby="partner-success"><Check size={30} /><h1 id="partner-success" tabIndex={-1}>업체 등록이 접수되었습니다.</h1><p>접수번호 <strong>#{receipt.id}</strong> · {receipt.profile.company}</p><p>담당자가 정보를 확인한 뒤 연락드립니다.<br />업체 정보는 아직 공개되지 않았습니다.</p>
    <div className="partner-link-box"><h2>보완 링크를 보관해 주세요.</h2><p>회원가입 없이 센터 정보와 사진·소개자료 링크를 추가할 수 있습니다. 이 링크를 가진 사람은 업체 정보를 수정할 수 있으므로 담당자만 보관해 주세요. 유효기간은 30일입니다.</p><label className="form-field"><span>업체 정보 보완 링크</span><input value={receipt.link} readOnly onFocus={e => e.target.select()} /></label>
      <div className="partner-actions"><button type="button" className="button button-outline" onClick={async () => { try { await navigator.clipboard.writeText(receipt.link); setCopied(true); } catch { setError('복사하지 못했습니다. 위 링크를 선택해 직접 복사해 주세요.'); } }}><Copy size={16} />링크 복사</button><button type="button" className="button button-outline" onClick={() => { const url = URL.createObjectURL(new Blob([`로지루프 업체 접수 #${receipt.id}\n${partnerSummary(receipt.profile)}\n\n비공개 보완 링크 (30일 유효):\n${receipt.link}`], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = '로지루프_업체등록_접수내역.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}><Download size={16} />접수내역 저장</button></div><p role="status">{copied ? '보완 링크를 복사했습니다.' : ''}</p>
    </div>{error && <p role="alert" className="field-error">{error}</p>}<a className="button button-yellow" href={receipt.link}>상세정보 보완하기<ArrowRight size={16} /></a><Link className="text-button" href="/">홈으로</Link>
  </section></div>;
  return <div className="page partner-page"><header className="partner-heading"><h1>3PL 업체 등록</h1><p>운영 지역과 서비스를 알려주세요.<br />센터 상세정보는 접수 후 천천히 보완할 수 있습니다.</p></header>
    <div className="partner-layout"><form className="partner-form" onSubmit={submit} noValidate>
      <fieldset disabled={pending} className="partner-form-body"><PartnerFields onAssetBusyChange={setAssetBusy} profile={profile} onChange={p => { setProfile(p); const next = normalizePartner(p, consent).errors; setErrors(previous => Object.fromEntries(Object.keys(previous).filter(key => next[key]).map(key => [key, next[key]]))); }} errors={errors} />
        <div className="sr-only" aria-hidden="true"><label>웹사이트 확인<input name="website" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></label></div>
        <div className="partner-consent"><label><input id="partner-consent" type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setErrors(previous => { const next = { ...previous }; delete next.consent; return next; }); }} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'partner-consent-error' : undefined} /><span>등록 검토·연락을 위한 개인정보 수집·이용, 상담 기록 저장과 메일 발송 서비스의 국외 이전에 동의합니다. (필수)</span></label><Link className="text-button" href="/privacy" target="_blank">개인정보 처리 안내</Link>{errors.consent && <p id="partner-consent-error" className="field-error">{errors.consent}</p>}</div>
      </fieldset>{error && <p role="alert" className="partner-error">{error}</p>}<button type="submit" className="button button-yellow partner-submit" disabled={pending || assetBusy} aria-busy={pending || assetBusy}>{pending ? '접수 중…' : '3PL 업체 등록 신청'}<ArrowRight size={17} /></button><p className="partner-submit-note">제출 후 바로 공개되지 않습니다. 등록·홍보·거래 비용은 구분해 안내합니다.</p>
    </form><aside className="partner-side"><h2>등록 후 이렇게 진행합니다.</h2><ol><li><strong>접수 내용 확인</strong><p>담당자가 남겨주신 연락처로 연락합니다.</p></li><li><strong>센터 정보 보완</strong><p>전용 링크에서 여러 센터의 시설과 현재 여유 물량을 추가합니다.</p></li><li><strong>공개 범위 협의</strong><p>합의한 정보로 등록하고 조건이 맞는 화주 요청을 검토합니다.</p></li></ol><p>담당자 연락처는 공개하지 않습니다. 화주 연결은 로지루프 담당자가 진행합니다.</p><Link className="text-button" href="/partnership/warehouse">창고·물류센터 임대 등록</Link><Link className="text-button" href="/consultation">창고·물류사를 찾는 화주이신가요?</Link></aside></div>
  </div>;
}

export function PartnerProfileEditor({ view, onSave, adminControls }: { view: PartnerView; onSave: (profile: PartnerProfile, revision: string) => Promise<PartnerView>; adminControls?: React.ReactNode }) {
  const [profile, setProfile] = useState(view.profile);
  const [revision, setRevision] = useState(view.revision);
  const [errors, setErrors] = useState<PartnerErrors>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [assetBusy, setAssetBusy] = useState(false);
  const busy = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy.current || assetBusy) return;
    const normalized = normalizePartner(profile, true, false); setErrors(normalized.errors); setMessage(''); setError('');
    if (Object.keys(normalized.errors).length) { focusPartnerError(normalized.errors); return; }
    busy.current = true; setPending(true);
    try { const result = await onSave(normalized.profile, revision); setProfile(result.profile); setRevision(result.revision); setMessage('업체 정보를 저장했습니다.'); }
    catch (err) { setError(err instanceof Error ? err.message : '저장하지 못했습니다.'); }
    finally { busy.current = false; setPending(false); }
  }
  return <form onSubmit={submit} noValidate className="partner-form"><fieldset disabled={pending} className="partner-form-body"><PartnerFields onAssetBusyChange={setAssetBusy} profile={profile} onChange={p => { setProfile(p); setMessage(''); const next = normalizePartner(p, true, false).errors; setErrors(previous => Object.fromEntries(Object.keys(previous).filter(key => next[key]).map(key => [key, next[key]]))); }} errors={errors} detailed />{adminControls}</fieldset>{error && <p role="alert" className="partner-error">{error}</p>}<p role="status">{message}</p><button type="submit" className="button button-yellow partner-submit" disabled={pending || assetBusy}>{pending ? '저장 중…' : '업체 정보 저장'}</button></form>;
}
