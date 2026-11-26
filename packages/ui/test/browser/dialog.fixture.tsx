import { StrictMode, useRef, useState } from 'react';
import type { JSX, RefObject } from 'react';
import { flushSync } from 'react-dom';
import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  Input,
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Select,
  UnicaProvider,
} from '../../src/index.js';
import { ToastQueue } from './overlay-workbench.fixture.js';

const accessOptions = [
  { value: 'reader', label: 'Reader' },
  { value: 'editor', label: 'Editor' },
];

function Editor(): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const collapsedField = useRef<HTMLInputElement>(null);
  const unboxedTarget = useRef<HTMLDivElement>(null);
  const hiddenField = useRef<HTMLInputElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const safe = useRef<HTMLButtonElement>(null);
  const last = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [guard, setGuard] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [refuseLoss, setRefuseLoss] = useState(false);
  const [hasNext, setHasNext] = useState(true);
  const [hasTitle, setHasTitle] = useState(true);
  const [initialTarget, setInitialTarget] = useState<'field' | 'collapsed' | 'unboxed' | 'hidden'>(
    'field',
  );
  const [descriptionId, setDescriptionId] = useState<string | null>('edit-summary');
  const [requests, setRequests] = useState<string[]>([]);
  const [actions, setActions] = useState(0);
  const [submits, setSubmits] = useState(0);

  function changeOpen(requested: boolean): void {
    const node = dialog.current;
    const live = node?.isConnected === true && node.matches(':modal');
    setRequests((items) => [...items, requested ? 'open' : live ? 'request' : 'lost']);
    if (requested) {
      if (!refuseOpen) {
        setOpen(true);
      }
      return;
    }
    if (dirty && live) {
      const focused = node.ownerDocument.activeElement;
      last.current = focused instanceof HTMLElement ? focused : null;
      setGuard(true);
    } else if (live || !refuseLoss) {
      setGuard(false);
      setDirty(false);
      setOpen(false);
    }
  }

  function closeAuthoritatively(reopen: boolean): void {
    dialog.current?.close();
    flushSync(() => setOpen(false));
    if (reopen) {
      flushSync(() => setOpen(true));
    }
  }

  const initialFocus = {
    field,
    collapsed: collapsedField,
    unboxed: unboxedTarget,
    hidden: hiddenField,
  }[initialTarget];

  return (
    <>
      <div id="editor-commands" hidden>
        <button type="button" id="allow-backdrop" onClick={() => setOptIn(true)} />
        <button type="button" id="refuse-open" onClick={() => setRefuseOpen(true)} />
        <button type="button" id="refuse-loss" onClick={() => setRefuseLoss(true)} />
        <button type="button" id="close-editor" onClick={() => setOpen(false)} />
        <button
          type="button"
          id="close-editor-authoritatively"
          onClick={() => closeAuthoritatively(false)}
        />
        <button
          type="button"
          id="reopen-editor-authoritatively"
          onClick={() => closeAuthoritatively(true)}
        />
        <button type="button" id="open-editor" onClick={() => setOpen(true)} />
        <button type="button" id="remove-next" onClick={() => setHasNext(false)} />
        <button type="button" id="remove-title" onClick={() => setHasTitle(false)} />
        <button type="button" id="choose-collapsed" onClick={() => setInitialTarget('collapsed')} />
        <button type="button" id="choose-unboxed" onClick={() => setInitialTarget('unboxed')} />
        <button type="button" id="choose-hidden" onClick={() => setInitialTarget('hidden')} />
        <button type="button" id="rename-summary" onClick={() => setDescriptionId('new-summary')} />
        <button type="button" id="remove-summary" onClick={() => setDescriptionId(null)} />
      </div>
      <output id="editor-requests">{requests.join(',')}</output>
      <output id="editor-actions">{actions}</output>
      <output id="editor-submits">{submits}</output>
      <Modal open={open} onOpenChange={changeOpen}>
        <ModalTrigger asChild>
          <Button id="editor-trigger" variant="secondary">
            Open editor
          </Button>
        </ModalTrigger>
        <ModalTrigger id="alternative-trigger">Edit another way</ModalTrigger>
        <ModalTrigger onClick={(event) => event.preventDefault()}>Veto editor</ModalTrigger>
        <fieldset disabled>
          <ModalTrigger asChild>
            <Button variant="secondary">Unavailable editor</Button>
          </ModalTrigger>
        </fieldset>
        <ModalContent
          ref={dialog}
          id="project-editor"
          initialFocus={initialFocus}
          returnFocus={next}
          dismissOnBackdrop={optIn}
          aria-label={hasTitle ? undefined : 'Editor without heading'}
        >
          <ModalHeader>
            <div>
              {hasTitle && <ModalTitle>Edit project</ModalTitle>}
              {descriptionId !== null && (
                <ModalDescription id={descriptionId}>Update project access.</ModalDescription>
              )}
            </div>
            <ModalClose />
          </ModalHeader>
          <ModalBody>
            {initialTarget === 'collapsed' && (
              <details>
                <summary>Additional notes</summary>
                <input ref={collapsedField} aria-label="Collapsed note" />
              </details>
            )}
            {initialTarget === 'unboxed' && (
              <div ref={unboxedTarget} tabIndex={-1} style={{ display: 'contents' }}>
                <span>Unboxed note</span>
              </div>
            )}
            {initialTarget === 'hidden' && (
              <div style={{ contentVisibility: 'hidden' }}>
                <input ref={hiddenField} aria-label="Hidden note" />
              </div>
            )}
            <form
              id="project-form"
              aria-label="Project form"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmits((count) => count + 1);
              }}
              onReset={() => setDirty(false)}
            >
              <div aria-hidden="true" style={{ blockSize: 125 }} />
              <Input
                ref={field}
                name="project"
                aria-label="Project name"
                required
                defaultValue="Original project"
                onChange={() => setDirty(true)}
              />
              <Select
                aria-label="Access"
                name="access"
                defaultValue="reader"
                options={accessOptions}
              />
              <Popover>
                <PopoverTrigger>Review settings</PopoverTrigger>
                <PopoverContent id="review-settings">
                  <PopoverTitle>Review settings panel</PopoverTitle>
                  <PopoverBody>
                    <Button variant="secondary" onClick={() => setActions((count) => count + 1)}>
                      Mark reviewed
                    </Button>
                    <Popover>
                      <PopoverTrigger>Advanced review</PopoverTrigger>
                      <PopoverContent id="advanced-review">
                        <PopoverTitle>Advanced review panel</PopoverTitle>
                      </PopoverContent>
                    </Popover>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
              <div aria-hidden="true" style={{ blockSize: 500 }} />
            </form>
            <form id="native-close-form" method="dialog" />
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="secondary">Cancel editing</Button>
            </ModalClose>
            <Button variant="secondary" type="reset" form="project-form">
              Reset editor
            </Button>
            <Button variant="primary" type="submit" form="project-form" name="intent" value="save">
              Save editor
            </Button>
            <button type="submit" form="native-close-form">
              Native close
            </button>
          </ModalFooter>
          <Modal open={guard} onOpenChange={setGuard}>
            <ModalContent
              id="discard-dialog"
              role="alertdialog"
              width="s"
              initialFocus={safe}
              returnFocus={last}
            >
              <ModalHeader>
                <ModalTitle>Discard edits?</ModalTitle>
              </ModalHeader>
              <ModalBody>Changes to this project will be lost.</ModalBody>
              <ModalFooter>
                <ModalClose asChild>
                  <Button ref={safe} variant="secondary">
                    Keep editing
                  </Button>
                </ModalClose>
                <Button
                  variant="primary"
                  tone="danger"
                  onClick={() => {
                    setGuard(false);
                    setDirty(false);
                    setOpen(false);
                  }}
                >
                  Discard edits
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </ModalContent>
      </Modal>
      {hasNext && (
        <button ref={next} id="logical-editor-return" type="button">
          Next project
        </button>
      )}
      <button id="editor-outside-focus" type="button">
        Other project
      </button>
    </>
  );
}

function Commands(): JSX.Element {
  const launcher = useRef<HTMLButtonElement>(null);
  return (
    <Modal>
      <Popover>
        <PopoverTrigger ref={launcher}>Project actions</PopoverTrigger>
        <PopoverContent id="project-actions">
          <PopoverTitle>Project actions panel</PopoverTitle>
          <PopoverBody>
            <ModalTrigger asChild>
              <Button variant="secondary">Open archive confirmation</Button>
            </ModalTrigger>
          </PopoverBody>
        </PopoverContent>
      </Popover>
      <ModalContent id="archive-dialog" returnFocus={launcher}>
        <ModalHeader>
          <ModalTitle>Archive project?</ModalTitle>
          <ModalClose />
        </ModalHeader>
      </ModalContent>
    </Modal>
  );
}

function InitialStack({
  returnTo,
}: {
  readonly returnTo: RefObject<HTMLButtonElement | null>;
}): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <>
      <button type="button" ref={returnTo} onClick={() => setMounted(true)}>
        Mount open stack
      </button>
      <output id="initial-stack-changes">{changes.join(',')}</output>
      {mounted && (
        <Drawer
          defaultOpen
          onOpenChange={(open) => setChanges((current) => [...current, `drawer:${open}`])}
        >
          <DrawerContent id="stack-drawer" returnFocus={returnTo}>
            <DrawerHeader>
              <DrawerTitle>Parent drawer</DrawerTitle>
              <DrawerClose />
            </DrawerHeader>
            <Modal
              defaultOpen
              onOpenChange={(open) => setChanges((current) => [...current, `modal:${open}`])}
            >
              <ModalContent id="stack-modal">
                <ModalHeader>
                  <ModalTitle>Nested modal</ModalTitle>
                  <ModalClose />
                </ModalHeader>
              </ModalContent>
            </Modal>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

function DialogProbes(): JSX.Element {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const replacement = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLButtonElement>(null);
  const [outsideClicks, setOutsideClicks] = useState(0);
  const [editorMounted, setEditorMounted] = useState(true);
  return (
    <>
      <button
        type="button"
        style={{ position: 'fixed', inset: '0 0 auto auto' }}
        onClick={() => setOutsideClicks((count) => count + 1)}
      >
        Outside action
      </button>
      <output id="outside-clicks">{outsideClicks}</output>
      <div id="editor-portal" ref={setHost} />
      <div id="replacement-portal" ref={replacement} />
      <UnicaProvider portalContainer={host}>
        {editorMounted && <Editor />}
        <InitialStack returnTo={returnTo} />
        <ToastQueue />
      </UnicaProvider>
      <Commands />
      <button
        type="button"
        id="move-editor-host"
        hidden
        onClick={() => setHost(replacement.current)}
      />
      <button type="button" id="unmount-editor" hidden onClick={() => setEditorMounted(false)} />
      <div aria-hidden="true" style={{ blockSize: 2000 }} />
    </>
  );
}

export default function DialogFixture(): JSX.Element {
  return (
    <StrictMode>
      <DialogProbes />
    </StrictMode>
  );
}
