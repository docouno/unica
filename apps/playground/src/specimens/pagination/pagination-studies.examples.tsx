import { useEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Pagination, Stack } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import './pagination-studies.css';

function StudyRow({
  children,
  label,
  width,
  narrow = false,
}: {
  readonly children: ReactNode;
  readonly label: string;
  readonly width?: number;
  readonly narrow?: boolean;
}): ReactElement {
  const viewport = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const scroll = viewport.current;
    const content = row.current;
    if (!scroll || !content) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setOverflowing(scroll.scrollWidth > scroll.clientWidth);
    });
    observer.observe(scroll);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={viewport}
      className="pagination-example-scroll unica-scrollbar"
      role={overflowing ? 'region' : undefined}
      aria-label={overflowing ? label : undefined}
      tabIndex={overflowing ? 0 : undefined}
    >
      <div
        ref={row}
        className="pagination-example-row"
        data-narrow={narrow || undefined}
        style={width === undefined ? undefined : { inlineSize: width }}
      >
        {children}
      </div>
    </div>
  );
}

export function PointerStates({ ctx }: PreviewProps): ReactElement {
  return (
    <StudyRow label="Scrollable pointer and focus states" width={300}>
      <Pagination
        {...ctx.subject}
        size="s"
        format="pages"
        pageCount={4}
        defaultPage={2}
        aria-label="Pointer and focus states"
      />
    </StudyRow>
  );
}

export function Boundaries({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={12}>
      <StudyRow label="Scrollable numbered boundaries" width={200}>
        <Pagination
          {...ctx.subject}
          size="s"
          format="pages"
          pageCount={2}
          aria-label="Two-page boundary example"
        />
      </StudyRow>
      <StudyRow label="Scrollable compact boundaries" narrow>
        <Pagination
          {...ctx.subject}
          size="s"
          format="compact"
          pageCount={2}
          aria-label="Compact boundary example"
        />
      </StudyRow>
    </Stack>
  );
}

export function Compact({ ctx }: PreviewProps): ReactElement {
  const example = { pageCount: 24, defaultPage: 4, format: 'pages' } as const;
  return (
    <Stack gap={12}>
      <StudyRow label="Scrollable narrow pagination" narrow>
        <Pagination {...ctx.subject} {...example} aria-label="Narrow column pages" />
      </StudyRow>
      <StudyRow label="Scrollable wide pagination" width={480}>
        <Pagination {...ctx.subject} {...example} aria-label="Wide column pages" />
      </StudyRow>
      <StudyRow label="Scrollable five-digit pagination" narrow>
        <Pagination
          {...ctx.subject}
          size="l"
          pageCount={12840}
          defaultPage={999}
          aria-label="Compact five-digit pages"
        />
      </StudyRow>
    </Stack>
  );
}

export function NumberedWindow({
  ctx,
  pageCount,
  page,
  size,
}: PreviewProps & {
  readonly pageCount: number;
  readonly page: number;
  readonly size: 's' | 'm';
}): ReactElement {
  return (
    <StudyRow label="Scrollable numbered window" width={size === 's' ? 460 : 560}>
      <Pagination
        {...ctx.subject}
        size={size}
        format="pages"
        pageCount={pageCount}
        defaultPage={page}
        aria-label={`Numbered window, ${pageCount} pages`}
      />
    </StudyRow>
  );
}
