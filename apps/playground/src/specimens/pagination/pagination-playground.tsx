import type { ReactElement } from 'react';
import { Pagination } from '../../prototypes/pagination/pagination.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import type { PaginationValues } from './pagination.spec.js';
import './pagination-matrix.css';

interface PlaygroundProps extends PreviewProps {
  readonly values: PaginationValues;
}

export function PaginationPlayground({
  ctx,
  values: { page, pageCount, defaultPage, size, format, label },
}: PlaygroundProps): ReactElement {
  const uncontrolled = page === 'uncontrolled';

  return (
    <div
      className="pagination-preview"
      data-pagination-comparison={ctx.tab === 'states' ? format : undefined}
    >
      <Pagination
        {...ctx.subject}
        key={uncontrolled ? `initial-${defaultPage}` : 'controlled'}
        pageCount={pageCount}
        {...(uncontrolled ? { defaultPage } : { page: Number(page) })}
        size={size}
        {...(format === 'auto' ? {} : { format })}
        {...(label.trim() ? { label } : {})}
        onPageChange={ctx.action('onPageChange')}
      />
    </div>
  );
}
