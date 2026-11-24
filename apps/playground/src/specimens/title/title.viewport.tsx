import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

export function HeadingViewport({ children }: { readonly children: ReactNode }): ReactElement {
  const [overflowing, setOverflowing] = useState(false);

  return (
    <div
      className="unica-scrollbar"
      style={{
        minInlineSize: 0,
        overflowX: 'auto',
        outlineColor: 'var(--focus-ring-color)',
        outlineOffset: 2,
      }}
      role={overflowing ? 'region' : undefined}
      aria-label={overflowing ? 'Scrollable single-line heading' : undefined}
      tabIndex={overflowing ? 0 : undefined}
      ref={(owner) => {
        if (!owner?.firstElementChild) {
          return;
        }
        const observer = new ResizeObserver(() => {
          setOverflowing(owner.scrollWidth > owner.clientWidth);
        });
        observer.observe(owner);
        observer.observe(owner.firstElementChild);
        return () => observer.disconnect();
      }}
    >
      <div style={{ minInlineSize: 'max-content' }}>{children}</div>
    </div>
  );
}
