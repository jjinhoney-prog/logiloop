'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { currentLabel } from './nav';

export function Topbar() {
  const path = usePathname();
  return (
    <header className="topbar topbar-sticky">
      <div className="breadcrumb">
        플랫폼<span>/</span>
        <strong>{currentLabel(path)}</strong>
      </div>
      <div className="topbar-right">
        {!path.startsWith('/admin') && <Link className="button button-outline button-small warehouse-register" href="/partnership/warehouse">창고 임대 등록</Link>}
        {!path.startsWith('/admin') && <Link className="button button-yellow button-small partner-register" href="/partnership">3PL 업체 등록</Link>}
        <Link className="button button-dark button-small topbar-request" href="/consultation">
          <Plus size={16} />
          물류사·창고 찾기 요청
        </Link>
      </div>
    </header>
  );
}
