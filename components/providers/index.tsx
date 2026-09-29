'use client';

import type { ReactNode } from 'react';
import { CompareProvider } from './compare-provider';
import { ToastProvider } from './toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <CompareProvider>{children}</CompareProvider>
    </ToastProvider>
  );
}
