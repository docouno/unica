import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@docouno/unica';
import { Activity, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';

function Materials() {
  return (
    <div style={{ display: 'grid', gap: '16px', padding: '16px', background: 'var(--bg-surface)' }}>
      {(['base', 'overlay'] as const).map((surface) => (
        <div
          key={surface}
          data-testid={surface + '-material'}
          data-surface={surface}
          className={surface === 'overlay' ? 'unica-overlay-surface' : undefined}
          style={{ padding: '16px' }}
        >
          {(['s', 'm', 'l'] as const).map((size) => (
            <Collapsible key={size} size={size}>
              <CollapsibleTrigger hidden>Hidden disclosure</CollapsibleTrigger>
              <CollapsibleTrigger>{size.toUpperCase()} details</CollapsibleTrigger>
              <CollapsibleContent>Panel details</CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      ))}
    </div>
  );
}

function Draft({ policy }: { readonly policy: 'keep' | 'lazy' | 'discard' }) {
  const field = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(policy === 'keep');
  const [first, setFirst] = useState(true);
  return (
    <form
      aria-label={policy}
      onSubmit={(event) => {
        event.preventDefault();
        event.currentTarget.dataset.submitted = 'true';
      }}
    >
      <Collapsible
        data-testid={policy + '-root'}
        open={open}
        lazyMount={policy === 'lazy'}
        unmountOnExit={policy === 'discard'}
        onOpenChange={setOpen}
      >
        <CollapsibleTrigger disabled={!first}>Details</CollapsibleTrigger>
        {first && (
          <CollapsibleTrigger asChild>
            <Button variant="secondary">Alternate details</Button>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent style={{ display: 'grid' }} data-testid={policy + '-panel'}>
          <input aria-label="Draft" name="draft" defaultValue="original" />
          <CollapsibleTrigger asChild>
            <button type="submit">Close inside</button>
          </CollapsibleTrigger>
        </CollapsibleContent>
      </Collapsible>
      <button type="button" onClick={() => setFirst(false)}>
        Remove alternate and disable first
      </button>
      <button type="submit">Send</button>
      <input ref={field} aria-label="After form" />
    </form>
  );
}

function Validation() {
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const focusInvalid = useRef(false);
  useEffect(() => {
    if (open && focusInvalid.current) {
      focusInvalid.current = false;
      field.current?.focus();
    }
  }, [open]);
  return (
    <form
      aria-label="validation"
      onSubmit={(event) => {
        event.preventDefault();
        event.currentTarget.dataset.submitted = 'true';
      }}
    >
      <label>
        <input type="checkbox" name="reveal" /> Reveal invalid field
      </label>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger>Required details</CollapsibleTrigger>
        <CollapsibleContent>
          <input
            ref={field}
            aria-label="Required draft"
            name="required"
            required
            onInvalid={(event) => {
              if (
                (event.currentTarget.form?.elements.namedItem('reveal') as HTMLInputElement | null)
                  ?.checked
              ) {
                event.preventDefault();
                focusInvalid.current = true;
                setOpen(true);
              }
            }}
          />
        </CollapsibleContent>
      </Collapsible>
      <button type="submit">Validate form</button>
    </form>
  );
}

function Headings() {
  const [hide, setHide] = useState(true);
  const [dividers, setDividers] = useState(true);
  const [copies, setCopies] = useState(0);
  return (
    <section aria-label="Headings">
      <Accordion
        data-testid="headings"
        headingLevel={4}
        exclusive
        dividers={dividers}
        defaultValue={['a']}
      >
        <AccordionItem value="hidden-first" hidden={hide}>
          <AccordionTrigger hidden>Hidden first</AccordionTrigger>
          <AccordionContent>First</AccordionContent>
        </AccordionItem>
        <AccordionItem value="a" data-testid="item-a">
          <AccordionTrigger
            action={<Button onClick={() => setCopies((value) => value + 1)}>Copy note</Button>}
          >
            First heading
          </AccordionTrigger>
          <AccordionContent role="region">
            <input aria-label="Heading draft" defaultValue="abcdef" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="hidden-middle" hidden>
          <AccordionTrigger>Hidden middle</AccordionTrigger>
          <AccordionContent>Middle</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b" data-testid="item-b">
          <AccordionTrigger>Second heading</AccordionTrigger>
          <AccordionContent>Second body</AccordionContent>
        </AccordionItem>
      </Accordion>
      <output>{copies}</output>
      <button type="button" onClick={() => setHide(!hide)}>
        Toggle first item
      </button>
      <button type="button" onClick={() => setDividers(!dividers)}>
        Toggle dividers
      </button>
    </section>
  );
}

function ShadowPanels() {
  const [shadow, setShadow] = useState<ShadowRoot>();
  const [open, setOpen] = useState(true);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = host.current;
    if (node) {
      setShadow(node.shadowRoot ?? node.attachShadow({ mode: 'open' }));
    }
  }, []);
  return (
    <section aria-label="Nested panels">
      <button type="button" onClick={() => setOpen(true)}>
        Open externally
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        Close externally
      </button>
      <input aria-label="Outside shadow" />
      <div ref={host} />
      {shadow &&
        createPortal(
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger>Outer shadow trigger</CollapsibleTrigger>
            <CollapsibleContent>
              <Collapsible open={open}>
                <CollapsibleTrigger
                  onFocus={() => {
                    host.current?.setAttribute('data-inner-focus', 'true');
                  }}
                >
                  Inner shadow trigger
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <input aria-label="Deep draft" />
                </CollapsibleContent>
              </Collapsible>
            </CollapsibleContent>
          </Collapsible>,
          shadow,
        )}
    </section>
  );
}

function ActivityPanel() {
  const [visible, setVisible] = useState(true);
  return (
    <section aria-label="Activity disclosure">
      <button type="button" onClick={() => setVisible(false)}>
        Hide activity
      </button>
      <button type="button" onClick={() => setVisible(true)}>
        Show activity
      </button>
      <Activity mode={visible ? 'visible' : 'hidden'}>
        <form aria-label="Activity draft">
          <Collapsible defaultOpen unmountOnExit>
            <CollapsibleTrigger>Activity details</CollapsibleTrigger>
            <CollapsibleContent data-testid="activity-panel">
              <input aria-label="Activity note" name="activity" defaultValue="draft" />
            </CollapsibleContent>
          </Collapsible>
        </form>
      </Activity>
    </section>
  );
}

function TrailingTrigger() {
  return (
    <div data-testid="trailing-port" style={{ blockSize: '300px', overflowY: 'auto' }}>
      <div style={{ blockSize: '390px' }} />
      <Collapsible>
        <CollapsibleContent data-testid="trailing-panel">
          <div style={{ blockSize: '740px', display: 'grid', alignItems: 'end' }}>
            <CollapsibleTrigger asChild>
              <button>Close long details</button>
            </CollapsibleTrigger>
          </div>
        </CollapsibleContent>
        <CollapsibleTrigger>Trailing details trigger</CollapsibleTrigger>
      </Collapsible>
      <div style={{ blockSize: '540px' }} />
    </div>
  );
}

export default function DisclosureFixture(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: '24px', maxInlineSize: '36rem' }}>
      <Materials />
      <Draft policy="keep" />
      <Draft policy="lazy" />
      <Draft policy="discard" />
      <Validation />
      <Headings />
      <form aria-label="blocked">
        <Collapsible
          onOpenChange={() => {
            throw new Error('Disabled trigger proposed a change');
          }}
        >
          <fieldset disabled>
            <legend>
              <CollapsibleTrigger onClick={(event) => event.preventDefault()}>
                Legend trigger
              </CollapsibleTrigger>
            </legend>
            <CollapsibleTrigger asChild>
              <button>Disabled fieldset trigger</button>
            </CollapsibleTrigger>
          </fieldset>
          <CollapsibleTrigger asChild>
            <Button loading>Loading trigger</Button>
          </CollapsibleTrigger>
          <CollapsibleContent>Blocked panel</CollapsibleContent>
        </Collapsible>
      </form>
      <ActivityPanel />
      <TrailingTrigger />
      <ShadowPanels />
      <div style={{ blockSize: '320px' }} />
    </div>
  );
}
