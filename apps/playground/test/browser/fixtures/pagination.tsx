import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Pagination } from '@docouno/unica';
import type { PaginationLinkProps } from '@docouno/unica';

type Mode = 'controlled' | 'route' | 'local';

export default function PaginationFixture(): ReactElement {
  const [page, setPage] = useState(12);
  const [mode, setMode] = useState<Mode>('controlled');
  const [count, setCount] = useState(24);
  const [requests, setRequests] = useState<number[]>([]);
  const [focusDestination, setFocusDestination] = useState(false);
  const [cancelLink, setCancelLink] = useState(false);
  const [submits, setSubmits] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const focusDocumentOnAttach = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  function requestPage(next: number): void {
    setRequests((before) => [...before, next]);
  }

  function renderLink({ href, ref, ...props }: PaginationLinkProps): ReactElement {
    return (
      <a
        key={href}
        {...props}
        href={href}
        ref={(node) => {
          if (node && focusDocumentOnAttach.current && props['aria-label'] === 'Next page') {
            focusDocumentOnAttach.current = false;
            node.ownerDocument.body.tabIndex = -1;
            node.ownerDocument.body.focus();
          }
          if (typeof ref === 'function') {
            return ref(node);
          }
          if (ref) {
            ref.current = node;
          }
        }}
        onClick={(event) => {
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          ) {
            return;
          }
          event.preventDefault();
          setPage(Number(new URL(href, document.baseURI).searchParams.get('page')));
          if (focusDestination) {
            heading.current?.focus();
          }
        }}
      />
    );
  }

  const behavior =
    mode === 'route'
      ? { page, getPageHref: (next: number) => `?page=${next}`, renderLink }
      : mode === 'local'
        ? { defaultPage: 1, onPageChange: requestPage }
        : { page, onPageChange: requestPage };

  return (
    <>
      <button type="button">Filter</button>
      <div data-testid="pager-width" style={{ inlineSize: 600, padding: 4 }}>
        <Pagination
          {...behavior}
          pageCount={count}
          aria-label="Results"
          onClickCapture={(event) => {
            if (cancelLink) {
              event.preventDefault();
            }
          }}
        />
      </div>
      <button type="button">After results</button>
      <h2 ref={heading} tabIndex={-1}>
        Destination
      </h2>
      <button onClick={() => setPage(22)}>Commit page 22</button>
      <button onClick={() => setPage(13)}>Commit page 13</button>
      <button onClick={() => setPage(24)}>Commit page 24</button>
      <button onClick={() => setPage(1)}>Commit page 1</button>
      <button onClick={() => setCount((value) => (value === 24 ? 1 : 24))}>Toggle range</button>
      <button onClick={() => setMode('route')}>Use route</button>
      <button onClick={() => setMode('local')}>Use local buttons</button>
      <button onClick={() => setFocusDestination(true)}>Focus destination on route</button>
      <button
        onClick={() => {
          focusDocumentOnAttach.current = true;
        }}
      >
        Focus document on route attach
      </button>
      <button onClick={() => setCancelLink(true)}>Cancel link clicks</button>
      <button onClick={() => dialog.current?.showModal()}>Open modal</button>
      <dialog ref={dialog}>
        <div style={{ inlineSize: 220, padding: 4 }}>
          <Pagination pageCount={2} aria-label="Modal pages" />
        </div>
        <button onClick={() => dialog.current?.close()}>Close modal</button>
      </dialog>
      <output data-testid="requests">{JSON.stringify(requests)}</output>

      <form
        id="pagination-form"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits((value) => value + 1);
        }}
      >
        <input name="query" defaultValue="release" aria-label="Query" />
        <fieldset disabled={disabled} style={{ inlineSize: 600 }}>
          <Pagination
            aria-label="Form pages"
            format="pages"
            pageCount={3}
            defaultPage={2}
            onPageChange={requestPage}
          />
        </fieldset>
        <button type="button" onClick={() => setDisabled((value) => !value)}>
          Toggle fieldset
        </button>
        <button type="reset">Reset query</button>
        <output data-testid="submits">{submits}</output>
      </form>
    </>
  );
}
