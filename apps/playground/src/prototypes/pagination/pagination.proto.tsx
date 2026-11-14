import { useState } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import './pagination.css';

export interface PaginationProps extends ComponentPropsWithRef<'nav'> {
  readonly page?: number;
  readonly defaultPage?: number;
  readonly pageCount: number;
  readonly onPageChange?: (page: number) => void;
  readonly disabled?: boolean;
}

export function Pagination({
  page,
  defaultPage = 1,
  pageCount,
  onPageChange,
  disabled = false,
  className = '',
  ...props
}: PaginationProps): ReactElement {
  const [localPage, setLocalPage] = useState(defaultPage);
  const count = Math.max(1, Number.isFinite(pageCount) ? Math.floor(pageCount) : 1);
  const requested = page ?? localPage;
  const active = Math.min(
    count,
    Math.max(1, Number.isFinite(requested) ? Math.floor(requested) : 1),
  );
  const pages =
    count <= 7
      ? Array.from({ length: count }, (_, index) => index + 1)
      : [
          ...new Set([
            1,
            ...[active - 1, active, active + 1].filter((number) => number > 1 && number < count),
            count,
          ]),
        ];
  function select(next: number): void {
    if (page === undefined) {
      setLocalPage(next);
    }
    onPageChange?.(next);
  }
  return (
    <nav aria-label="Pagination" {...props} className={`pagination-proto ${className}`}>
      <button
        className="pagination-button-proto"
        type="button"
        aria-label="Previous page"
        disabled={disabled || active === 1}
        onClick={() => select(active - 1)}
      >
        <CaretLeftIcon className="pagination-arrow-proto" size="1em" aria-hidden="true" />
      </button>
      {pages.map((number, index) => (
        <span className="pagination-slot-proto" key={number}>
          {index > 0 && number - (pages[index - 1] ?? number) > 1 && (
            <span className="pagination-ellipsis-proto" aria-hidden="true">
              …
            </span>
          )}
          <button
            className="pagination-button-proto"
            type="button"
            disabled={disabled}
            aria-label={`Page ${number}`}
            aria-current={number === active ? 'page' : undefined}
            onClick={() => select(number)}
          >
            {number}
          </button>
        </span>
      ))}
      <button
        className="pagination-button-proto"
        type="button"
        aria-label="Next page"
        disabled={disabled || active === count}
        onClick={() => select(active + 1)}
      >
        <CaretRightIcon className="pagination-arrow-proto" size="1em" aria-hidden="true" />
      </button>
    </nav>
  );
}
