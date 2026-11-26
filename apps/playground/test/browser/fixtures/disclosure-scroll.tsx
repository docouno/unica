import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@docouno/unica';
import { Activity, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';

type Mode = 'accept' | 'reject' | 'defer';

type PortPlacement = 'plain' | 'shadow' | 'scaled' | 'zoomed';

function ShrinkingRange({ placement }: { readonly placement: PortPlacement }): ReactElement {
  const host = useRef<HTMLDivElement>(null);
  const [shadow, setShadow] = useState<ShadowRoot>();
  useEffect(() => {
    const node = host.current;
    if (node) {
      setShadow(node.shadowRoot ?? node.attachShadow({ mode: 'open' }));
    }
  }, []);
  const port = (
    <>
      <style>{`
        [data-testid="shrinking-port"]::-webkit-scrollbar { width: 24px; }
        [data-testid="shrinking-port"]::-webkit-scrollbar-thumb { background: GrayText; }
      `}</style>
      <div
        data-testid="shrinking-port"
        style={{
          blockSize: '900px',
          inlineSize: 'min(500px, 100%)',
          overflowY: 'scroll',
          overflowAnchor: 'auto',
          border: '3px solid transparent',
          transform: placement === 'scaled' ? 'scale(.8)' : undefined,
          transformOrigin: 'top left',
        }}
      >
        <div style={{ blockSize: '390px' }} />
        <Accordion headingLevel={2} defaultValue={['a']} exclusive>
          <AccordionItem value="b">
            <AccordionTrigger>Beta section</AccordionTrigger>
            <AccordionContent data-testid="beta-panel">
              <div style={{ blockSize: '650px' }}>Beta body</div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="a">
            <AccordionTrigger>Alpha section</AccordionTrigger>
            <AccordionContent>
              <div style={{ blockSize: '740px' }}>Alpha body</div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div style={{ blockSize: '5px' }} />
      </div>
    </>
  );
  return (
    <>
      <div style={{ blockSize: '500px' }} />
      {placement === 'shadow' ? (
        <div ref={host}>{shadow && createPortal(port, shadow)}</div>
      ) : placement === 'zoomed' ? (
        <div style={{ zoom: 0.8 }}>{port}</div>
      ) : (
        port
      )}
      <div style={{ blockSize: '150px' }} />
    </>
  );
}

export default function DisclosureScroll(): ReactElement {
  const [selected, setSelected] = useState<readonly string[]>(['a']);
  const [nested, setNested] = useState(true);
  const [mode, setMode] = useState<Mode>('accept');
  const [snapshot, setSnapshot] = useState('');
  const [interruption, setInterruption] = useState<'short' | 'long'>();
  const [activity, setActivity] = useState(true);
  const [tallPeer, setTallPeer] = useState(false);
  const [shrinking, setShrinking] = useState<PortPlacement>();
  const pending = useRef<readonly string[]>([]);
  const port = useRef<HTMLDivElement>(null);
  const takeSnapshot = () =>
    JSON.stringify({
      focus: document.activeElement?.textContent,
      scroll: [port.current?.scrollTop, window.scrollY],
    });
  if (shrinking) {
    return <ShrinkingRange placement={shrinking} />;
  }
  return (
    <>
      <button type="button" onClick={() => setNested(false)}>
        Use window
      </button>
      <button type="button" onClick={() => setMode('reject')}>
        Reject proposals
      </button>
      <button type="button" onClick={() => setMode('defer')}>
        Defer proposals
      </button>
      <button type="button" onClick={() => setSelected(pending.current)}>
        Apply deferred proposal
      </button>
      <button type="button" onClick={() => setInterruption('short')}>
        Interrupt with short range
      </button>
      <button type="button" onClick={() => setInterruption('long')}>
        Interrupt with long range
      </button>
      <button type="button" onClick={() => setTallPeer(true)}>
        Grow opening panel
      </button>
      <button
        type="button"
        onClick={(event) => {
          const placement = event.currentTarget.dataset.placement;
          setShrinking(
            placement === 'shadow' || placement === 'scaled' || placement === 'zoomed'
              ? placement
              : 'plain',
          );
        }}
      >
        Use shrinking range
      </button>
      <output data-testid="proposal">{snapshot}</output>
      <div style={{ blockSize: '180px' }} />
      <div
        data-testid="scrollport"
        ref={port}
        style={nested ? { blockSize: '300px', overflowY: 'auto' } : undefined}
      >
        <div style={{ blockSize: '390px' }} />
        <Accordion
          headingLevel={2}
          value={selected}
          exclusive
          onValueChange={(next) => {
            setSnapshot(takeSnapshot());
            if (mode === 'accept') {
              setSelected(next);
              if (interruption) {
                window.setTimeout(() => setActivity(false), 80);
              }
            } else if (mode === 'defer') {
              pending.current = next;
            }
          }}
        >
          <AccordionItem value="a">
            <AccordionTrigger>Alpha section</AccordionTrigger>
            <form aria-label="Alpha fields">
              <Activity mode={activity ? 'visible' : 'hidden'}>
                <AccordionContent data-testid="alpha-panel">
                  <div style={{ blockSize: '740px', display: 'grid', alignItems: 'end' }}>
                    <input aria-label="Alpha draft" defaultValue="draft" />
                  </div>
                </AccordionContent>
              </Activity>
            </form>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Beta section</AccordionTrigger>
            <AccordionContent data-testid="beta-panel">
              {interruption === 'long' ? null : (
                <div style={{ blockSize: tallPeer ? '650px' : interruption ? '45px' : undefined }}>
                  Beta body
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="c">
            <AccordionTrigger>Gamma section</AccordionTrigger>
            <AccordionContent>Gamma body</AccordionContent>
          </AccordionItem>
        </Accordion>
        <div style={{ blockSize: interruption === 'long' ? '1500px' : '540px' }} />
      </div>
      <div style={{ blockSize: '420px' }} />
    </>
  );
}
