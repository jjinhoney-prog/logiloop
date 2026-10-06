'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

export function InfoTooltip({ label, text }: { label: string; text: string }) {
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return <span className="info-tooltip" ref={root}
    onPointerEnter={(event) => { if (event.pointerType === 'mouse') setOpen(true); }}
    onPointerLeave={(event) => { if (event.pointerType === 'mouse') setOpen(false); }}>
    <button type="button" className="info-trigger" aria-label={`${label} 안내`} aria-expanded={open}
      aria-describedby={open ? id : undefined} onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) setOpen(true); }} onBlur={() => setOpen(false)}
      onClick={() => setOpen(true)}>
      <Info size={18} aria-hidden="true" />
    </button>
    {open && <span id={id} role="tooltip" className="info-content">{text}</span>}
  </span>;
}
