import { useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, JSX } from 'react';
import { flushSync } from 'react-dom';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Tooltip,
  TooltipProvider,
} from '@docouno/unica';
import { registerOverlay } from '../../../../../packages/ui/src/core/overlay/runtime.js';

const untypedPresentation = { autoFocus: true, autofocus: '', contentEditable: true, tabIndex: 0 };

function ExternalTooltip(): JSX.Element {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(true);
  const [competing, setCompeting] = useState(false);
  const [dismissals, setDismissals] = useState<string[]>([]);
  const first = useRef<HTMLButtonElement>(null);
  const second = useRef<HTMLButtonElement>(null);
  const shadowHost = useRef<HTMLSpanElement>(null);
  const carrier = useRef<HTMLSpanElement>(null);

  function retargetWithInput(action: 'tab' | 'press' | 'escape'): void {
    const panel = carrier.current;
    if (!panel) {
      return;
    }
    flushSync(() => setAnchor(anchor === first.current ? second.current : first.current));
    if (action === 'press') {
      const init = { bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0 };
      panel.dispatchEvent(new PointerEvent('pointerdown', init));
      panel.dispatchEvent(new PointerEvent('pointerup', init));
    } else {
      panel.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: action === 'tab' ? 'Tab' : 'Escape',
          bubbles: true,
          cancelable: true,
        }),
      );
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBlockStart: 20 }}>
      <button
        type="button"
        id="external-first"
        ref={first}
        onClick={() => setAnchor(first.current)}
      >
        First external anchor
      </button>
      <button
        type="button"
        id="external-second"
        ref={second}
        onClick={() => setAnchor(second.current)}
      >
        Second external anchor
      </button>
      <label>
        <input id="external-availability-check" type="checkbox" />
        Change source visibility
      </label>
      <span id="external-shadow-host" ref={shadowHost} />
      <button
        type="button"
        id="select-shadow-anchor"
        onClick={() => setAnchor(shadowHost.current?.shadowRoot?.querySelector('button') ?? null)}
      >
        Select shadow anchor
      </button>
      <button
        type="button"
        id="replace-external"
        onClick={() => {
          carrier.current?.hidePopover();
          flushSync(() => setAnchor(first.current));
        }}
      >
        Switch after native hide
      </button>
      <button
        type="button"
        id="replace-external-during-close"
        onClick={() => {
          const element = carrier.current;
          element?.addEventListener(
            'beforetoggle',
            () => flushSync(() => setAnchor(second.current)),
            { once: true },
          );
          element?.hidePopover();
        }}
      >
        Switch during native close
      </button>
      <button
        type="button"
        id="replace-external-in-capture"
        onClick={() => {
          const element = carrier.current;
          element?.ownerDocument.addEventListener(
            'beforetoggle',
            () => flushSync(() => setAnchor(first.current)),
            { capture: true, once: true },
          );
          element?.hidePopover();
        }}
      >
        Switch before the carrier observes the close
      </button>
      <button
        type="button"
        id="recommit-external-in-capture"
        onClick={() => {
          const element = carrier.current;
          element?.ownerDocument.addEventListener(
            'beforetoggle',
            () => {
              flushSync(() => setOpen(false));
              flushSync(() => setOpen(true));
            },
            { capture: true, once: true },
          );
          element?.hidePopover();
        }}
      >
        Recommit from native close capture
      </button>
      <button
        type="button"
        id="replace-pending-external"
        onClick={() => {
          flushSync(() => setAnchor(first.current));
          flushSync(() => setCompeting(true));
          flushSync(() => setAnchor(second.current));
        }}
      >
        Switch during pending placement
      </button>
      {(['tab', 'press', 'escape'] as const).map((action) => (
        <button
          type="button"
          key={action}
          id={`external-retarget-${action}`}
          onClick={() => retargetWithInput(action)}
        >
          Switch with {action}
        </button>
      ))}
      <Tooltip id="external-competitor" label="Competing preview" open={competing}>
        <button type="button">Competing source</button>
      </Tooltip>
      <Tooltip
        id="external-preview"
        label="External preview"
        anchor={anchor}
        open={anchor !== null && open}
        ref={carrier}
        onOpenChange={(open, details) => {
          if (!open) {
            setDismissals((values) => [...values, details.reason]);
          }
        }}
      />
      <output id="external-dismissals" hidden>
        {JSON.stringify(dismissals)}
      </output>
    </div>
  );
}

function ControlledTooltips(): JSX.Element {
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);
  const [openC, setOpenC] = useState(false);
  const [hasLabel, setHasLabel] = useState(true);
  const [clippedAnchor, setClippedAnchor] = useState<HTMLButtonElement | null>(null);
  const [dismissals, setDismissals] = useState<string[]>([]);

  return (
    <div style={{ marginBlockStart: 24 }}>
      <Tooltip id="controlled-a" label={hasLabel ? 'First controlled hint' : ''} open={openA}>
        <button type="button">First controlled source</button>
      </Tooltip>
      <Tooltip id="controlled-b" label="Second controlled hint" open={openB}>
        <button type="button">Second controlled source</button>
      </Tooltip>
      <div id="controlled-clip" style={{ blockSize: 20, overflow: 'clip' }}>
        <div style={{ blockSize: 36 }} />
        <button ref={setClippedAnchor} id="controlled-c-source" type="button">
          Clipped source
        </button>
      </div>
      <Tooltip
        id="controlled-c"
        anchor={clippedAnchor}
        label="Clipped controlled hint"
        open={openC}
        onOpenChange={(open, details) => {
          if (!open) {
            setDismissals((values) => [...values, details.reason]);
          }
        }}
      />
      <button
        type="button"
        id="toggle-controlled-a"
        aria-pressed={openA}
        onClick={() => setOpenA((value) => !value)}
      >
        Toggle first hint
      </button>
      <button type="button" id="open-controlled-b" onClick={() => setOpenB(true)}>
        Open second hint
      </button>
      <button type="button" id="open-controlled-c" onClick={() => setOpenC(true)}>
        Open clipped hint
      </button>
      <button
        type="button"
        id="toggle-controlled-label"
        onClick={() => setHasLabel((value) => !value)}
      >
        Toggle first label
      </button>
      <output id="clipped-dismissals" hidden>
        {JSON.stringify(dismissals)}
      </output>
    </div>
  );
}

function ModalWithTooltip(): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const handle = useRef<ReturnType<typeof registerOverlay>>(null);
  const [open, setOpen] = useState(false);
  const [dismissals, setDismissals] = useState<string[]>([]);
  useLayoutEffect(() => {
    const modal = registerOverlay({ kind: 'modal', element: dialog.current!, onOpenChange() {} });
    handle.current = modal;
    return () => modal.dispose();
  }, []);

  return (
    <>
      <button
        type="button"
        id="open-availability-parent"
        onClick={() => {
          handle.current?.setOpen(true);
          setOpen(true);
        }}
      >
        Open parent of the preview
      </button>
      <dialog id="availability-parent" ref={dialog}>
        <Tooltip
          id="modal-availability-preview"
          label="Modal preview"
          open={open}
          onOpenChange={(next, details) => {
            if (!next) {
              setDismissals((values) => [...values, details.reason]);
            }
          }}
        >
          <button type="button">Anchor inside the parent modal</button>
        </Tooltip>
      </dialog>
      <output id="modal-availability-dismissals" hidden>
        {JSON.stringify(dismissals)}
      </output>
    </>
  );
}

export default function HoverPreviewDomFixture(): JSX.Element {
  const [submissions, setSubmissions] = useState<[string, FormDataEntryValue][][]>([]);
  const [edits, setEdits] = useState(0);
  const [show, setShow] = useState(false);
  const [hasContent, setHasContent] = useState(true);
  const [revision, setRevision] = useState(0);
  const [dismissals, setDismissals] = useState<string[]>([]);
  const [nativeDisabled, setNativeDisabled] = useState(true);
  const lossPreview = useRef<HTMLDivElement>(null);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    setSubmissions((values) => [...values, [...data]]);
  }

  return (
    <div style={{ padding: '65px 30px 20px' }}>
      <div
        contentEditable
        suppressContentEditableWarning
        id="preview-editor"
        style={{ padding: 16 }}
      >
        <Tooltip label="Editable hint" id="editor-tooltip" {...untypedPresentation}>
          <button type="button" id="editor-tooltip-source">
            Editor button
          </button>
        </Tooltip>
        <HoverCard>
          <HoverCardTrigger href="#edit-target" id="editor-link" tabIndex={0}>
            Editor link
          </HoverCardTrigger>
          <HoverCardContent id="editor-card" {...untypedPresentation}>
            <p>Preview text stays read-only and selectable.</p>
          </HoverCardContent>
        </HoverCard>
      </div>
      <button type="button" id="after-editor">
        After editor
      </button>
      <form id="preview-form" onSubmit={submit} style={{ marginBlock: 12 }}>
        <label htmlFor="preview-check">Notify me</label>
        <Tooltip label="Notifications" id="checkbox-preview">
          <input
            type="checkbox"
            id="preview-check"
            name="notice"
            value="yes"
            onChange={() => setEdits((count) => count + 1)}
          />
        </Tooltip>
        <Tooltip label="Save settings" id="submit-preview">
          <button type="submit" name="intent" value="save" id="preview-submit">
            Save
          </button>
        </Tooltip>
        <button type="reset" id="preview-reset">
          Reset
        </button>
      </form>
      <TooltipProvider delay={10}>
        <fieldset disabled>
          <legend>
            <Tooltip label="Legend hint" id="legend-preview">
              <button type="button" id="legend-source">
                Legend action
              </button>
            </Tooltip>
          </legend>
          <Tooltip label="Fieldset hint" id="fieldset-preview">
            <button type="button" id="fieldset-source">
              Unavailable fieldset action
            </button>
          </Tooltip>
        </fieldset>
        <Tooltip label="ARIA-disabled hint" id="aria-preview">
          <button type="button" aria-disabled="true" id="aria-source">
            Unavailable ARIA action
          </button>
        </Tooltip>
        <Tooltip label="Native-disabled hint" id="native-preview" defaultOpen>
          <button type="button" disabled={nativeDisabled} id="native-source">
            Unavailable native action
          </button>
        </Tooltip>
        <button type="button" id="enable-native" onClick={() => setNativeDisabled(false)}>
          Enable native action
        </button>
        <div inert>
          <Tooltip label="Inert hint" id="inert-preview">
            <button type="button" id="inert-source">
              Unavailable inert action
            </button>
          </Tooltip>
        </div>
      </TooltipProvider>
      <div style={{ marginBlockStart: 18 }}>
        <button
          type="button"
          id="toggle-card"
          aria-pressed={show}
          onClick={() => setShow((value) => !value)}
        >
          Toggle preview
        </button>
        <HoverCard
          open={show}
          onOpenChange={(open, details) => {
            if (!open) {
              setDismissals((values) => [...values, details.reason]);
            }
          }}
        >
          <HoverCardTrigger asChild>
            <a href="#edit-target" id="loss-source">
              Loss test link
            </a>
          </HoverCardTrigger>
          {hasContent ? (
            <HoverCardContent id="loss-preview" ref={lossPreview}>
              <p>Preview details, revision {revision}.</p>
            </HoverCardContent>
          ) : null}
        </HoverCard>
        <button type="button" id="rerender-card" onClick={() => setRevision((value) => value + 1)}>
          Change preview text
        </button>
        <button
          type="button"
          id="toggle-card-content"
          onClick={() => setHasContent((value) => !value)}
        >
          Toggle preview content
        </button>
        <button
          type="button"
          id="recommit-card"
          onClick={() => {
            lossPreview.current?.hidePopover();
            flushSync(() => setShow(false));
            flushSync(() => setShow(true));
          }}
        >
          Recommit preview after native hide
        </button>
      </div>
      <ExternalTooltip />
      <ControlledTooltips />
      <span id="availability-gate" hidden />
      <ModalWithTooltip />
      <dialog id="availability-modal">
        <button type="button">Modal action</button>
      </dialog>
      <output id="fixture-edits" hidden>
        {edits}
      </output>
      <output id="fixture-submissions" hidden>
        {JSON.stringify(submissions)}
      </output>
      <output id="fixture-dismissals" hidden>
        {JSON.stringify(dismissals)}
      </output>
      <span id="edit-target" hidden />
    </div>
  );
}
