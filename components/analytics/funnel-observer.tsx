'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackHomeAction, trackHomeVisit } from '@/lib/funnel-client';
import { funnelPlacements, type FunnelPlacement } from '@/lib/funnel';

export function FunnelObserver() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== '/') return;
    trackHomeVisit();
    function click(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.origin !== window.location.origin || link.pathname !== '/consultation') return;
      const raw = link.dataset.funnelPlacement;
      const placement = funnelPlacements.includes(raw as FunnelPlacement) ? raw as FunnelPlacement : 'navigation';
      trackHomeAction('request_click', placement);
    }
    document.addEventListener('click', click);
    return () => document.removeEventListener('click', click);
  }, [pathname]);
  return null;
}
