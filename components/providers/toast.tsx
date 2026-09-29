'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const TOAST_DURATION_MS = 4000;

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <ToastContext.Provider value={setNotice}>
      {children}
      <div role="status" className={notice ? 'toast visible' : 'toast'}>
        {notice}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
