import { useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';
import { Pagination } from '@docouno/unica';
import type { PaginationProps } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { arabicMessages } from './pagination-code.js';
import type { PaginationValues } from './pagination.spec.js';
import './pagination-matrix.css';

interface PlaygroundProps extends PreviewProps {
  readonly values: PaginationValues;
}

function subscribeToAddress(change: () => void): () => void {
  window.addEventListener('hashchange', change);
  return () => window.removeEventListener('hashchange', change);
}

function readAddress(): string {
  return window.location.hash;
}

function noAddress(): string {
  return '';
}

export function PaginationPlayground({ ctx, values }: PlaygroundProps): ReactElement {
  const { page, pageCount, defaultPage, size, format, getPageHref, renderLink, messages } = values;
  const address = useSyncExternalStore(subscribeToAddress, readAddress, noAddress);
  const linked = getPageHref === 'archive';
  const local = page === 'uncontrolled' && !linked;
  const initial = page === 'uncontrolled' ? 1 : Number(page);
  const prefix = `#result-pages-${ctx.theme.id}-${pageCount}-${initial}-`;
  const selected =
    linked && ctx.tab === 'playground' && address.startsWith(prefix)
      ? Number(address.slice(prefix.length))
      : initial;
  const action = ctx.action('onPageChange');
  const behavior: PaginationProps = linked
    ? {
        pageCount,
        page: selected,
        getPageHref: (number) => `${prefix}${number}`,
        renderLink: renderLink === 'custom' ? (props) => <a {...props} /> : undefined,
      }
    : {
        pageCount,
        ...(local ? { defaultPage } : { page: selected }),
        onPageChange: action,
      };

  return (
    <div
      className="pagination-preview"
      data-pagination-comparison={ctx.tab === 'states' ? format : undefined}
    >
      <Pagination
        {...ctx.subject}
        {...behavior}
        key={local ? `initial-${defaultPage}` : 'controlled'}
        size={size}
        format={format}
        aria-label={values['aria-label']}
        {...(messages === 'arabic' ? { dir: 'rtl', lang: 'ar', messages: arabicMessages } : {})}
      />
    </div>
  );
}
