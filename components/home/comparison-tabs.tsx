'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

const labels = ['물류 위탁', '창고 임차'];

export function ComparisonTabs({ outsource, space }: { outsource: ReactNode; space: ReactNode }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % labels.length; break;
      case 'ArrowLeft': next = (index + labels.length - 1) % labels.length; break;
      case 'Home': next = 0; break;
      case 'End': next = labels.length - 1; break;
      default: return;
    }
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="comparison-tabs">
      <div className="comparison-tab-list" role="tablist" aria-label="비교할 운영방식">
        {labels.map((label, index) => (
          <button
            key={label}
            ref={(element) => { tabs.current[index] = element; }}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => navigate(event, index)}
          >
            {label}
          </button>
        ))}
      </div>
      {[outsource, space].map((content, index) => (
        <div
          key={labels[index]}
          id={`${id}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          tabIndex={0}
          hidden={active !== index}
          className="comparison-tab-panel"
        >
          {content}
        </div>
      ))}
    </div>
  );
}
