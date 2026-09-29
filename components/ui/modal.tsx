'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** 네이티브 <dialog> 기반 모달. 포커스 가두기·Esc 닫기는 브라우저가 처리한다. */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" aria-labelledby="modal-title" onClose={onClose}>
      <h2 id="modal-title">{title}</h2>
      {children}
      <button className="button button-dark" onClick={onClose} autoFocus>
        확인
      </button>
    </dialog>
  );
}
