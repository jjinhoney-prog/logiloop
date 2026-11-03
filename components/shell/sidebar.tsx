'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Handshake, Settings2, ClipboardList } from 'lucide-react';
import { useCompare } from '@/components/providers/compare-provider';
import { LOGO_TONE, Logo } from './logo';
import { isActive, navigation } from './nav';

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const path = usePathname();
  const { selected } = useCompare();
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <Link className="brand" href="/" onClick={onNavigate}>
        <Logo tone={LOGO_TONE.white} />
        <span className="brand-sub">로지루프 by 지음</span>
      </Link>
      <div className="nav-label">YOUR NEXT LOGISTICS</div>
      <nav aria-label="주 메뉴">
        {navigation.map(({ href, title, icon: Icon }) => {
          const active = isActive(href, path);
          return (
            <Link key={href} href={href} onClick={onNavigate} className={active ? 'nav-link active' : 'nav-link'} aria-current={active ? 'page' : undefined}>
              <Icon size={20} />
              <span>{title}</span>
              {href === '/compare' && <b className="nav-count">{selected.length}</b>}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="region-note">
          <span className="live-dot" />
          전국 물류사·창고 검토
          <p>희망 지역과 조건에 맞는 후보를 검토합니다.</p>
        </div>
        <Link className="side-secondary sidebar-partner-register" href="/partnership" onClick={onNavigate}>
          <Handshake size={18} />
          3PL 업체 등록
          <ArrowUpRight size={16} />
        </Link>
        <Link className="side-secondary" href="/admin" onClick={onNavigate}>
          <Settings2 size={18} />
          운영 워크스페이스
          <span className="tiny-badge">관리자</span>
        </Link>
        <Link className="side-secondary" href="/admin/quotes" onClick={onNavigate} aria-current={path === '/admin/quotes' ? 'page' : undefined}>
          <ClipboardList size={18} />
          3PL 견적 관리
          <span className="tiny-badge">관리자</span>
        </Link>
        <div className="side-copyright">© LOGILOOP · 지음부동산중개법인(주)</div>
      </div>
    </aside>
  );
}
