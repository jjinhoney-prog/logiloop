'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { approveWarehouse, issueWarehouseLink, saveWarehouseReview } from '@/app/admin/actions';
import { approvalStatus } from '@/lib/partner-approval';
import { partnerStages, type PartnerStage } from '@/lib/partner-profile';
import { WAREHOUSE_PRIVATE_DISCLOSURE, warehouseAreaLabel, type WarehouseView } from '@/lib/warehouse-profile';
import { WarehouseProfileEditor } from '@/components/partnership/warehouse-form';
import type { InquiryRecord } from '@/lib/types';

const approvalTone = (status: string) => status === '공개 중' ? 'live' : status === '변경 승인 대기' ? 'pending' : 'none';

export function WarehouseTable({ inquiries }: { inquiries: InquiryRecord[] }) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState('전체');
  const [active, setActive] = useState<number | null>(null);
  const filtered = inquiries.filter(r => (stage === '전체' || (r.warehouse?.stage ?? '') === stage) && `${r.company} ${r.regionDetail} ${r.region}`.includes(query.trim()));
  const current = inquiries.find(r => r.id === active);
  return <><div className="admin-table-top"><h2>창고 임대 등록 목록</h2><span className="muted small">검토 상태와 목록 공개는 별개입니다.</span></div>
    <div className="form-grid"><label className="form-field"><span>등록자·지역 검색</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="소유주·업체명 또는 지역" /></label><label className="form-field"><span>검토 상태</span><select value={stage} onChange={e => setStage(e.target.value)}><option>전체</option>{partnerStages.map(s => <option key={s}>{s}</option>)}</select></label></div>
    <div className="table-scroll"><table className="data-table"><thead><tr><th>등록자·연락처</th><th>소재지</th><th>시설·면적</th><th>임대 조건</th><th>검토 상태</th><th>창고 목록 공개</th><th>메일 알림</th><th>관리</th></tr></thead><tbody>{filtered.map(r => {
      const w = r.warehouse?.profile;
      const status = r.warehouse ? approvalStatus(r.warehouse) : null;
      return <tr key={r.id}><td><strong>{r.company}</strong><small>#{r.id} · {r.name} · {r.phone}{w ? ` · ${w.role}` : ''}</small></td><td>{r.regionDetail || r.region}</td><td>{w ? `${w.facilityType} · ${warehouseAreaLabel(w) || w.areaValue} · ${w.temperatures.join('·')}` : r.volume}</td><td>{w ? `${w.rent || '임대료 협의'} / 보증금 ${w.deposit || '협의'}` : '-'}</td><td><span className="status-tag">{r.warehouse?.stage || `예전 상담폼 · ${r.stage}`}</span></td><td>{status ? <span className={`status-tag approval-${approvalTone(status)}`}>{status}</span> : '-'}</td><td>{r.mailStatus === 'failed' ? '발송 실패 · 직접 확인' : r.mailStatus === 'sent' ? '발송' : r.mailStatus === 'pending' ? '대기' : '미설정'}</td><td><button className="text-button" onClick={() => setActive(active === r.id ? null : r.id)}>{active === r.id ? '접기' : '정보 확인·보완'}</button></td></tr>;
    })}</tbody></table></div>
    {!filtered.length && <p className="partner-empty">{inquiries.length ? '검색 조건에 맞는 등록이 없습니다.' : '아직 등록된 창고가 없습니다.'}</p>}
    {current && <div className="admin-editor"><div className="section-title"><h3>{current.company} · #{current.id}</h3><button className="text-button" onClick={() => setActive(null)}>편집 닫기</button></div>{current.warehouse ? <WarehouseAdminEditor key={current.id} id={current.id} initial={current.warehouse} /> : <><p>예전 상담 양식으로 접수된 창고입니다. 아래 내용을 확인하고 상담 접수 탭에서 담당자·진행 상태를 관리해 주세요. 공개하려면 매물 관리에서 직접 등록합니다.</p><pre className="partner-legacy">{current.note || '추가 내용 없음'}</pre></>}</div>}
  </>;
}

function WarehouseAdminEditor({ id, initial }: { id: number; initial: WarehouseView }) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [stage, setStage] = useState<PartnerStage>(initial.stage);
  const [review, setReview] = useState({ reviewer: initial.review?.reviewer ?? '', documents: initial.review?.documents ?? '미확인', notes: initial.review?.notes ?? '' });
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  return <><p className="muted small">조건을 확인한 뒤 아래 ‘승인하고 창고 목록에 공개’를 누르면 바로 공개됩니다. 연락처·상세 주소·사진 링크는 공개되지 않습니다.</p>
    <WarehouseProfileEditor key={view.revision} view={view} adminControls={<><div className="form-grid"><label className="form-field"><span>자료 검토 상태</span><select value={review.documents} onChange={e => setReview({ ...review, documents: e.target.value })}>{['미확인', '보완 요청', '확인'].map(v => <option key={v}>{v}</option>)}</select></label><label className="form-field"><span>자료 확인 담당자</span><input value={review.reviewer} maxLength={100} onChange={e => setReview({ ...review, reviewer: e.target.value })} /></label></div><label className="form-field"><span>자료 검토·보완 메모 (내부)</span><textarea value={review.notes} maxLength={1000} onChange={e => setReview({ ...review, notes: e.target.value })} /></label>{initial.review?.checkedAt && <p className="muted small">최근 검토 기록: {new Date(initial.review.checkedAt).toLocaleString('ko-KR')}</p>}<label className="form-field"><span>검토 상태</span><select aria-label="검토 상태" value={stage} onChange={e => setStage(e.target.value as PartnerStage)}>{partnerStages.map(s => <option key={s}>{s}</option>)}</select></label></>} onSave={async (profile, revision) => {
      const result = await saveWarehouseReview(id, revision, profile, stage, review);
      if (!result.ok) throw new Error(result.error);
      setView(result); router.refresh(); return result;
    }} />
    <WarehouseApprovePanel id={id} view={view} onApproved={next => { setView(next); setStage(next.stage); router.refresh(); }} />
    <Link className="text-button" href={view.approval ? `/admin/listings/${view.approval.listingId}` : '/admin/listings/new'}>{view.approval ? '공개 매물 직접 수정' : '공개 매물 직접 만들기'}</Link>
    <details className="partner-link-tools"><summary>등록자에게 전달할 보완 링크 재발급</summary><p>저장하지 않은 수정사항은 먼저 저장하세요. 재발급 시 기존 링크는 즉시 무효화되고 새 링크는 30일간 유효합니다. 자동 발송되지 않습니다.</p><button className="button button-outline" disabled={pending} onClick={async () => {
      setPending(true); setError(''); setCopied(false);
      try { const result = await issueWarehouseLink(id); if (!result.ok) throw new Error(result.error); setView(v => ({ ...v, ...result })); setStage(result.stage); setLink(`${window.location.origin}/partnership/warehouse/manage#${id}.${result.token}`); router.refresh(); }
      catch (err) { setError(err instanceof Error ? err.message : '발급하지 못했습니다.'); }
      finally { setPending(false); }
    }}>{pending ? '발급 중…' : '새 보완 링크 발급'}</button>{link && <><label className="form-field"><span>새 보완 링크 · 등록자에게 직접 전달</span><input readOnly value={link} onFocus={e => e.target.select()} /></label><button className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setError('위 링크를 선택해 직접 복사해 주세요.'); } }}>링크 복사</button><p role="status">{copied ? '복사했습니다.' : ''}</p></>}{error && <p role="alert" className="field-error">{error}</p>}</details>
  </>;
}

function WarehouseApprovePanel({ id, view, onApproved }: { id: number; view: WarehouseView; onApproved: (next: WarehouseView) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const status = approvalStatus(view);
  const blocked = view.profile.disclosure === WAREHOUSE_PRIVATE_DISCLOSURE;
  const label = status === '미공개' ? '승인하고 창고 목록에 공개' : status === '변경 승인 대기' ? '변경 내용 승인·반영' : '최신 정보로 다시 반영';
  return <section className="partner-approve" aria-labelledby={`warehouse-approve-${id}`}>
    <h4 id={`warehouse-approve-${id}`}>창고 목록 공개 · {status}</h4>
    <p className="muted small">{blocked ? '등록자가 비공개 매칭만 희망했습니다. 등록자 동의를 받은 뒤 공개 희망 범위를 바꿔 저장해야 공개할 수 있습니다.'
      : status === '변경 승인 대기' ? '공개 후 등록자가 정보를 다시 저장했습니다. 승인하면 지역·면적·온도·임대료·보증금·입주 시점·층고·전력·소개가 목록에 반영됩니다. 담당자가 고친 검증 표시·태그·정렬은 유지됩니다.'
      : '승인하면 시·군·구와 읍·면·동, 시설 유형·면적·온도·임대료·보증금·입주 시점·층고·전력·소개로 창고 목록에 바로 공개합니다. 등록자·연락처·상세 주소·사진 링크는 공개하지 않습니다. 저장하지 않은 수정사항은 먼저 저장하세요.'}</p>
    {view.approval && <p className="muted small">마지막 승인 {new Date(view.approval.at).toLocaleString('ko-KR')}</p>}
    <button type="button" className="button button-dark" disabled={pending || blocked} onClick={async () => {
      setPending(true); setError('');
      try { const result = await approveWarehouse(id, view.revision); if (!result.ok) throw new Error(result.error); onApproved(result); }
      catch (err) { setError(err instanceof Error ? err.message : '공개하지 못했습니다.'); }
      finally { setPending(false); }
    }}>{pending ? '공개 중…' : label}</button>
    {error && <p role="alert" className="field-error">{error}</p>}
  </section>;
}
