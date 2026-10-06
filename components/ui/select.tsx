'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';

type Option = string | { value: string; label: string };

/** Controlled select-only combobox. The parent owns form values. */
export function Select({ label, value, options, onChange }: {
  label: string; value: string; options: readonly Option[]; onChange: (value: string) => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [above, setAbove] = useState(false);
  const search = useRef({ text: '', time: 0 });
  const items = options.map((option) => typeof option === 'string' ? { value: option, label: option } : option);
  const selected = Math.max(0, items.findIndex((option) => option.value === value));

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, id, open]);

  function show() {
    const rect = root.current?.getBoundingClientRect();
    setAbove(Boolean(rect && window.innerHeight - rect.bottom < 360 && rect.top > 280));
    setActive(selected);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(items[index].value);
    setOpen(false);
  }

  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const key = event.key;
    if (key === 'Tab') { setOpen(false); return; }
    if (key === 'Escape') { event.preventDefault(); setOpen(false); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
      event.preventDefault();
      if (!open) { show(); return; }
      if (key === 'Enter' || key === ' ') choose(active);
      else setActive(key === 'Home' ? 0 : key === 'End' ? items.length - 1 : Math.max(0, Math.min(items.length - 1, active + (key === 'ArrowDown' ? 1 : -1))));
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      search.current = { text: (now - search.current.time < 700 ? search.current.text : '') + key, time: now };
      const index = items.findIndex((item) => item.label.toLocaleLowerCase().startsWith(search.current.text.toLocaleLowerCase()));
      if (index >= 0) {
        if (!open) show();
        setActive(index);
      }
    }
  }

  return (
    <div className="custom-select" ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
    }}>
      <button type="button" className="select-trigger" role="combobox" aria-label={label}
        aria-expanded={open} aria-haspopup="listbox" aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => open ? setOpen(false) : show()} onKeyDown={keyDown}>
        <span>{items[selected]?.label}</span><ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div id={`${id}-list`} role="listbox" aria-label={label} className={`select-options${above ? ' select-above' : ''}`}>
        {items.map((item, index) => <div key={item.value} id={`${id}-${index}`} role="option"
          aria-selected={item.value === value} className={`select-option${active === index ? ' active' : ''}`}
          onPointerDown={(event) => event.preventDefault()} onPointerMove={() => setActive(index)} onClick={() => choose(index)}>
          <span>{item.label}</span>{item.value === value && <Check size={16} aria-hidden="true" />}
        </div>)}
      </div>}
    </div>
  );
}
