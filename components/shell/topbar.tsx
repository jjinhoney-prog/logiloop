'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { currentLabel } from './nav';

export function Topbar() {
  const path = usePathname();
  return (
    <header className="topbar">
      <div className="breadcrumb">
        플랫폼<span>/</span>
        <strong>{currentLabel(path)}</strong>
      </div>
      <div className="topbar-right">
        <span className="pilot-label">
          <span />
          프리뷰
        </span>
        <Link className="button button-dark button-small" href="/consultation">
          <Plus size={16} />
          상담 신청
        </Link>
      </div>
    </header>
  );
}
