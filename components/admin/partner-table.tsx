'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { issuePartnerLink, savePartnerReview } from '@/app/admin/actions';
import { PartnerProfileEditor } from '@/components/partnership/partner-form';
import { partnerStages, type PartnerStage, type PartnerView } from '@/lib/partner-profile';
import type { InquiryRecord } from '@/lib/types';

export function PartnerTable({ inquiries }: { inquiries: InquiryRecord[] }) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('전체');
  const [active, setActive] = useState<number | null>(null);
  const filtered = inquiries.filter(r => (stage === '전체' || r.partner?.stage === stage) && `${r.company} ${r.region} ${r.regionDetail}`.toLowerCase().includes(query.toLowerCase()));
  const current = inquiries.find(r => r.id === active);
  return <><div className="admin-table-top"><h2>3PL 업체 등록 목록</h2><span className="muted small">검토 상태와 공개 노출은 별개입니다.</span></div>
    <div className="form-grid"><label className="form-field"><span>업체명·지역 검색</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="업체명 또는 운영 지역" /></label><label className="form-field"><span>업체 검토 상태</span><select value={stage} onChange={e => setStage(e.target.value)}><option>전체</option>{partnerStages.map(s => <option key={s}>{s}</option>)}</select></label></div>
    <div className="table-scroll"><table className="data-table"><thead><tr><th>업체·연락처</th><th>지역</th><th>서비스</th><th>검토 상태</th><th>메일 알림</th><th>관리</th></tr></thead><tbody>{filtered.map(r => <tr key={r.id}><td><strong>{r.company}</strong><small>#{r.id} · {r.name} · {r.phone}</small></td><td>{r.partner?.profile.regions.map(v => `${v.province} ${v.district}`).join(', ') || r.regionDetail || r.region}</td><td>{r.partner?.profile.services.join(', ') || r.help}</td><td><span className="status-tag">{r.partner?.stage || `기존 접수 · ${r.stage}`}</span></td><td>{r.mailStatus === 'failed' ? '발송 실패 · 직접 확인' : r.mailStatus === 'sent' ? '발송' : r.mailStatus === 'pending' ? '대기' : '미설정'}</td><td><button className="text-button" onClick={() => setActive(active === r.id ? null : r.id)}>{active === r.id ? '접기' : '정보 확인·보완'}</button></td></tr>)}</tbody></table></div>
    {!filtered.length && <p className="partner-empty">{inquiries.length ? '검색 조건에 맞는 업체가 없습니다.' : '아직 등록된 3PL 업체가 없습니다.'}</p>}
    {current && <div className="admin-editor"><div className="section-title"><h3>{current.company} · #{current.id}</h3><button className="text-button" onClick={() => setActive(null)}>편집 닫기</button></div>{current.partner ? <PartnerAdminEditor key={current.id} id={current.id} initial={current.partner} /> : <><p>이전 상담 양식으로 접수된 업체입니다. 아래 내용을 확인하고 상담 접수 탭에서 담당자·진행 상태를 관리해 주세요.</p><pre className="partner-legacy">{current.note || '추가 내용 없음'}</pre></>}</div>}
  </>;
}
function PartnerAdminEditor({ id, initial }: { id: number; initial: PartnerView }) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [review, setReview] = useState({reviewer:initial.review?.reviewer??'',documents:initial.review?.documents??'미확인',notes:initial.review?.notes??''});
  const [stage, setStage] = useState<PartnerStage>(initial.stage);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  return <><p className="muted small">‘등록 준비 완료’는 공개 상태가 아닙니다. 공개 범위를 저장한 뒤 아래에서 공개용 소개를 만들고, 매물 관리에서 공개로 전환하세요.</p>
    <PartnerProfileEditor key={view.revision} view={view} adminControls={<><div className="form-grid"><label className="form-field"><span>자료 검토 상태</span><select value={review.documents} onChange={e=>setReview({...review,documents:e.target.value})}>{['미확인','보완 요청','확인'].map(v=><option key={v}>{v}</option>)}</select></label><label className="form-field"><span>자료 확인 담당자</span><input value={review.reviewer} maxLength={100} onChange={e=>setReview({...review,reviewer:e.target.value})}/></label></div><label className="form-field"><span>자료 검토·보완 메모 (내부)</span><textarea value={review.notes} maxLength={1000} onChange={e=>setReview({...review,notes:e.target.value})}/></label>{initial.review?.checkedAt&&<p className="muted small">최근 검토 기록: {new Date(initial.review.checkedAt).toLocaleString('ko-KR')}</p>}<label className="form-field"><span>검토 상태</span><select aria-label="검토 상태" value={stage} onChange={e => setStage(e.target.value as PartnerStage)}>{partnerStages.map(s => <option key={s}>{s}</option>)}</select></label></>} onSave={async (profile, revision) => {
      const result = await savePartnerReview(id, revision, profile, stage, review);
      if (!result.ok) throw new Error(result.error);
      // Keep the mounted editor so its saved status remains visible.
      router.refresh(); return result;
    }} />
    <Link className="button button-outline" href={`/admin/listings/new?partner=${id}`}>물류사·3PL 공개용 소개 만들기</Link>
    <details className="partner-link-tools"><summary>업체에 전달할 보완 링크 재발급</summary><p>저장하지 않은 수정사항은 먼저 저장하세요. 재발급 시 기존 링크는 즉시 무효화되고 새 링크는 30일간 유효합니다. 자동 발송되지 않습니다.</p><button className="button button-outline" disabled={pending} onClick={async () => {
      setPending(true); setError(''); setCopied(false);
      try { const result = await issuePartnerLink(id); if (!result.ok) throw new Error(result.error); setView(result); setStage(result.stage); setLink(`${window.location.origin}/partnership/manage#${id}.${result.token}`); router.refresh(); }
      catch (err) { setError(err instanceof Error ? err.message : '발급하지 못했습니다.'); }
      finally { setPending(false); }
    }}>{pending ? '발급 중…' : '새 보완 링크 발급'}</button>{link && <><label className="form-field"><span>새 보완 링크 · 담당자에게 직접 전달</span><input readOnly value={link} onFocus={e => e.target.select()} /></label><button className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setError('위 링크를 선택해 직접 복사해 주세요.'); } }}>링크 복사</button><p role="status">{copied ? '복사했습니다.' : ''}</p></>}{error && <p role="alert" className="field-error">{error}</p>}</details>
  </>;
}
