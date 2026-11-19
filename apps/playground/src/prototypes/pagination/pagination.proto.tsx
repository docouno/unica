import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import './pagination.css';

type PageStep = 'previous' | 'next';
type PagePreview = 'hover' | 'pressed' | 'focus';

export interface PaginationProps {
  readonly label?: string;
  readonly page?: number;
  readonly defaultPage?: number;
  readonly pageCount: number;
  readonly onPageChange?: (page: number) => void;
  readonly getPageHref?: (page: number) => string;
  readonly format?: 'pages' | 'compact';
  readonly size?: 's' | 'm' | 'l';
  readonly preview?: Partial<Record<number | PageStep, PagePreview>>;
}

function pageWindow(current: number, total: number): readonly (number | 'start-gap' | 'end-gap')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'end-gap', total];
  }
  if (current >= total - 3) {
    return [1, 'start-gap', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'start-gap', current - 1, current, current + 1, 'end-gap', total];
}

function PagePosition({
  page,
  total,
  sizing = false,
}: {
  page: number;
  total: number;
  sizing?: boolean;
}): ReactElement {
  return (
    <span
      className={sizing ? 'pagination-summary-width-proto' : undefined}
      aria-hidden={sizing || undefined}
      dir="auto"
    >
      <span className="pagination-summary-part-proto">
        Page <strong>{page}</strong>
      </span>{' '}
      <span className="pagination-summary-part-proto">of {total}</span>
    </span>
  );
}

export function Pagination({
  label = 'Pagination',
  page,
  defaultPage = 1,
  pageCount,
  onPageChange,
  getPageHref,
  format,
  size = 'm',
  preview,
}: PaginationProps): ReactElement | null {
  const [localPage, setLocalPage] = useState(defaultPage);
  const track = useRef<HTMLUListElement>(null);
  const pendingFocus = useRef<{ page: number; target: HTMLElement; fallback: PageStep }>(null);
  const requested = page ?? localPage;
  const active = Math.min(
    pageCount,
    Math.max(1, Number.isFinite(requested) ? Math.trunc(requested) : 1),
  );

  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    pendingFocus.current = null;
    if (
      !pending ||
      pending.page !== active ||
      (document.activeElement !== document.body && document.activeElement !== pending.target)
    ) {
      return;
    }
    const current = track.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const fallback = track.current?.querySelector<HTMLElement>(
      `[data-pagination-step="${pending.fallback}"]`,
    );
    const destination = current?.getClientRects().length ? current : fallback;
    destination?.focus({ preventScroll: true });
  }, [active]);

  if (!Number.isSafeInteger(pageCount) || pageCount < 2) {
    return null;
  }

  const pages = pageWindow(active, pageCount);
  const geometry = {
    '--pagination-slots': pages.length,
    '--pagination-digits': String(pageCount).length,
  } as CSSProperties;

  function rememberBoundaryFocus(number: number, target: HTMLElement, step?: PageStep): void {
    pendingFocus.current =
      step && (number === 1 || number === pageCount) && document.activeElement === target
        ? { page: number, target, fallback: step === 'next' ? 'previous' : 'next' }
        : null;
  }

  function cell(number: number, name: string, content: ReactNode, step?: PageStep): ReactElement {
    const current = !step && number === active;
    const unavailable = number < 1 || number > pageCount;
    const common = {
      className: 'pagination-cell-proto',
      'aria-label': name,
      'aria-current': current ? ('page' as const) : undefined,
      'data-pagination-step': step,
      'data-preview': preview?.[step ?? number],
    };

    if (getPageHref) {
      return unavailable ? (
        <span {...common} role="link" aria-disabled="true">
          {content}
        </span>
      ) : (
        <a
          {...common}
          href={getPageHref(number)}
          onClick={(event) => {
            if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
              rememberBoundaryFocus(number, event.currentTarget, step);
            }
          }}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        {...common}
        type="button"
        disabled={unavailable}
        onClick={(event) => {
          if (current) {
            return;
          }
          rememberBoundaryFocus(number, event.currentTarget, step);
          if (page === undefined) {
            setLocalPage(number);
          }
          onPageChange?.(number);
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <nav className="pagination-proto" aria-label={label} data-size={size} style={geometry}>
      <div className="pagination-fit-proto" data-format={format}>
        <ul
          className="pagination-track-proto"
          role="list"
          ref={track}
          onBlur={(event) => {
            if (
              event.relatedTarget ||
              !event.target.closest('.pagination-number-proto') ||
              event.target.getClientRects().length
            ) {
              return;
            }
            const step = active === pageCount ? 'previous' : 'next';
            event.currentTarget
              .querySelector<HTMLElement>(`[data-pagination-step="${step}"]`)
              ?.focus({ preventScroll: true });
          }}
        >
          <li>
            {cell(
              active - 1,
              'Previous page',
              <CaretLeftIcon className="pagination-arrow-proto" weight="bold" aria-hidden="true" />,
              'previous',
            )}
          </li>
          <li className="pagination-summary-proto">
            <PagePosition page={pageCount} total={pageCount} sizing />
            <PagePosition page={active} total={pageCount} />
          </li>
          {pages.map((item) =>
            typeof item === 'number' ? (
              <li className="pagination-number-proto" key={item}>
                {cell(item, `Page ${item}`, item)}
              </li>
            ) : (
              <li className="pagination-gap-proto" key={item} aria-hidden="true">
                …
              </li>
            ),
          )}
          <li>
            {cell(
              active + 1,
              'Next page',
              <CaretRightIcon
                className="pagination-arrow-proto"
                weight="bold"
                aria-hidden="true"
              />,
              'next',
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
