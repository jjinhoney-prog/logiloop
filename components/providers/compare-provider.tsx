'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { listings } from '@/lib/data';
import { COMPARE_LIMIT, sanitizeSelection, toggleSelection } from '@/lib/logic';
import { useToast } from './toast';
import { registerComparisonTools } from './webmcp';

/** 기존 프로토타입과 같은 키를 사용해 사용자의 비교함을 그대로 이어받는다. */
export const COMPARE_STORAGE_KEY = 'logiloop:compare';

const validIds = listings.map((item) => item.id);

interface CompareState {
  selected: string[];
  ready: boolean;
  toggle: (id: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareState | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const selectionRef = useRef<string[]>([]);
  const notify = useToast();

  useEffect(() => {
    selectionRef.current = selected;
  }, [selected]);

  // localStorage는 hydration 이후에만 읽는다. 서버 렌더에서는 빈 비교함으로 시작한다.
  useEffect(() => {
    try {
      const saved = sanitizeSelection(JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY) || '[]'), validIds);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage
      setSelected(saved);
      selectionRef.current = saved;
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(selected));
    } catch {}
  }, [selected, ready]);

  useEffect(() => {
    if (!ready) return;
    const lifecycle = new AbortController();
    registerComparisonTools({
      getSelection: () => selectionRef.current,
      setSelection: (ids) => {
        selectionRef.current = ids;
        setSelected(ids);
      },
      signal: lifecycle.signal,
    });
    return () => lifecycle.abort();
  }, [ready]);

  function toggle(id: string) {
    if (!selected.includes(id) && selected.length >= COMPARE_LIMIT) {
      notify('비교 후보는 최대 3개까지 담을 수 있습니다.');
      return;
    }
    setSelected((prev) => toggleSelection(prev, id));
  }

  return (
    <CompareContext.Provider value={{ selected, ready, toggle, clear: () => setSelected([]) }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used inside CompareProvider');
  return context;
}
