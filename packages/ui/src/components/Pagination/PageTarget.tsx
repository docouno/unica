import type { ReactElement, ReactNode, RefCallback } from 'react';
import type { PaginationLinkProps } from './types.js';

interface TargetProps {
  readonly page: number;
  readonly name: string;
  readonly children: ReactNode;
  readonly ref: RefCallback<HTMLElement>;
  readonly current?: boolean;
  readonly disabled?: boolean;
  readonly getPageHref: ((page: number) => string) | undefined;
  readonly renderLink: ((props: PaginationLinkProps) => ReactElement) | undefined;
  readonly requestPage: (page: number) => void;
}

/** Renders one page action or an unavailable link boundary. */
export function PageTarget({
  page,
  name,
  children,
  ref,
  current,
  disabled,
  getPageHref,
  renderLink,
  requestPage,
}: TargetProps): ReactElement {
  const common = {
    className: 'unica-pagination-cell',
    'aria-label': name,
    'aria-current': current ? ('page' as const) : undefined,
    children,
  };

  if (getPageHref) {
    if (disabled) {
      return <span {...common} role="link" aria-disabled="true" />;
    }
    const anchor: PaginationLinkProps = { ...common, href: getPageHref(page), ref };
    if (renderLink) {
      return renderLink(anchor);
    }
    return <a {...anchor} />;
  }

  return (
    <button
      {...common}
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={(event) => {
        if (!current && !event.defaultPrevented && !event.currentTarget.matches(':disabled')) {
          requestPage(page);
        }
      }}
    />
  );
}
