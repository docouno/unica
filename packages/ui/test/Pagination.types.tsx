import { createRef } from 'react';
import { Pagination } from '../src/index.js';
import type * as UI from '../src/index.js';
import type * as Server from '../src/server.js';

export function serverTypes(
  props: UI.PaginationProps,
  anchor: UI.PaginationLinkProps,
  messages: UI.PaginationMessages,
): [Server.PaginationProps, Server.PaginationLinkProps, Server.PaginationMessages] {
  return [props, anchor, messages];
}

const ref = createRef<HTMLElement>();
const href = (page: number): string => `/archive?page=${page}`;

export const local = <Pagination pageCount={24} defaultPage={4} ref={ref} data-results="pages" />;
export const controlled = (
  <Pagination pageCount={24} page={12} size="s" format="auto" messages={undefined} />
);
export const addressed = (
  <Pagination
    pageCount={24}
    page={12}
    getPageHref={href}
    renderLink={(anchor) => <a {...anchor} />}
    aria-labelledby="results"
  />
);

// @ts-expect-error A link destination requires a controlled page.
export const missingPage = <Pagination pageCount={24} getPageHref={href} />;
export const missingGetter = (
  // @ts-expect-error A link adapter requires a URL getter.
  <Pagination pageCount={24} page={4} renderLink={(p: UI.PaginationLinkProps) => <a {...p} />} />
);
// @ts-expect-error An initial page is only provided for local buttons.
export const conflictingPage = <Pagination pageCount={24} page={4} defaultPage={3} />;
export const conflictingChange = (
  // @ts-expect-error Addressed navigation uses the URL.
  <Pagination pageCount={24} page={4} getPageHref={href} onPageChange={() => {}} />
);
// @ts-expect-error Pagination owns the landmark semantics.
export const conflictingRole = <Pagination pageCount={24} role="tablist" />;
export const conflictingChildren = (
  // @ts-expect-error Pagination owns its contents.
  <Pagination pageCount={24}>
    <button />
  </Pagination>
);
