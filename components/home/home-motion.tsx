'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Visible server-rendered content remains usable even without animation support. */
export function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations: Animation[] = [];
    let observer: IntersectionObserver | undefined;
    const easing = 'cubic-bezier(0.16, 1, 0.3, 1)';

    function stop() {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
    }

    if (!preference.matches && typeof container.animate === 'function') {
      const title = container.querySelector('#home-title');
      const picker = container.querySelector('.problem-picker');
      if (title) animations.push(title.animate([
        { opacity: 0.35, clipPath: 'inset(0 0 70% 0)', transform: 'translateY(12px)' },
        { opacity: 1, clipPath: 'inset(0 0 0 0)', transform: 'translateY(0)' },
      ], { duration: 700, easing }));
      if (picker) animations.push(picker.animate([
        { opacity: 0.5, transform: 'translateX(18px)' },
        { opacity: 1, transform: 'translateX(0)' },
      ], { duration: 650, easing }));

      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            // The numbered sequence traces conditions → candidates → comparison.
            entry.target.querySelectorAll('li').forEach((step, index) => {
              animations.push(step.animate([
                { opacity: 0.45, transform: 'translateY(14px)', borderTopColor: '#d7f275' },
                { opacity: 1, transform: 'translateY(0)', borderTopColor: '#257f75' },
              ], { duration: 500, delay: index * 110, easing }));
            });
            observer?.unobserve(entry.target);
          });
        }, { threshold: 0.15 });
        const steps = container.querySelector('.service-steps');
        if (steps) observer.observe(steps);
      }
    }
    preference.addEventListener('change', stop);
    return () => {
      stop();
      preference.removeEventListener('change', stop);
    };
  }, []);

  return <div ref={root} className="home-motion">{children}</div>;
}
