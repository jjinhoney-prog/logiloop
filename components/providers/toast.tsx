'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

const TOAST_DURATION_MS = 4000;

export type ToastTone = 'info' | 'warning';

type Notify = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<Notify>(() => {});

/** 화면 상단에 띄운다. 하단 비교 바·모바일 상담 버튼과 겹치지 않도록 위치와 색을 분리했다. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string; tone: ToastTone } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const tone = notice?.tone ?? 'info';
  const Icon = tone === 'warning' ? CircleAlert : CircleCheck;
  return (
    <ToastContext.Provider value={(message, tone = 'info') => setNotice({ message, tone })}>
      {children}
      <div role="status" className={`toast toast-${tone}${notice ? ' visible' : ''}`}>
        {notice && <Icon size={17} aria-hidden="true" />}
        {notice?.message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
