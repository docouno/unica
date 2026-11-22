import { Button, IconButton } from '@docouno/unica';
import { Profiler, useCallback, useRef, useState } from 'react';
import type { ComponentPropsWithRef, JSX, RefCallback } from 'react';
import { createPortal } from 'react-dom';
import { CommandGlyph } from '../button-glyph.js';

function copyFixtureStyles(target: Document | ShadowRoot): void {
  for (const style of document.querySelectorAll('style[data-vite-dev-id]')) {
    if ('head' in target) {
      target.head.append(target.importNode(style, true));
    } else {
      target.append(style.cloneNode(true));
    }
  }
}

function ShadowLab(): JSX.Element {
  const [shadow, setShadow] = useState<ShadowRoot | null>(null);
  const bind = useCallback<RefCallback<HTMLDivElement>>((node) => {
    if (node) {
      const container = node.shadowRoot ?? node.attachShadow({ mode: 'open' });
      copyFixtureStyles(container);
      setShadow(container);
    }
  }, []);

  return (
    <div ref={bind} data-testid="light-shadow-host">
      {shadow &&
        createPortal(
          <>
            <div
              style={{
                position: 'fixed',
                left: 325,
                top: 130,
                inlineSize: 120,
                blockSize: 40,
                display: 'flex',
                background: 'var(--bg-surface)',
              }}
            >
              <div data-testid="shadow-neighbor" style={{ inlineSize: 45 }} />
              <iframe
                title="Nested pointer region"
                srcDoc="<p>Pointer region</p>"
                style={{ border: 0, inlineSize: 75 }}
              />
            </div>
            <div
              data-testid="light-scrollport"
              style={{
                overflow: 'auto',
                position: 'fixed',
                left: 160,
                top: 330,
                inlineSize: 165,
                blockSize: 75,
              }}
            >
              <div style={{ paddingBlock: 16, blockSize: 240 }}>
                <Button data-testid="shadow-primary" style={{ inlineSize: 140 }}>
                  Shadow action
                </Button>
              </div>
            </div>
          </>,
          shadow,
        )}
    </div>
  );
}

function AnotherDocument(): JSX.Element {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  return (
    <>
      <iframe
        title="Independent pointer document"
        srcDoc="<body style='margin:0'></body>"
        style={{ position: 'fixed', left: 510, top: 330, width: 240, height: 160, border: 0 }}
        onLoad={(event) => {
          const nextDocument = event.currentTarget.contentDocument;
          if (nextDocument) {
            nextDocument.documentElement.dataset.theme = 'frost-dark';
            copyFixtureStyles(nextDocument);
            setTarget(nextDocument.body);
          }
        }}
      />
      {target &&
        createPortal(
          <IconButton
            variant="primary"
            aria-label="Independent icon action"
            icon={CommandGlyph}
            data-testid="iframe-primary"
            style={{ margin: 50 }}
          />,
          target,
        )}
    </>
  );
}

function SwappingAnchor({ onClick, ...attributes }: ComponentPropsWithRef<'a'>): JSX.Element {
  const [replaced, replace] = useState(false);
  const address = replaced ? '/replacement' : '/initial';
  return (
    <a
      {...attributes}
      key={address}
      href={address}
      onClick={(event) => {
        event.preventDefault();
        replace(true);
        onClick?.(event);
      }}
    />
  );
}

export default function ButtonLightFixture(): JSX.Element {
  const [pressed, setPressed] = useState(false);
  const [pending, setPending] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLButtonElement>(null);

  return (
    <div
      data-testid="light-lab"
      style={{ position: 'fixed', inset: 0, background: 'var(--bg-canvas)' }}
    >
      <button type="button" onClick={() => setPressed((value) => !value)}>
        Toggle selection
      </button>
      <button type="button" onClick={() => setPending((value) => !value)}>
        Toggle loading
      </button>
      <button type="button" onClick={() => setDisabled((value) => !value)}>
        Toggle disabled
      </button>
      <button type="button" onClick={() => setLocked((value) => !value)}>
        Toggle fieldset
      </button>
      <button type="button" onClick={() => setVisible((value) => !value)}>
        Toggle parent actions
      </button>
      <fieldset disabled={locked} style={{ border: 0, margin: 0, padding: 0 }}>
        {visible && (
          <Profiler
            id="main action"
            onRender={() => {
              const action = root.current;
              if (action) {
                action.dataset.renders = String(Number(action.dataset.renders || 0) + 1);
              }
            }}
          >
            <Button
              ref={root}
              data-testid="light-primary"
              pressed={pressed}
              loading={pending}
              disabled={disabled}
              style={{ position: 'fixed', left: 160, top: 130, inlineSize: 140 }}
            >
              Main action
            </Button>
          </Profiler>
        )}
      </fieldset>
      <div style={{ position: 'fixed', left: 160, top: 215, display: 'flex', gap: 12 }}>
        <Button tone="neutral" data-testid="light-neutral">
          Neutral
        </Button>
        <Button tone="danger" data-testid="light-danger">
          Danger
        </Button>
        <Button variant="secondary" tone="accent" data-testid="light-secondary">
          Secondary
        </Button>
        <Button variant="ghost" tone="accent" data-testid="light-ghost">
          Ghost
        </Button>
      </div>
      <div
        data-testid="light-cover"
        popover="manual"
        style={{
          position: 'fixed',
          inset: '130px auto auto 145px',
          margin: 0,
          width: 125,
          height: 40,
          border: 0,
          padding: 0,
          background: 'var(--bg-surface)',
        }}
      />
      <dialog data-testid="light-dialog">Native modal</dialog>
      <div data-testid="light-sibling-host" />
      {visible && <ShadowLab />}
      <AnotherDocument />
      <Button
        asChild
        data-testid="light-router"
        style={{ position: 'fixed', top: 475, left: 160, inlineSize: 140 }}
      >
        <SwappingAnchor>Router action</SwappingAnchor>
      </Button>
      <div
        data-testid="light-escapable-port"
        style={{ position: 'fixed', top: 530, left: 210, width: 72, height: 45, overflow: 'auto' }}
      >
        <span
          data-testid="light-inline-shim"
          style={{ display: 'inline', transform: 'translateZ(0)' }}
        >
          <Button
            data-testid="light-escaped-action"
            style={{ position: 'fixed', top: 530, left: 160, inlineSize: 140 }}
          >
            Viewport action
          </Button>
        </span>
      </div>
      <div
        data-testid="light-escaped-cover"
        popover="manual"
        style={{
          position: 'fixed',
          inset: '530px auto auto 154px',
          width: 44,
          height: 40,
          margin: 0,
          border: 0,
          padding: 0,
          background: 'var(--bg-surface)',
        }}
      />
      <div
        data-testid="light-outer-port"
        style={{ position: 'fixed', top: 500, left: 10, width: 72, height: 70, overflow: 'auto' }}
      >
        <div
          data-testid="light-transformed-port"
          style={{
            position: 'fixed',
            top: 500,
            left: 365,
            width: 88,
            height: 70,
            transform: 'translateX(5px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ inlineSize: 24, blockSize: 12, overflow: 'hidden' }}>
            <Button
              data-testid="light-transformed-action"
              style={{ position: 'fixed', top: 10, left: -38, inlineSize: 140 }}
            >
              Clipped action
            </Button>
          </div>
        </div>
      </div>
      <div data-testid="light-positioned-frame" style={{ position: 'absolute', top: 270, left: 0 }}>
        <div style={{ marginLeft: 270, inlineSize: 80, blockSize: 50, overflow: 'auto' }}>
          <Button
            data-testid="light-zoom-action"
            style={{ position: 'absolute', top: 0, left: 200, inlineSize: 140, zoom: 1.1 }}
          >
            Scaled action
          </Button>
        </div>
      </div>
      <div
        data-testid="light-zoom-cover"
        popover="manual"
        style={{
          position: 'fixed',
          inset: '270px auto auto 214px',
          width: 44,
          height: 44,
          margin: 0,
          border: 0,
          padding: 0,
          background: 'var(--bg-surface)',
        }}
      />
    </div>
  );
}
