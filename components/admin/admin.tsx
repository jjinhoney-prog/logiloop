'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Archive, ArrowUpRight, ClipboardList, Eye, EyeOff, Filter, LogOut, MailWarning, Pencil, Plus, RotateCcw, Save, Warehouse, X } from 'lucide-react';
import { changeListingVisibility, logout, saveInquiryProgress, type ActionResult } from '@/app/admin/actions';
import { useToast } from '@/components/providers/toast';
import { DemoNotice, Empty, PageHeading } from '@/components/ui';
import { inquiryStages, listingHref, tiers, visibilityLabels } from '@/lib/data';
import { formatKst } from '@/lib/inquiry-email';
import type { AdminListing, InquiryRecord, InquiryStage, MailStatus, Visibility } from '@/lib/types';

export type AdminTab = 'inquiries' | 'listings';

const mailLabels: Record<MailStatus, string> = { pending: '발송 대기', sent: '발송', failed: '발송 실패', skipped: '메일 미설정' };

export default function Admin({ dbReady, inquiries, listings, initialTab }: { dbReady: boolean; inquiries: InquiryRecord[]; listings: AdminListing[]; initialTab: AdminTab }) {
  const [tab, setTab] = useState<AdminTab>(initialTab);
  const [stage, setStage] = useState<'전체' | InquiryStage>('전체');
  const [active, setActive] = useState<number | null>(null);

  const filtered = inquiries.filter((r) => stage === '전체' || r.stage === stage);
  const current = inquiries.find((r) => r.id === active);
  const stats = [
    [ClipboardList, '신규 접수', `${inquiries.filter((r) => r.stage === '접수').length}건`, '아직 연락하지 않은 상담'],
    [MailWarning, '메일 발송 실패', `${inquiries.filter((r) => r.mailStatus === 'failed').length}건`, 'DB에는 저장됨 · 직접 확인 필요'],
    [Warehouse, '공개 매물', `${listings.filter((l) => l.visibility === 'published').length} / ${listings.length}`, '비공개·보관 매물은 공개 화면에 나오지 않음'],
  ] as const;

  return (
    <div className="page admin-page">
      <PageHeading eyebrow="OPERATIONS WORKSPACE" title="운영 워크스페이스" description="상담 접수와 매물 노출을 관리합니다.">
        <div className="admin-actions">
          <Link className="button button-dark" href="/admin/listings/new">
            <Plus size={16} />
            매물 등록
          </Link>
          <form action={logout}>
            <button className="button button-outline" type="submit">
              <LogOut size={16} />
              로그아웃
            </button>
          </form>
        </div>
      </PageHeading>
      {!dbReady ? (
        <DemoNotice>DB 연결 전입니다. SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 등록하면 저장된 상담과 매물이 여기에 표시됩니다. 지금 공개 화면에는 예시 7건이 보입니다.</DemoNotice>
      ) : (
        <>
          <DemoNotice>고객 개인정보가 표시됩니다. 화면 캡처·외부 공유를 하지 마세요. 종결 상담은 1년 뒤 파기합니다(docs/db-design.md §7).</DemoNotice>
          <div className="stats-grid">
            {stats.map(([Icon, label, value, note]) => (
              <div className="stat-card" key={label}>
                <span>
                  {label}
                  <Icon size={20} />
                </span>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            ))}
          </div>
          <div className="admin-tabs" role="tablist" aria-label="관리 화면">
            <button role="tab" id="inquiries-tab" aria-controls="admin-panel" aria-selected={tab === 'inquiries'} onClick={() => setTab('inquiries')}>
              상담 접수<span>{inquiries.length}</span>
            </button>
            <button role="tab" id="listings-tab" aria-controls="admin-panel" aria-selected={tab === 'listings'} onClick={() => setTab('listings')}>
              매물 관리<span>{listings.length}</span>
            </button>
          </div>
          <section className="panel admin-table-panel" id="admin-panel" role="tabpanel" aria-labelledby={tab === 'inquiries' ? 'inquiries-tab' : 'listings-tab'}>
            {tab === 'inquiries' ? (
              <>
                <div className="admin-table-top">
                  <h2>상담 접수 목록</h2>
                  <label>
                    <Filter size={15} />
                    <select aria-label="진행 상태 필터" value={stage} onChange={(e) => setStage(e.target.value as typeof stage)}>
                      <option>전체</option>
                      {inquiryStages.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>접수</th>
                        <th>회사·담당자</th>
                        <th>유형</th>
                        <th>검토 후보</th>
                        <th>진행 상태</th>
                        <th>담당자</th>
                        <th>메일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id} className={active === r.id ? 'row-active' : ''}>
                          <td>
                            #{r.id}
                            <small>{formatKst(new Date(r.createdAt))}</small>
                          </td>
                          <td>
                            <button className="table-title" onClick={() => setActive(active === r.id ? null : r.id)}>
                              {r.company}
                              <ArrowUpRight size={15} />
                            </button>
                            <small>
                              {r.name} · {r.phone}
                            </small>
                          </td>
                          <td>{r.kind === 'partnership' ? `파트너 · ${r.help}` : `${r.tier}등급 ${tiers.find((t) => t.id === r.tier)?.name ?? ''}`}</td>
                          <td>{r.listings.map((l) => l.name).join(', ') || '—'}</td>
                          <td>
                            <span className="status-tag">{r.stage}</span>
                          </td>
                          <td>{r.owner || '미배정'}</td>
                          <td>
                            <span className={r.mailStatus === 'failed' ? 'status-tag amber' : 'status-tag'}>{mailLabels[r.mailStatus]}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!filtered.length && <Empty title={inquiries.length ? '해당 상태의 상담이 없습니다.' : '아직 접수된 상담이 없습니다.'} />}
                {current && <InquiryEditor key={current.id} inquiry={current} onClose={() => setActive(null)} />}
              </>
            ) : (
              <ListingTable listings={listings} />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function useAction() {
  const [pending, startTransition] = useTransition();
  const notify = useToast();
  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      try {
        const result = await action();
        notify(result.ok ? success : result.error);
      } catch {
        notify('권한이 없거나 연결이 끊겼습니다. 다시 로그인해 주세요.');
      }
    });
  }
  return [pending, run] as const;
}

function InquiryEditor({ inquiry, onClose }: { inquiry: InquiryRecord; onClose: () => void }) {
  const [stage, setStage] = useState<InquiryStage>(inquiry.stage);
  const [owner, setOwner] = useState(inquiry.owner);
  const [nextAction, setNextAction] = useState(inquiry.nextAction);
  const [pending, run] = useAction();
  const details: [string, string][] = [
    ['연락처', `${inquiry.name} · ${inquiry.phone}`],
    ['품목 · 물량', `${inquiry.item || '미입력'} · ${inquiry.volume}`],
    ['지역', inquiry.regionDetail ? `${inquiry.region} · ${inquiry.regionDetail}` : inquiry.region],
    ['시점 · 온도', `${inquiry.timing} · ${inquiry.temperature}`],
    ['검토 후보', inquiry.listings.map((l) => l.name).join(', ') || '미정'],
    ['유입경로', inquiry.source],
    ['요청사항', inquiry.note || '없음'],
  ];
  return (
    <div className="admin-editor">
      <div className="section-title">
        <h3>
          #{inquiry.id} {inquiry.company}
        </h3>
        <button aria-label="상담 편집 닫기" onClick={onClose}>
          <X size={19} />
        </button>
      </div>
      <dl className="spec-grid admin-detail">
        {details.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="form-grid">
        <label className="form-field">
          <span>진행 상태</span>
          <select value={stage} onChange={(e) => setStage(e.target.value as InquiryStage)}>
            {inquiryStages.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>담당자</span>
          <input value={owner} maxLength={40} onChange={(e) => setOwner(e.target.value)} placeholder="미배정" />
        </label>
        <label className="form-field">
          <span>다음 확인 사항</span>
          <input value={nextAction} maxLength={100} onChange={(e) => setNextAction(e.target.value)} placeholder="예: 차량 진입 조건 확인" />
        </label>
      </div>
      <button className="button button-dark" disabled={pending} aria-busy={pending} onClick={() => run(() => saveInquiryProgress(inquiry.id, { stage, owner, nextAction }), '상담 진행 상태를 저장했습니다.')}>
        <Save size={16} />
        {pending ? '저장 중…' : '저장'}
      </button>
    </div>
  );
}

function ListingTable({ listings }: { listings: AdminListing[] }) {
  const [pending, run] = useAction();
  const change = (item: AdminListing, visibility: Visibility, message: string) => run(() => changeListingVisibility(item.id, visibility), message);
  return (
    <>
      <div className="admin-table-top">
        <h2>매물 목록</h2>
        <span className="muted small">신규 등록은 비공개 · 삭제 대신 보관</span>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>매물</th>
              <th>유형</th>
              <th>노출</th>
              <th>문의</th>
              <th>수정</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <small>
                    {item.id} · {item.region} · {item.district}
                  </small>
                </td>
                <td>{item.type === 'warehouse' ? '창고' : '3PL'}</td>
                <td>
                  <span className={item.visibility === 'published' ? 'status-tag' : 'status-tag amber'}>{visibilityLabels[item.visibility]}</span>
                </td>
                <td>{item.inquiryCount}건</td>
                <td>{formatKst(new Date(item.updatedAt))}</td>
                <td className="admin-row-actions">
                  <Link className="text-button" href={`/admin/listings/${item.id}`}>
                    <Pencil size={14} />
                    수정
                  </Link>
                  {item.visibility === 'published' && (
                    <>
                      <Link className="text-button" href={listingHref(item)} target="_blank">
                        보기
                      </Link>
                      <button className="text-button" disabled={pending} onClick={() => change(item, 'hidden', `${item.name}을(를) 비공개로 바꿨습니다.`)}>
                        <EyeOff size={14} />
                        비공개
                      </button>
                    </>
                  )}
                  {item.visibility === 'hidden' && (
                    <>
                      <button className="text-button" disabled={pending} onClick={() => change(item, 'published', `${item.name}을(를) 공개했습니다.`)}>
                        <Eye size={14} />
                        공개
                      </button>
                      <button className="text-button" disabled={pending} onClick={() => change(item, 'archived', `${item.name}을(를) 보관했습니다.`)}>
                        <Archive size={14} />
                        보관
                      </button>
                    </>
                  )}
                  {item.visibility === 'archived' && (
                    <button className="text-button" disabled={pending} onClick={() => change(item, 'hidden', `${item.name}을(를) 비공개로 복원했습니다.`)}>
                      <RotateCcw size={14} />
                      복원
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!listings.length && <Empty title="등록된 매물이 없습니다." description="‘매물 등록’으로 첫 매물을 비공개 상태로 등록하세요." />}
    </>
  );
}
