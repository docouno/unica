import { defineComponent } from '../../workbench/types.js';
import { choice, eventProp, toggle } from '../control-props.js';
import {
  dialogRootConstraints,
  dialogRootControls,
  dialogRootProps,
} from '../shared/dialog-controls.js';
import { DialogStudy } from '../shared/dialog-study.js';
import { DeleteExport } from './delete-export.js';
import { EditProject } from './edit-project.js';
import { ExportDetails } from './export-details.js';
import { ReleaseReview } from './release-review.js';

const sizes = ['s', 'm', 'l'] as const;
const confirmationExample = `import { useRef, useState } from 'react';
import {
  Button, Modal, ModalClose, ModalContent, ModalDescription,
  ModalFooter, ModalHeader, ModalTitle, ModalTrigger,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ConfirmExportDeletion({ onDelete }) {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const cancel = useRef(null);
  const opener = useRef(null);
  const receipt = useRef(null);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      {deleted ? (
        <p ref={receipt} tabIndex={-1} role="status">Export deleted</p>
      ) : (
        <ModalTrigger asChild ref={opener}><Button variant="secondary">Delete export</Button></ModalTrigger>
      )}
      <ModalContent role="alertdialog" width="s" size="s" initialFocus={cancel} returnFocus={deleted ? receipt : opener}>
        <ModalHeader>
          <div>
            <ModalTitle>Delete this export?</ModalTitle>
            <ModalDescription>The download link will stop working.</ModalDescription>
          </div>
        </ModalHeader>
        <ModalFooter>
          <ModalClose ref={cancel} asChild>
            <Button variant="secondary" tone="neutral">Cancel</Button>
          </ModalClose>
          <Button tone="danger" onClick={() => { onDelete(); setDeleted(true); setOpen(false); }}>
            Delete export
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}`;

const detailsExample = `import { useRef, useState } from 'react';
import {
  Alert, AlertTitle, Button, Modal, ModalBody, ModalClose, ModalContent,
  ModalDescription, ModalHeader, ModalTitle, ModalTrigger, Portal,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ExportDetails() {
  const [notified, setNotified] = useState(true);
  const title = useRef(null);
  const opener = useRef(null);

  return (
    <Modal defaultOpen>
      <ModalTrigger asChild ref={opener}><Button variant="secondary">View export details</Button></ModalTrigger>
      <ModalContent width="s" dismissOnBackdrop returnFocus={opener}>
        <ModalHeader>
          <div>
            <ModalTitle ref={title}>Export details</ModalTitle>
            <ModalDescription>November report</ModalDescription>
          </div>
          <ModalClose />
        </ModalHeader>
        <ModalBody>Format: PDF document</ModalBody>
        {notified && (
          <Portal>
            <div style={{ position: 'fixed', insetInlineEnd: 16, insetBlockEnd: 16 }}>
              <Alert status="success">
                <AlertTitle>Export ready</AlertTitle>
                <Button variant="ghost" onClick={() => {
                  setNotified(false);
                  title.current?.focus({ preventScroll: true });
                }}>Dismiss</Button>
              </Alert>
            </div>
          </Portal>
        )}
      </ModalContent>
    </Modal>
  );
}`;

export default defineComponent({
  id: 'modal',
  title: 'Modal',
  category: 'Overlays',
  status: 'UI',
  form: 'inline',
  summary: 'A centered panel for a focused task, a decision or read-only details.',
  defaultSurface: 'overlay',
  props: {
    size: choice(
      'Geometry',
      'ModalContent density. Controls panel insets and spacing.',
      sizes,
      'm',
    ),
    width: choice(
      'Geometry',
      'ModalContent width ceiling. S, M and L use 24, 36 and 52rem within the available workspace.',
      sizes,
      'm',
    ),
    ...dialogRootControls,
    dismissOnBackdrop: toggle(
      'Interaction',
      'Dismiss ModalContent when a primary press and release both land on the backdrop.',
    ),
    onOpenChange: eventProp(
      'Modal reports a request to open or close. The owner decides whether to accept it.',
      '(open) => console.log(open)',
      '(open: boolean) => void',
    ),
  },
  constraints: dialogRootConstraints,
  render: ({ values, ctx }) => (
    <DialogStudy ctx={ctx} height={320} title="Release review example">
      <ReleaseReview
        key={values.open === 'unset' ? String(values.defaultOpen) : 'controlled'}
        contentProps={{
          size: values.size,
          width: values.width,
          dismissOnBackdrop: values.dismissOnBackdrop,
        }}
        rootProps={{ ...dialogRootProps(values), onOpenChange: ctx.action('onOpenChange') }}
        subject={ctx.subject}
      />
    </DialogStudy>
  ),
  code: ({ size, width, dismissOnBackdrop, open, defaultOpen }) =>
    `import { useRef } from 'react';
import { Button, Modal, ModalClose, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function PreviewRelease() {
  const opener = useRef(null);
  return (
    <Modal {...${JSON.stringify(dialogRootProps({ open, defaultOpen }))}}>
      <ModalTrigger asChild ref={opener}><Button variant="secondary">Review release</Button></ModalTrigger>
      <ModalContent {...${JSON.stringify({ size, width, dismissOnBackdrop })}} returnFocus={opener}>
        <ModalHeader>
          <div>
            <ModalTitle>Release summary</ModalTitle>
            <ModalDescription>Export links expire in 30 days.</ModalDescription>
          </div>
          <ModalClose />
        </ModalHeader>
      </ModalContent>
    </Modal>
  );
}`,
  states: [
    {
      id: 'dimensions',
      title: 'Panel dimensions',
      caption:
        'Each width group shows compact, regular and spacious insets. Panels stop at the workspace boundary. These comparisons stay open. Use Playground to launch and dismiss a panel.',
      rows: 'size',
      group: 'width',
      fixed: { open: 'true' },
    },
  ],
  cases: [
    {
      id: 'editor',
      title: 'Project editor and save feedback',
      overlayStage: true,
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: {
        width: {
          kind: 'enum',
          label: 'Width',
          default: 'm',
          choices: [
            { value: 's', label: 'S · 24rem' },
            { value: 'm', label: 'M · 36rem' },
            { value: 'l', label: 'L · 52rem' },
          ],
        },
        size: {
          kind: 'enum',
          label: 'Density',
          default: 'm',
          choices: [
            { value: 's', label: 'Compact' },
            { value: 'm', label: 'Regular' },
            { value: 'l', label: 'Spacious' },
          ],
        },
        status: {
          kind: 'enum',
          label: 'Save state',
          default: 'ready',
          choices: [
            { value: 'ready', label: 'Ready' },
            { value: 'invalid', label: 'Field error' },
            { value: 'pending', label: 'Saving' },
            { value: 'failed', label: 'Save failed' },
          ],
        },
      },
      caption:
        'Edit the project and save to restore the accepted values on the next opening. Field error marks the rejected name until you edit it. Saving holds submission. Try again accepts the retained draft and returns the save state to Ready.',
      render: EditProject,
    },
    {
      id: 'overflow',
      title: 'Long form and available height',
      overlayStage: true,
      kind: 'content',
      mode: 'live',
      reset: true,
      controls: {
        height: {
          kind: 'enum',
          label: 'Available height',
          default: 'roomy',
          choices: [
            { value: 'roomy', label: 'Reading area' },
            { value: 'short', label: 'Short window' },
            { value: 'keyboard', label: 'Keyboard inset' },
          ],
        },
      },
      caption:
        'Scroll to publishing and review settings. When less than 96px of reading space remains, the whole panel scrolls so its fields and save action stay reachable.',
      render: ({ ctx }) => <EditProject ctx={ctx} overflow />,
    },
    {
      id: 'guard',
      title: 'Unsaved changes',
      overlayStage: true,
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Change the name or description and request close. Keep editing returns to the draft. Discard changes restores the last saved project. Returning both fields to their saved values allows an immediate close.',
      render: ({ ctx }) => <EditProject ctx={ctx} guarded />,
    },
  ],
  compositions: [
    {
      id: 'confirmation',
      title: 'Destructive confirmation',
      overlayStage: true,
      mode: 'live',
      reset: true,
      caption:
        'Cancel keeps the November export available. Delete export marks it as deleted and moves focus to the result. Reset restores the export.',
      render: ({ ctx }) => (
        <DialogStudy ctx={ctx} height={340} title="Delete export example">
          <DeleteExport subject={ctx.subject} />
        </DialogStudy>
      ),
      code: confirmationExample,
    },
    {
      id: 'details',
      title: 'Export details and notification',
      overlayStage: true,
      mode: 'live',
      reset: true,
      caption:
        'Inspect the November export and its ready notification. Dismiss the notice to return focus to the title. Close the panel or press its backdrop to return to the trigger.',
      render: ({ ctx }) => (
        <DialogStudy ctx={ctx} height={500} title="Export details example">
          <ExportDetails subject={ctx.subject} />
        </DialogStudy>
      ),
      code: detailsExample,
    },
  ],
});
