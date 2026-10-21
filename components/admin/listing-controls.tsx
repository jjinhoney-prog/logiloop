'use client';

import { useEffect, useId, useRef, useState, useTransition, type ReactNode, type RefObject } from 'react';
import Image from 'next/image';
import { ImageOff, Trash2, X, ZoomIn } from 'lucide-react';
import { removeListing } from '@/app/admin/actions';
import { useToast } from '@/components/providers/toast';

function ListingDialog({ title, onClose, children, photo = false, busy = false, returnFocus }: { title: string; onClose: () => void; children: ReactNode; photo?: boolean; busy?: boolean; returnFocus: RefObject<HTMLButtonElement | null> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const trigger = returnFocus.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLButtonElement>('[data-dialog-initial-focus]')?.focus();
    return () => { dialog?.close(); trigger?.focus(); };
  }, [returnFocus]);
  return <dialog ref={ref} className={`modal listing-dialog${photo ? ' listing-photo-dialog' : ''}`} aria-labelledby={titleId} aria-busy={busy} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="listing-dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" aria-label="닫기" disabled={busy} onClick={onClose}><X size={20} /></button></div>
    {children}
  </dialog>;
}

export function ListingPhoto({ name, imageUrl }: { name: string; imageUrl?: string }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const usable = imageUrl && (/^https?:\/\//i.test(imageUrl) || /^\/(?!\/)/.test(imageUrl));
  if (!usable || failed) return <span className="admin-photo-empty"><ImageOff size={22} aria-hidden="true" /><span>{failed ? '사진 로딩 실패' : '사진 없음'}</span></span>;
  return <>
    <button type="button" className="admin-photo-thumb" ref={trigger} aria-label={`${name} 사진 크게 보기`} onClick={() => setOpen(true)}>
      <Image src={imageUrl} alt={`${name} 대표 사진`} width={112} height={78} unoptimized onError={() => setFailed(true)} />
      <span><ZoomIn size={14} aria-hidden="true" />확대</span>
    </button>
    {open && <ListingDialog returnFocus={trigger} title={`${name} 사진`} photo onClose={() => setOpen(false)}>
      <Image src={imageUrl} alt={`${name} 대표 사진 확대`} width={1200} height={800} unoptimized onError={() => { setOpen(false); setFailed(true); }} />
      <button type="button" className="button button-outline" onClick={() => setOpen(false)} data-dialog-initial-focus>사진 닫기</button>
    </ListingDialog>}
  </>;
}

export function DeleteListingButton({ id, name, inquiryCount, disabled = false }: { id: string; name: string; inquiryCount: number; disabled?: boolean }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const notify = useToast();
  function remove() {
    setError('');
    startTransition(async () => {
      try {
        const result = await removeListing(id);
        if (!result.ok) { setError(result.error); return; }
        notify(`${name} 매물을 삭제했습니다.`);
        setOpen(false);
      } catch {
        setError('권한 또는 연결 상태를 확인한 뒤 다시 시도해 주세요.');
      }
    });
  }
  return <div className="admin-delete-control">
    <button type="button" className="text-button danger-text" ref={trigger} aria-label={`${name} 삭제`} disabled={disabled || pending || inquiryCount > 0} onClick={() => { setError(''); setOpen(true); }}><Trash2 size={14} />삭제</button>
    {inquiryCount > 0 && <small>상담 연결 · 보관 사용</small>}
    {open && <ListingDialog returnFocus={trigger} title="매물을 영구 삭제할까요?" busy={pending} onClose={() => setOpen(false)}>
      <p><strong>{name}</strong><br />매물 ID: {id}</p>
      <p>관리 목록과 공개 화면에서 삭제되며 복원할 수 없습니다. 연결된 원본 사진 파일은 삭제하지 않습니다.</p>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="listing-dialog-actions">
        <button type="button" className="button button-outline" disabled={pending} onClick={() => setOpen(false)} data-dialog-initial-focus>취소</button>
        <button type="button" className="button button-danger" disabled={pending} onClick={remove}>{pending ? '삭제 중…' : '영구 삭제'}</button>
      </div>
    </ListingDialog>}
  </div>;
}
