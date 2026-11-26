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
} from '@docouno/unica';
import { FormField } from '../../prototypes/form-field/form-field.proto.js';
import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { ToastCard } from '../../prototypes/toast/toast.proto.js';
import { DialogStudy } from '../../prototypes/dialog/dialog.examples.js';
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
} from '../../prototypes/dialog/dialog.proto.js';
import type { DialogSize } from '../../prototypes/dialog/dialog.proto.js';

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
  const touchLaunch = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const lastField = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(true);
  const [project, setProject] = useState(initialProject);
  const [draft, setDraft] = useState(project);
  const dirty = draft.name !== project.name || draft.description !== project.description;
  const [focusOnOpen, setFocusOnOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const controls = ctx.story?.controls;
  const size = (controls?.size ?? 'm') as DialogSize;
  const width = (controls?.width ?? 'm') as DialogSize;
  const height = controls?.height ?? 'roomy';
  const status = controls?.status ?? 'ready';
  const [saved, setSaved] = useState(false);
  const requestClose = (): void => {
    if (guarded && dirty) {
      const focused = document.activeElement;
      lastField.current =
        focused instanceof HTMLElement &&
        focused.closest('.dialog-surface')?.contains(nameRef.current)
          ? focused
          : nameRef.current;
      setConfirm(true);
    } else {
      setOpen(false);
    }
  };
  const changeOpen = (nextOpen: boolean): void => {
    if (nextOpen) {
      setDraft(project);
      setFocusOnOpen(!touchLaunch.current && !overflow);
      setSaved(false);
      setOpen(true);
    } else {
      requestClose();
    }
  };
  return (
    <DialogStudy
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
        <div className="dialog-drawer-launch" inert={open}>
          <ModalTrigger
            {...(!open ? ctx.subject : {})}
            id={formId + '-trigger'}
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
          {...ctx.subject}
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
                ? 'Edit the name and description shown in the project directory.'
                : 'Update the information teammates see in the project directory.'}
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <form
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
                  htmlFor={`${formId}-project`}
                  label="Project name"
                  required
                  status={status === 'invalid' ? 'danger' : 'neutral'}
                  message={
                    status === 'invalid' ? <bdi>A project already uses this name.</bdi> : undefined
                  }
                  messageId={`${formId}-project-message`}
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
                    aria-describedby={
                      status === 'invalid' ? `${formId}-project-message` : undefined
                    }
                  />
                </FormField>
                <FormField label="Description" htmlFor={descriptionId}>
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
                  <FormField htmlFor={`${formId}-owner`} label="Owner">
                    <Input
                      id={`${formId}-owner`}
                      name="owner"
                      dir="auto"
                      value={draft.owner}
                      onChange={(event) => setDraft({ ...draft, owner: event.currentTarget.value })}
                    />
                  </FormField>
                  <FormField htmlFor={`${formId}-access`} label="Default access">
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
                    <FormField htmlFor={`${formId}-review-owner`} label="Review owner">
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
                    <FormField label="Review instructions" htmlFor={instructionsId}>
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
            <ModalClose>Cancel</ModalClose>
            <Button form={formId} type="submit" loading={status === 'pending'}>
              {status === 'failed' ? 'Try again' : 'Save changes'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal open={confirm} onOpenChange={setConfirm}>
        <ModalContent
          {...ctx.subject}
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
            <ModalDescription>Your changes to this project will be lost.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose ref={cancelRef}>Keep editing</ModalClose>
            <Button
              tone="danger"
              onClick={() => {
                lastField.current = null;
                setConfirm(false);
                setOpen(false);
              }}
            >
              Discard changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <VisuallyHidden role="status">{saved ? 'Project updated' : ''}</VisuallyHidden>
      {saved && (
        <div className="dialog-study-notice">
          <ToastCard
            status="success"
            title="Project updated"
            onDismiss={() => {
              setSaved(false);
              document.getElementById(formId + '-trigger')?.focus({ preventScroll: true });
            }}
          />
        </div>
      )}
    </DialogStudy>
  );
}
