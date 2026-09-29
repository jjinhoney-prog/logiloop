'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Handshake, Settings2 } from 'lucide-react';
import { useCompare } from '@/components/providers/compare-provider';
import { isActive, navigation } from './nav';

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const path = usePathname();
  const { selected } = useCompare();
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <Link className="brand" href="/" onClick={onNavigate}>
        <span className="brand-icon">↔</span>
        <div>
          logiloop<span>로지루프 by 지음</span>
        </div>
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
          전국 물류 네트워크를 향해
          <p>지역의 경계를 넘어, 조건 중심으로.</p>
        </div>
        <Link className="side-secondary" href="/partnership" onClick={onNavigate}>
          <Handshake size={18} />
          파트너 참여
          <ArrowUpRight size={16} />
        </Link>
        <Link className="side-secondary" href="/admin" onClick={onNavigate}>
          <Settings2 size={18} />
          운영 워크스페이스
          <span className="tiny-badge">DEMO</span>
        </Link>
        <div className="side-copyright">© LOGILOOP · 지음부동산중개법인(주)</div>
      </div>
    </aside>
  );
}
