import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Alert, AlertDescription, AlertTitle } from '../alert/alert.proto.js';
import { Button } from '../button/button.proto.js';
import { CheckboxCard } from '../choice-card/choice-card.proto.js';
import { Input } from '../input/input.proto.js';
import { Select } from '../select/select.proto.js';
import { Textarea } from '../textarea/textarea.proto.js';
import { ToastCard } from '../toast/toast.proto.js';
import { DialogSizeControls, DialogStudy, StudySelect } from './dialog.examples.js';
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from './dialog.proto.js';
import type { DialogSize } from './dialog.proto.js';

const projectName = 'Editorial archive';
const roles = [
  { value: 'editor', label: 'Editor', description: 'Edit and publish project content' },
  { value: 'reviewer', label: 'Reviewer', description: 'Read and leave feedback' },
  { value: 'viewer', label: 'Viewer', description: 'Read project content' },
];

function EditProject({
  overflow = false,
  guarded = false,
}: {
  readonly overflow?: boolean;
  readonly guarded?: boolean;
}): ReactElement {
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const touchLaunch = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const lastField = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(true);
  const [edited, setEdited] = useState(false);
  const [focusOnOpen, setFocusOnOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [size, setSize] = useState<DialogSize>('m');
  const [width, setWidth] = useState<DialogSize>('m');
  const [height, setHeight] = useState<'roomy' | 'short' | 'keyboard'>('roomy');
  const [status, setStatus] = useState<'ready' | 'invalid' | 'pending' | 'failed'>('ready');
  const [saved, setSaved] = useState(false);
  const requestClose = (): void => {
    if (guarded && edited) {
      const focused = document.activeElement;
      lastField.current = focused instanceof HTMLElement ? focused : nameRef.current;
      setConfirm(true);
    } else {
      setOpen(false);
    }
  };
  const changeOpen = (nextOpen: boolean): void => {
    if (nextOpen) {
      setFocusOnOpen(!touchLaunch.current && !overflow);
      setSaved(false);
      setOpen(true);
    } else {
      requestClose();
    }
  };
  const complete = (): void => {
    setEdited(false);
    setOpen(false);
    setSaved(true);
  };
  const controls = overflow ? (
    <StudySelect
      label="Available height"
      value={height}
      options={[
        ['roomy', 'Reading area'],
        ['short', 'Short window'],
        ['keyboard', 'Keyboard inset'],
      ]}
      onChange={setHeight}
    />
  ) : guarded ? undefined : (
    <>
      <DialogSizeControls
        size={size}
        width={width}
        onSizeChange={setSize}
        onWidthChange={setWidth}
      />
      <StudySelect
        label="Save state"
        value={status}
        options={[
          ['ready', 'Ready'],
          ['invalid', 'Field error'],
          ['pending', 'Saving'],
          ['failed', 'Save failed'],
        ]}
        onChange={setStatus}
      />
    </>
  );
  return (
    <DialogStudy
      controls={controls}
      height={
        height === 'keyboard'
          ? 245
          : height === 'short'
            ? 360
            : overflow
              ? 494
              : guarded
                ? 520
                : 565
      }
    >
      <Modal open={open} onOpenChange={changeOpen}>
        <div inert={open}>
          <ModalTrigger
            variant="secondary"
            tone="neutral"
            onPointerDown={(event) => {
              touchLaunch.current = event.pointerType === 'touch';
            }}
            onKeyDown={() => {
              touchLaunch.current = false;
            }}
          >
            Edit project
          </ModalTrigger>
        </div>
        <ModalContent
          size={size}
          width={width}
          described
          inactive={confirm}
          initialFocus={focusOnOpen ? nameRef : undefined}
        >
          <ModalHeader closeLabel="Close project editor">
            <ModalTitle>
              {overflow ? 'Project access and publishing settings' : 'Edit project'}
            </ModalTitle>
            <ModalDescription>
              {guarded
                ? 'Publishing details for the editorial archive.'
                : 'Update the information teammates see in the project directory.'}
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <form
              className="dialog-study-form"
              id={formId}
              onChange={() => setEdited(true)}
              onSubmit={(event) => {
                event.preventDefault();
                if (status === 'pending') {
                  return;
                }
                if (status === 'invalid') {
                  nameRef.current?.focus();
                } else {
                  complete();
                }
              }}
            >
              {status === 'failed' && (
                <Alert status="danger" size="s">
                  <AlertTitle>Changes couldn’t be saved</AlertTitle>
                  <AlertDescription>Your edits are still here. Try saving again.</AlertDescription>
                </Alert>
              )}
              <div className="dialog-study-form-section">
                <Input
                  label="Project name"
                  ref={nameRef}
                  defaultValue={projectName}
                  required
                  status={status === 'invalid' ? 'danger' : undefined}
                  message={status === 'invalid' ? 'A project already uses this name.' : undefined}
                  aria-invalid={status === 'invalid' || undefined}
                />
                <Textarea
                  label="Description"
                  defaultValue="Source files and review notes for the quarterly editorial release."
                  rows={2}
                />
              </div>
              {!guarded && (
                <div className="dialog-study-fields">
                  <Input label="Owner" defaultValue="Editorial team" />
                  <Select label="Default access" options={roles} defaultValue="reviewer" />
                </div>
              )}
              {overflow && (
                <>
                  <div className="dialog-study-form-section">
                    <h3>Publishing</h3>
                    <CheckboxCard
                      label="Include in search"
                      defaultChecked
                      description="People with access can find this project in search."
                    />
                    <CheckboxCard
                      label="Notify reviewers on publication"
                      description="Send a notification when changes go live."
                    />
                  </div>
                  <div className="dialog-study-form-section">
                    <h3>Review</h3>
                    <Input label="Review owner" defaultValue="Content operations" />
                    <Textarea
                      label="Review instructions"
                      rows={3}
                      defaultValue="Verify the source credits, then confirm that the release notes match the published changes."
                    />
                  </div>
                </>
              )}
            </form>
          </ModalBody>
          <ModalFooter>
            <ModalClose>Cancel</ModalClose>
            <Button form={formId} type="submit" loading={status === 'pending'}>
              {status === 'failed' ? 'Try again' : 'Save changes'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal open={confirm} onOpenChange={setConfirm}>
        <ModalContent
          role="alertdialog"
          width="s"
          size="s"
          described
          className="dialog-discard-confirmation"
          initialFocus={cancelRef}
          returnFocus={lastField}
        >
          <ModalHeader closeLabel={false}>
            <ModalTitle>Discard unsaved changes?</ModalTitle>
            <ModalDescription>Your edits to the editorial archive will be lost.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose ref={cancelRef}>Keep editing</ModalClose>
            <Button
              tone="danger"
              onClick={() => {
                lastField.current = null;
                setConfirm(false);
                setEdited(false);
                setOpen(false);
              }}
            >
              Discard changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <span className="dialog-study-announcement" role="status">
        {saved ? 'Project updated' : ''}
      </span>
      {saved && (
        <div className="dialog-study-notice">
          <ToastCard status="success" title="Project updated" onDismiss={() => setSaved(false)} />
        </div>
      )}
    </DialogStudy>
  );
}

function DeleteExport(): ReactElement {
  const [open, setOpen] = useState(true);
  const [deleted, setDeleted] = useState(false);
  const [focusOnOpen, setFocusOnOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <DialogStudy height={340}>
      <Modal open={open} onOpenChange={setOpen}>
        <div inert={open}>
          <ModalTrigger
            variant="secondary"
            tone="neutral"
            onClick={() => {
              setFocusOnOpen(true);
              setDeleted(false);
            }}
          >
            Review export deletion
          </ModalTrigger>
        </div>
        <ModalContent
          role="alertdialog"
          width="s"
          size="s"
          described
          initialFocus={focusOnOpen ? cancelRef : undefined}
        >
          <ModalHeader closeLabel={false}>
            <ModalTitle>Delete this export?</ModalTitle>
            <ModalDescription>
              The download link for the November report will stop working. The original report will
              remain available.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose ref={cancelRef}>Cancel</ModalClose>
            <Button
              tone="danger"
              onClick={() => {
                setDeleted(true);
                setOpen(false);
              }}
            >
              Delete export
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <span className="dialog-study-announcement" role="status">
        {deleted ? 'Export deleted' : ''}
      </span>
      {deleted && (
        <div className="dialog-study-notice">
          <ToastCard status="success" title="Export deleted" onDismiss={() => setDeleted(false)} />
        </div>
      )}
    </DialogStudy>
  );
}

function ReadOnly(): ReactElement {
  const [open, setOpen] = useState(true);
  const [notified, setNotified] = useState(true);
  const titleRef = useRef<HTMLHeadingElement>(null);
  return (
    <DialogStudy height={500}>
      <Modal open={open} onOpenChange={setOpen}>
        <div inert={open}>
          <ModalTrigger variant="secondary" tone="neutral">
            View export details
          </ModalTrigger>
        </div>
        <ModalContent
          width="s"
          described
          dismissOnBackdrop
          notification={
            notified && (
              <ToastCard
                status="success"
                title="Export ready"
                onDismiss={() => {
                  setNotified(false);
                  titleRef.current?.focus({ preventScroll: true });
                }}
              >
                October report
              </ToastCard>
            )
          }
        >
          <ModalHeader closeLabel="Close export details">
            <ModalTitle ref={titleRef} tabIndex={-1}>
              Export details
            </ModalTitle>
            <ModalDescription>November report</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <dl className="dialog-study-facts">
              <div>
                <dt>Format</dt>
                <dd>PDF document</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>November 12, 2026</dd>
              </div>
              <div>
                <dt>Access</dt>
                <dd>People with the link</dd>
              </div>
            </dl>
          </ModalBody>
        </ModalContent>
      </Modal>
    </DialogStudy>
  );
}

export default defineSpecimen({
  id: 'modal',
  title: 'Modal',
  group: 'Overlays',
  summary:
    'A centered surface for one focused task. See Invite & Access under Folio for a denser form.',
  defaultSurface: 'overlay',
  sections: [
    {
      id: 'editor',
      title: 'Editor · Width, density and save states',
      kind: 'matrix',
      overlayStage: true,
      render: () => <EditProject />,
    },
    {
      id: 'confirmation',
      title: 'Destructive confirmation',
      kind: 'matrix',
      overlayStage: true,
      render: () => <DeleteExport />,
    },
    {
      id: 'overflow',
      title: 'Overflow · Body scroll and short window',
      kind: 'states',
      overlayStage: true,
      render: () => <EditProject overflow />,
    },
    {
      id: 'guard',
      title: 'Unsaved changes · Edit before closing',
      kind: 'states',
      overlayStage: true,
      render: () => <EditProject guarded />,
    },
    {
      id: 'details',
      title: 'Read-only details · Notification above the active panel',
      kind: 'context',
      overlayStage: true,
      render: () => <ReadOnly />,
    },
  ],
});
