import { useEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Stack } from '@docouno/unica';
import { Pagination } from '../../prototypes/pagination/pagination.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import './pagination-studies.css';

function StudyRow({
  children,
  label,
  narrow = false,
  pinned = false,
}: {
  readonly children: ReactNode;
  readonly label: string;
  readonly narrow?: boolean;
  readonly pinned?: boolean;
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
        inert={pinned}
      >
        {children}
      </div>
    </div>
  );
}

export function PointerStates({ ctx }: PreviewProps): ReactElement {
  return (
    <StudyRow label="Scrollable pinned states" pinned>
      <Pagination
        {...ctx.subject}
        size="s"
        format="pages"
        pageCount={4}
        page={2}
        preview={{ 1: 'hover', 2: 'focus', 3: 'pressed', 4: 'focus' }}
        label="Pinned pointer and focus states"
      />
    </StudyRow>
  );
}

export function Boundaries({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={12}>
      <StudyRow label="Scrollable numbered boundaries">
        <Pagination
          {...ctx.subject}
          size="s"
          format="pages"
          pageCount={2}
          label="Two-page boundary example"
        />
      </StudyRow>
      <StudyRow label="Scrollable compact boundaries" narrow>
        <Pagination
          {...ctx.subject}
          size="s"
          format="compact"
          pageCount={2}
          label="Compact boundary example"
        />
      </StudyRow>
    </Stack>
  );
}

export function Compact({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={12}>
      <StudyRow label="Scrollable narrow pagination" narrow>
        <Pagination {...ctx.subject} pageCount={24} defaultPage={4} label="Compact pagination" />
      </StudyRow>
      <StudyRow label="Scrollable five-digit pagination" narrow>
        <Pagination
          {...ctx.subject}
          size="l"
          pageCount={12840}
          defaultPage={999}
          label="Compact five-digit pages"
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
    <StudyRow label="Scrollable numbered window">
      <Pagination
        {...ctx.subject}
        size={size}
        format="pages"
        pageCount={pageCount}
        defaultPage={page}
        label={`Numbered window, ${pageCount} pages`}
      />
    </StudyRow>
  );
}
