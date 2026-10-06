'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Footer } from './footer';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showConsultation = !['/consultation', '/partnership', '/admin'].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className={`app-shell${showConsultation ? ' has-mobile-consultation' : ''}`}>
      <a className="skip-link" href="#main">
        본문으로 이동
      </a>
      <button className="mobile-menu" aria-label={open ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
      {open && <button aria-label="메뉴 닫기" className="nav-backdrop" onClick={close} />}
      <Sidebar open={open} onNavigate={close} />
      <div className="main-wrap">
        <Topbar />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        {showConsultation && !open && <div className="mobile-consultation"><Link className="button button-dark" href="/consultation">상담 신청하기<ArrowRight size={17} /></Link></div>}
      </div>
    </div>
  );
}
