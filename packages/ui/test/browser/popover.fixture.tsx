import { StrictMode, useEffect, useRef, useState } from 'react';
import type { JSX, MouseEvent } from 'react';
import { hydrateRoot } from 'react-dom/client';
import {
  Button,
  IconButton,
  Link,
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../src/index.js';
import { registerOverlay } from '../../src/core/overlay/runtime.js';
import type { OverlayHandle } from '../../src/core/overlay/runtime.js';
import { CloseGlyph } from '../../src/internal/glyphs/index.js';

function ControlledExample(): JSX.Element {
  const scope = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [changes, setChanges] = useState<boolean[]>([]);
  const [handlers, setHandlers] = useState<string[]>([]);
  const [updates, setUpdates] = useState(0);
  const [outsideClicks, setOutsideClicks] = useState(0);
  const mode = (): string | undefined => scope.current?.dataset.handlerMode;
  const record = (value: string): void => setHandlers((previous) => [...previous, value]);

  function childClick(event: MouseEvent<HTMLButtonElement>): void {
    record('child');
    if (mode() === 'child-stop') {
      event.stopPropagation();
    } else if (mode() === 'child-cancel') {
      event.preventDefault();
    }
  }

  return (
    <section
      id="controlled-example"
      ref={scope}
      onClickCapture={(event) => {
        if (mode() === 'capture-stop') {
          event.stopPropagation();
        }
      }}
      onClick={(event) => {
        if (mode() === 'ancestor-stop') {
          event.stopPropagation();
        }
      }}
    >
      <button hidden id="controlled-open" type="button" onClick={() => setOpen(true)}>
        Set open
      </button>
      <button hidden id="controlled-close" type="button" onClick={() => setOpen(false)}>
        Set closed
      </button>
      <button hidden id="controlled-rerender" type="button" onClick={() => setUpdates(updates + 1)}>
        Rerender
      </button>
      <output
        id="controlled-log"
        data-handlers={JSON.stringify(handlers)}
        data-updates={updates}
        data-outside-clicks={outsideClicks}
      >
        {JSON.stringify(changes)}
      </output>
      <div style={{ display: 'flex', gap: 36, alignItems: 'center', padding: '12px 30px' }}>
        <Popover
          open={open}
          onOpenChange={(next) => {
            record('proposal');
            setChanges((previous) => [...previous, next]);
            if (mode() === 'accept') {
              setOpen(next);
            }
          }}
        >
          <PopoverTrigger
            asChild
            onClick={(event) => {
              record('trigger');
              if (mode() === 'trigger-cancel') {
                event.preventDefault();
              }
            }}
          >
            <button id="controlled-trigger" type="button" onClick={childClick}>
              Controlled button
            </button>
          </PopoverTrigger>
          <PopoverContent
            id="controlled-panel"
            aria-labelledby="controlled-title"
            aria-label="Fallback label"
            aria-describedby="controlled-note controlled-description"
          >
            <PopoverHeader>
              <PopoverTitle id="controlled-title" as="h2">
                Controlled panel
              </PopoverTitle>
              <PopoverDescription id="controlled-description">Panel description</PopoverDescription>
              <PopoverClose aria-label="Close controlled panel" />
            </PopoverHeader>
            <PopoverBody>
              <button type="button" disabled>
                Disabled inside
              </button>
              <input aria-label="Hidden inside" hidden />
              <div inert>
                <input aria-label="Inert inside" />
              </div>
              <label>
                Controlled draft
                <input
                  id="controlled-draft"
                  autoFocus
                  ref={(element) => {
                    element?.setAttribute('autofocus', '');
                  }}
                />
              </label>
            </PopoverBody>
            <PopoverFooter>
              <button id="controlled-last" type="button">
                Last action
              </button>
            </PopoverFooter>
          </PopoverContent>
          <button
            id="controlled-outside"
            type="button"
            onClick={() => setOutsideClicks(outsideClicks + 1)}
          >
            Outside action
          </button>
          <PopoverTrigger asChild>
            <a id="controlled-link" href="#popover-destination">
              Controlled link
            </a>
          </PopoverTrigger>
        </Popover>
      </div>
      <p id="controlled-note">External instruction</p>
      <span id="popover-destination" />
    </section>
  );
}

function NestedChain({
  id,
  startChildOpen = false,
}: {
  readonly id: string;
  readonly startChildOpen?: boolean | undefined;
}): JSX.Element {
  const [parentOpen, setParentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(startChildOpen);
  const [changes, setChanges] = useState<string[]>([]);
  const [consumeEscape, setConsumeEscape] = useState(false);
  const manual = useRef<HTMLDivElement>(null);
  const option = useRef<HTMLButtonElement>(null);
  const add = (boundary: string, open: boolean): void =>
    setChanges((previous) => [...previous, boundary + ':' + open]);

  return (
    <div id={id}>
      <button id={id + '-program-open'} type="button" hidden onClick={() => setParentOpen(true)}>
        Show parent
      </button>
      <button
        id={id + '-consume-escape'}
        type="button"
        hidden
        onClick={() => setConsumeEscape(true)}
      >
        Consume Escape
      </button>
      <output id={id + '-log'}>{JSON.stringify(changes)}</output>
      <Popover
        open={parentOpen}
        onOpenChange={(next) => {
          add('parent', next);
          setParentOpen(next);
        }}
      >
        <PopoverTrigger id={id + '-parent-trigger'}>Open parent</PopoverTrigger>
        <PopoverContent id={id + '-parent'}>
          <PopoverHeader>
            <PopoverTitle>Parent panel</PopoverTitle>
            <PopoverClose />
          </PopoverHeader>
          <PopoverBody>
            <Popover
              open={childOpen}
              onOpenChange={(next) => {
                add('child', next);
                setChildOpen(next);
              }}
            >
              <button
                id={id + '-program-child'}
                hidden
                type="button"
                onClick={() => setChildOpen(true)}
              >
                Show child
              </button>
              <PopoverTrigger id={id + '-child-trigger'}>Open child</PopoverTrigger>
              <PopoverContent id={id + '-child'}>
                <PopoverHeader>
                  <PopoverTitle>Child panel</PopoverTitle>
                  <PopoverClose />
                </PopoverHeader>
                <PopoverBody>
                  <button
                    id={id + '-child-action'}
                    type="button"
                    onKeyDown={(event) => {
                      if (consumeEscape && event.key === 'Escape') {
                        event.preventDefault();
                        setConsumeEscape(false);
                      }
                    }}
                  >
                    Child action
                  </button>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <button
              id={id + '-open-manual'}
              type="button"
              onClick={() => {
                manual.current?.showPopover();
                option.current?.focus();
              }}
            >
              Open list
            </button>
            <div
              id={id + '-manual'}
              ref={manual}
              popover="manual"
              role="listbox"
              aria-label="Related options"
              style={{ position: 'fixed', inset: '42px 42px auto auto', margin: 0 }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  manual.current?.hidePopover();
                }
              }}
            >
              <button type="button" ref={option} role="option" aria-selected="false">
                List option
              </button>
            </div>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ModalExample(): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const runtime = useRef<OverlayHandle>(null);
  const [dismissals, setDismissals] = useState<string[]>([]);

  useEffect(() => () => runtime.current?.dispose(), []);

  const openRegistered = (): void => {
    const element = dialog.current;
    if (!element) {
      return;
    }
    const handle = registerOverlay({
      element,
      kind: 'modal',
      onOpenChange(open, reason) {
        setDismissals((previous) => [...previous, reason]);
        handle.setOpen(open);
      },
    });
    runtime.current = handle;
    handle.setOpen(true);
  };

  return (
    <section>
      <button id="open-native-modal" type="button" onClick={() => dialog.current?.showModal()}>
        Show native modal
      </button>
      <button id="open-registered-modal" type="button" onClick={openRegistered}>
        Show registered modal
      </button>
      <dialog
        id="popover-modal"
        aria-label="Modal host"
        ref={dialog}
        style={{ width: '26rem', padding: 20 }}
        onCancel={() => setDismissals((previous) => [...previous, 'cancel'])}
      >
        <NestedChain id="modal-chain" />
      </dialog>
      <output id="modal-log">{JSON.stringify(dismissals)}</output>
    </section>
  );
}

function FormExample(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [submits, setSubmits] = useState(0);
  return (
    <form
      id="popover-form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits(submits + 1);
      }}
    >
      <input type="hidden" name="permanent" value="keep" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger id="form-trigger">Edit form</PopoverTrigger>
        <PopoverContent id="form-panel">
          <PopoverHeader>
            <PopoverTitle>Form fields</PopoverTitle>
            <PopoverClose aria-label="Close form fields" />
          </PopoverHeader>
          <PopoverBody>
            <label>
              Document path
              <input id="form-path" name="path" required defaultValue="/guide" />
            </label>
            <label>
              Pin document
              <input type="checkbox" name="pinned" value="yes" defaultChecked />
            </label>
          </PopoverBody>
          <PopoverFooter>
            <button type="reset">Reset draft</button>
            <button type="submit" form="popover-form" name="action" value="save">
              Save draft
            </button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
      <output id="form-log">{submits}</output>
    </form>
  );
}

function SaveAndDisableSource({
  id,
  composed = false,
  withFallback = false,
}: {
  id: string;
  composed?: boolean;
  withFallback?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {composed ? (
          <Link id={`${id}-source`} href="#guide">
            Edit composed link
          </Link>
        ) : (
          <a id={`${id}-source`} href="#guide">
            Edit native anchor
          </a>
        )}
      </PopoverTrigger>
      {withFallback && (
        <PopoverTrigger id={`${id}-fallback`}>Edit from another source</PopoverTrigger>
      )}
      <PopoverContent id={`${id}-panel`} aria-label="Edit link">
        <PopoverFooter>
          <Button
            id={`${id}-save`}
            onClick={() => {
              setDisabled(true);
              setOpen(false);
            }}
          >
            Save
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}

export function PopoverComposedSourcesFixture(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [disableSource, setDisableSource] = useState(false);
  const [changes, setChanges] = useState<boolean[]>([]);
  return (
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <button id="composed-open" type="button" hidden onClick={() => setOpen(true)}>
        Open composed panel through state
      </button>
      <button
        id="composed-disable-source"
        type="button"
        hidden
        onClick={() => setDisableSource(true)}
      >
        Disable current source
      </button>
      <output id="composed-log">{JSON.stringify(changes)}</output>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setChanges((previous) => [...previous, next]);
          setOpen(next);
        }}
      >
        <PopoverTrigger
          id="composed-disabled-native-button"
          disabled
          onPointerDown={() => {
            window.location.hash = 'button-pointer';
          }}
          onAuxClick={() => {
            window.location.hash = 'button-aux';
          }}
        >
          Disabled native button
        </PopoverTrigger>
        <PopoverTrigger
          asChild
          disabled
          onClickCapture={() => {
            window.location.hash = 'trigger-click';
          }}
          onAuxClick={() => {
            window.location.hash = 'trigger-aux';
          }}
        >
          <a
            id="composed-disabled-native"
            href="#guide"
            onClick={() => {
              window.location.hash = 'child-click';
            }}
            onAuxClick={() => {
              window.location.hash = 'child-aux';
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                window.location.hash = 'child-key';
              }
            }}
          >
            Disabled native link
          </a>
        </PopoverTrigger>
        <PopoverTrigger asChild disabled>
          <Button id="composed-disabled-button">Disabled button</Button>
        </PopoverTrigger>
        <PopoverTrigger asChild disabled>
          <IconButton id="composed-disabled-icon" icon={CloseGlyph} aria-label="Disabled icon" />
        </PopoverTrigger>
        <PopoverTrigger asChild disabled>
          <Button asChild>
            <a id="composed-disabled-anchor" href="#guide">
              Disabled anchor
            </a>
          </Button>
        </PopoverTrigger>
        <PopoverTrigger asChild disabled>
          <Link id="composed-disabled-link" href="#guide">
            Disabled link
          </Link>
        </PopoverTrigger>
        <PopoverTrigger asChild disabled={disableSource}>
          <Button id="composed-source" style={{ minWidth: 180 }}>
            Composed source
          </Button>
        </PopoverTrigger>
        <PopoverTrigger id="composed-fallback">Fallback source</PopoverTrigger>
        <PopoverContent id="composed-panel" aria-label="Composed panel">
          <PopoverHeader>
            <PopoverClose />
          </PopoverHeader>
          <PopoverBody>Details</PopoverBody>
        </PopoverContent>
      </Popover>
      <SaveAndDisableSource id="save-native" />
      <SaveAndDisableSource id="save-composed-alone" composed />
      <SaveAndDisableSource id="save-composed" composed withFallback />
    </section>
  );
}

export default function PopoverFixture(): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 16, padding: 18 }}>
      <ControlledExample />
      <NestedChain id="page-chain" />
      <ModalExample />
      <FormExample />
    </div>
  );
}

export function PopoverInitialChainFixture(): JSX.Element {
  return <NestedChain id="initial-chain" startChildOpen />;
}

function HydrationPanel(): JSX.Element {
  const [changes, setChanges] = useState<boolean[]>([]);
  return (
    <>
      <output id="hydration-log">{JSON.stringify(changes)}</output>
      <Popover defaultOpen onOpenChange={(open) => setChanges((previous) => [...previous, open])}>
        <PopoverTrigger id="hydration-trigger">Hydrated trigger</PopoverTrigger>
        <PopoverContent data-testid="hydration-panel">
          <PopoverHeader>
            <PopoverTitle>Hydrated panel</PopoverTitle>
            <PopoverClose />
          </PopoverHeader>
          <PopoverBody>
            <input id="hydration-draft" aria-label="Hydrated draft" autoFocus />
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  );
}

export function PopoverSsrFixture(): JSX.Element {
  return (
    <StrictMode>
      <HydrationPanel />
    </StrictMode>
  );
}

export function PopoverHydrationFixture(): JSX.Element {
  const node = useRef<HTMLDivElement>(null);
  const root = useRef<ReturnType<typeof hydrateRoot>>(null);
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => () => root.current?.unmount(), []);

  return (
    <div style={{ padding: 20 }}>
      <button
        type="button"
        onClick={() => {
          if (node.current && !root.current) {
            root.current = hydrateRoot(node.current, <PopoverSsrFixture />, {
              onRecoverableError: (error) => setErrors((previous) => [...previous, String(error)]),
            });
          }
        }}
      >
        Hydrate popover
      </button>
      <output id="hydration-errors">{JSON.stringify(errors)}</output>
      <div id="hydration-root" ref={node} />
    </div>
  );
}
