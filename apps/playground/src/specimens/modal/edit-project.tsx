import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Divider,
  Input,
  Select,
  Stack,
  Textarea,
  Title,
  VisuallyHidden,
  CheckboxCard,
  FormField,
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
  Toast,
} from '@docouno/unica';
import type { ModalContentProps } from '@docouno/unica';
import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { activeDialogControl } from '../shared/dialog-controls.js';
import { DialogStudy, DiscardChanges } from '../shared/dialog-study.js';

const initialProject = {
  name: 'Editorial archive',
  description: 'Source files and review notes for the quarterly editorial release.',
  owner: 'Editorial team',
  access: 'reviewer',
  searchable: true,
  notify: false,
  reviewOwner: 'Content operations',
  instructions:
    'Verify the source credits, then confirm that the release notes match the published changes.',
};
const roles = [
  { value: 'editor', label: 'Editor', description: 'Edit and publish project content' },
  { value: 'reviewer', label: 'Reviewer', description: 'Read and leave feedback' },
  { value: 'viewer', label: 'Viewer', description: 'Read project content' },
];

export function EditProject({
  ctx,
  overflow = false,
  guarded = false,
}: PreviewProps & {
  readonly overflow?: boolean;
  readonly guarded?: boolean;
}): ReactElement {
  const formId = useId();
  const descriptionId = useId();
  const instructionsId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastField = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(true);
  const [project, setProject] = useState(initialProject);
  const [draft, setDraft] = useState(project);
  const dirty = draft.name !== project.name || draft.description !== project.description;
  const [confirm, setConfirm] = useState(false);
  const controls = ctx.story?.controls;
  const size = (controls?.size ?? 'm') as ModalContentProps['size'];
  const width = (controls?.width ?? 'm') as ModalContentProps['width'];
  const height = controls?.height ?? 'roomy';
  const status = controls?.status ?? 'ready';
  const [saved, setSaved] = useState(false);
  const changeOpen = (nextOpen: boolean): void => {
    if (nextOpen) {
      setDraft(project);
      setSaved(false);
      setOpen(true);
      return;
    }

    const dialog = dialogRef.current;
    if (guarded && dirty && dialog?.isConnected && dialog.matches(':modal')) {
      lastField.current = activeDialogControl(dialog) ?? nameRef.current;
      setConfirm(true);
      return;
    }

    setConfirm(false);
    setOpen(false);
  };

  return (
    <DialogStudy
      ctx={ctx}
      title="Project editor example"
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
        <div className="dialog-study-launch" data-open={open || undefined}>
          <ModalTrigger {...(!open ? ctx.subject : {})} asChild>
            <Button ref={triggerRef} variant="secondary" tone="neutral">
              Edit project
            </Button>
          </ModalTrigger>
        </div>
        <ModalContent
          {...ctx.subject}
          className="dialog-study-editor"
          ref={dialogRef}
          size={size}
          width={width}
          initialFocus={overflow ? undefined : nameRef}
          returnFocus={triggerRef}
        >
          <ModalHeader>
            <div>
              <ModalTitle>
                {overflow ? 'Project access and publishing settings' : 'Edit project'}
              </ModalTitle>
              <ModalDescription>
                {guarded
                  ? 'Edit the name and description shown in the project directory.'
                  : 'Update the information teammates see in the project directory.'}
              </ModalDescription>
            </div>
            <ModalClose aria-label="Close project editor" />
          </ModalHeader>
          <ModalBody>
            <form
              {...ctx.form}
              className="dialog-study-form"
              id={formId}
              onSubmit={(event) => {
                event.preventDefault();
                if (status === 'pending') {
                  return;
                }
                if (status === 'invalid') {
                  nameRef.current?.focus();
                } else {
                  setProject(draft);
                  setSaved(true);
                  setOpen(false);
                  if (status === 'failed') {
                    ctx.story?.setControl('status', 'ready');
                  }
                }
              }}
            >
              {status === 'failed' && (
                <Alert status="danger" size="s">
                  <AlertTitle>Changes couldn’t be saved</AlertTitle>
                  <AlertDescription>
                    <bdi>Your edits are still here. Try saving again.</bdi>
                  </AlertDescription>
                </Alert>
              )}
              <Stack gap={12}>
                <FormField
                  controlId={`${formId}-project`}
                  label="Project name"
                  required
                  status={status === 'invalid' ? 'danger' : 'neutral'}
                  message={
                    status === 'invalid' ? <bdi>A project already uses this name.</bdi> : undefined
                  }
                  feedbackIcon={false}
                >
                  <Input
                    id={`${formId}-project`}
                    ref={nameRef}
                    name="name"
                    dir="auto"
                    value={draft.name}
                    onChange={(event) => {
                      setDraft({ ...draft, name: event.currentTarget.value });
                      if (status === 'invalid') {
                        ctx.story?.setControl('status', 'ready');
                      }
                    }}
                    required
                    status={status === 'invalid' ? 'danger' : undefined}
                  />
                </FormField>
                <FormField label="Description" controlId={descriptionId}>
                  <Textarea
                    id={descriptionId}
                    name="description"
                    dir="auto"
                    value={draft.description}
                    onChange={(event) =>
                      setDraft({ ...draft, description: event.currentTarget.value })
                    }
                    rows={2}
                  />
                </FormField>
              </Stack>
              {!guarded && (
                <div className="dialog-study-fields">
                  <FormField controlId={`${formId}-owner`} label="Owner">
                    <Input
                      id={`${formId}-owner`}
                      name="owner"
                      dir="auto"
                      value={draft.owner}
                      onChange={(event) => setDraft({ ...draft, owner: event.currentTarget.value })}
                    />
                  </FormField>
                  <FormField controlId={`${formId}-access`} label="Default access">
                    <Select
                      id={`${formId}-access`}
                      name="access"
                      options={roles}
                      value={draft.access}
                      onValueChange={(access) => {
                        if (access) {
                          setDraft({ ...draft, access });
                        }
                      }}
                    />
                  </FormField>
                </div>
              )}
              {overflow && (
                <>
                  <Stack gap={12}>
                    <Title as="h3" size="body-m" weight="semibold">
                      Publishing
                    </Title>
                    <CheckboxCard
                      label="Include in search"
                      name="searchable"
                      checked={draft.searchable}
                      onCheckedChange={(next) => setDraft({ ...draft, searchable: next })}
                      description={<bdi>People with access can find this project in search.</bdi>}
                    />
                    <CheckboxCard
                      label="Notify reviewers on publication"
                      name="notify"
                      checked={draft.notify}
                      onCheckedChange={(next) => setDraft({ ...draft, notify: next })}
                      description={<bdi>Send a notification when changes go live.</bdi>}
                    />
                  </Stack>
                  <Divider decorative />
                  <Stack gap={12}>
                    <Title as="h3" size="body-m" weight="semibold">
                      Review
                    </Title>
                    <FormField controlId={`${formId}-review-owner`} label="Review owner">
                      <Input
                        id={`${formId}-review-owner`}
                        name="reviewOwner"
                        dir="auto"
                        value={draft.reviewOwner}
                        onChange={(event) =>
                          setDraft({ ...draft, reviewOwner: event.currentTarget.value })
                        }
                      />
                    </FormField>
                    <FormField label="Review instructions" controlId={instructionsId}>
                      <Textarea
                        id={instructionsId}
                        rows={3}
                        name="instructions"
                        dir="auto"
                        value={draft.instructions}
                        onChange={(event) =>
                          setDraft({ ...draft, instructions: event.currentTarget.value })
                        }
                      />
                    </FormField>
                  </Stack>
                </>
              )}
            </form>
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="secondary" tone="neutral">
                Cancel
              </Button>
            </ModalClose>
            <Button form={formId} type="submit" loading={status === 'pending'}>
              {status === 'failed' ? 'Try again' : 'Save changes'}
            </Button>
          </ModalFooter>
          <DiscardChanges
            open={confirm}
            onOpenChange={setConfirm}
            returnFocus={lastField}
            onDiscard={() => {
              setConfirm(false);
              setOpen(false);
            }}
          >
            Your changes to this project will be lost.
          </DiscardChanges>
        </ModalContent>
      </Modal>
      <VisuallyHidden role="status">{saved ? 'Project updated' : ''}</VisuallyHidden>
      {saved && (
        <div className="dialog-study-notice">
          <Toast
            status="success"
            title="Project updated"
            onDismiss={() => {
              setSaved(false);
              triggerRef.current?.focus({ preventScroll: true });
            }}
          />
        </div>
      )}
    </DialogStudy>
  );
}
