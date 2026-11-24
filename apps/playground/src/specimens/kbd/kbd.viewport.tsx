import { useEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

export function KeyboardViewport({
  children,
  label,
}: {
  readonly children: ReactNode;
  readonly label: string;
}): ReactElement {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const scroll = viewport.current;
    const keys = content.current;
    if (!scroll || !keys) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setOverflowing(scroll.scrollWidth > scroll.clientWidth);
    });
    observer.observe(scroll);
    observer.observe(keys);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={viewport}
      className="kbd-preview-scroll unica-scrollbar"
      dir="ltr"
      role={overflowing ? 'region' : undefined}
      aria-label={overflowing ? label : undefined}
      tabIndex={overflowing ? 0 : undefined}
    >
      <span ref={content} className="kbd-preview-scroll-content">
        {children}
      </span>
    </div>
  );
}
