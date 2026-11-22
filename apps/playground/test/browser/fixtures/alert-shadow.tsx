import { Alert, AlertActions, AlertClose } from '@docouno/unica';
import { createElement, useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { JSX } from 'react';
import { createPortal } from 'react-dom';

export default function AlertShadowFixture(): JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const [roots, setRoots] = useState<{ readonly outer: ShadowRoot; readonly nested: ShadowRoot }>();
  const [text, setText] = useState<string | null>('Recovery guide');
  const [requests, setRequests] = useState(0);
  const [name, setName] = useState('Draft schema');
  const [embedded, setEmbedded] = useState(false);
  const [late, setLate] = useState(false);
  const [headingRoot, setHeadingRoot] = useState<ShadowRoot>();
  const attachHeading = useCallback((element: HTMLSpanElement | null) => {
    if (element) {
      setHeadingRoot(element.shadowRoot ?? element.attachShadow({ mode: 'open' }));
    }
  }, []);

  useLayoutEffect(() => {
    const element = host.current;
    if (!element) {
      return;
    }
    const outer = element.attachShadow({ mode: 'open' });
    const nestedHost = element.ownerDocument.createElement('div');
    outer.append(nestedHost);
    setRoots({ outer, nested: nestedHost.attachShadow({ mode: 'open' }) });
  }, []);

  return (
    <>
      <h2 id="source">Outside the shadow tree</h2>
      <button type="button" onClick={() => setText('')}>
        Clear assigned text
      </button>
      <button type="button" onClick={() => setText(null)}>
        Remove assigned heading
      </button>
      <button type="button" onClick={() => setText('Service guide')}>
        Add assigned heading
      </button>
      <button
        type="button"
        onClick={() => {
          setEmbedded(true);
          setText('Component guide');
        }}
      >
        Use embedded heading
      </button>
      <button type="button" onClick={() => setText('Updated component guide')}>
        Update embedded heading
      </button>
      <button type="button" onClick={() => setLate(true)}>
        Insert undefined heading element
      </button>
      <button
        type="button"
        onClick={() => {
          customElements.define(
            'late-alert-heading',
            class extends HTMLElement {
              connectedCallback(): void {
                this.attachShadow({ mode: 'open' }).textContent = 'Upgraded heading';
              }
            },
          );
        }}
      >
        Define heading element
      </button>
      <button type="button" onClick={() => setName((value) => (value ? '' : 'Controlled schema'))}>
        Toggle controlled heading
      </button>
      <div ref={host}>
        {late ? (
          createElement('late-alert-heading', { slot: 'heading' })
        ) : embedded ? (
          <span key="embedded" slot="heading" ref={attachHeading}>
            {headingRoot && createPortal(text, headingRoot)}
          </span>
        ) : (
          text !== null && (
            <span key="direct" slot="heading">
              {text}
            </span>
          )
        )}
        {roots &&
          createPortal(
            <>
              <h2 id="source">
                <slot name="heading" />
              </h2>
              <Alert
                role="region"
                aria-labelledby="source"
                aria-label="Fallback label"
                data-testid="shadow-region"
                close={
                  <AlertClose
                    aria-label="Dismiss shadow notice"
                    onClose={() => setRequests((total) => total + 1)}
                  />
                }
              >
                Check service recovery.
                <AlertActions>
                  <button type="button">Keep shadow focus</button>
                </AlertActions>
              </Alert>
              <h2 id="control-name">
                <input
                  data-testid="name-input"
                  value={name}
                  onChange={({ currentTarget }) => setName(currentTarget.value)}
                />
              </h2>
              <Alert
                role="region"
                aria-labelledby="control-name"
                aria-label="Input fallback"
                data-testid="value-region"
              >
                Input-named feedback.
              </Alert>
              <span data-testid="shadow-requests">{requests}</span>
            </>,
            roots.outer,
          )}
        {roots &&
          createPortal(
            <label>
              Shadow draft <input type="text" defaultValue="draft.yml" />
            </label>,
            roots.nested,
          )}
      </div>
    </>
  );
}
