'use client';

import { useState } from 'react';
import { renewalChecklist, renewalChecklistCount } from '@/lib/renewal-checklist';

export function RenewalChecklist() {
  const [checked, setChecked] = useState<string[]>([]);
  const toggle = (id: string) => setChecked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  return <div className="renewal-checklist">
    <p className="renewal-progress" aria-live="polite"><strong>{checked.length}</strong> / {renewalChecklistCount}개 확인</p>
    <div className="renewal-groups">{renewalChecklist.map((group) => (
      <fieldset key={group.id}><legend>{group.title}</legend>{group.items.map((item) => {
        const id = `${group.id}-${item.id}`;
        return <label key={id}><input type="checkbox" checked={checked.includes(id)} onChange={() => toggle(id)} /><span>{item.label}</span></label>;
      })}</fieldset>
    ))}</div>
  </div>;
}
