import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import {
  Button,
  CheckboxCard,
  Divider,
  FormField,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
} from '@docouno/unica';
import { DialogStudy } from '../../prototypes/dialog/dialog.examples.js';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../../prototypes/dialog/dialog.proto.js';
import type { PreviewProps } from '../../workbench/types.js';

const adaptiveSide = { wide: 'end', narrow: 'bottom' } as const;
const schedules = [
  { value: 'daily', label: 'Daily summary' },
  { value: 'weekly', label: 'Weekly summary' },
  { value: 'monthly', label: 'Monthly summary' },
];

export function DeliverySettings({
  ctx,
  long = false,
}: PreviewProps & { readonly long?: boolean }): ReactElement {
  const formId = useId();
  const noteId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const returnRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const mode = ctx.story?.controls.presentation ?? 'bottom';
  const height = ctx.story?.controls.height ?? 'standard';
  const [saved, setSaved] = useState(false);
  const [delivery, setDelivery] = useState({
    schedule: 'weekly',
    email: 'reviews@example.com',
    preview: true,
    reviews: true,
    published: false,
    note: 'Highlight any deadlines in the upcoming week.',
  });

  const [draft, setDraft] = useState(delivery);
  const dirty = Object.entries(delivery).some(
    ([key, value]) => draft[key as keyof typeof delivery] !== value,
  );

  const requestOpen = (next: boolean): void => {
    if (next || !dirty) {
      if (next) {
        setDraft(delivery);
      }
      setSaved(false);
      setOpen(next);
      return;
    }
    const focused = document.activeElement;
    returnRef.current =
      focused instanceof HTMLElement &&
      focused.closest('.dialog-surface')?.contains(emailRef.current)
        ? focused
        : emailRef.current;
    setConfirm(true);
  };

  return (
    <DialogStudy height={height === 'keyboard' ? 250 : height === 'short' ? 365 : long ? 490 : 535}>
      <Drawer open={open} onOpenChange={requestOpen}>
        <div className="dialog-drawer-launch" inert={open}>
          <DrawerTrigger {...(!open ? ctx.subject : {})} variant="secondary" tone="neutral">
            Edit delivery settings
          </DrawerTrigger>
          {saved && (
            <Text
              as="p"
              role="status"
              dir="auto"
              size="body-s"
              style={{ overflowWrap: 'anywhere', textAlign: 'center' }}
            >
              Delivery settings saved ·{' '}
              {schedules.find((item) => item.value === delivery.schedule)?.label} · {delivery.email}
            </Text>
          )}
        </div>
        <DrawerContent
          {...ctx.subject}
          side={long ? 'end' : mode === 'adaptive' ? adaptiveSide : 'bottom'}
          swipeToClose={mode !== 'no-swipe'}
          width="m"
          described
          inactive={confirm}
        >
          <DrawerHeader closeLabel="Close delivery settings">
            <DrawerTitle>
              {long ? 'Delivery and notification preferences' : 'Delivery settings'}
            </DrawerTitle>
            <DrawerDescription>
              Choose what arrives in the project’s review digest.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <form
              className="dialog-study-form"
              id={formId}
              onSubmit={(event) => {
                event.preventDefault();
                setDelivery(draft);
                setSaved(true);
                setOpen(false);
              }}
            >
              <FormField controlId={`${formId}-schedule`} label="Delivery schedule">
                <Select
                  id={`${formId}-schedule`}
                  name="schedule"
                  options={schedules}
                  value={draft.schedule}
                  onValueChange={(schedule) => {
                    if (schedule) {
                      setDraft({ ...draft, schedule });
                    }
                  }}
                />
              </FormField>
              <FormField controlId={`${formId}-email`} label="Send to" required>
                <Input
                  id={`${formId}-email`}
                  ref={emailRef}
                  type="email"
                  name="email"
                  value={draft.email}
                  onChange={(event) => setDraft({ ...draft, email: event.currentTarget.value })}
                  required
                />
              </FormField>
              <CheckboxCard
                label="Include a preview"
                description={<bdi>Add a short summary of each pending review.</bdi>}
                name="preview"
                checked={draft.preview}
                onCheckedChange={(next) => setDraft({ ...draft, preview: next })}
              />
              {long && (
                <>
                  <Stack gap={12}>
                    <Title as="h3" size="body-m" weight="semibold">
                      Scope
                    </Title>
                    <CheckboxCard
                      label="Open reviews"
                      name="reviews"
                      checked={draft.reviews}
                      onCheckedChange={(next) => setDraft({ ...draft, reviews: next })}
                      description={<bdi>Include reviews waiting for a response.</bdi>}
                    />
                    <CheckboxCard
                      label="Published work"
                      name="published"
                      checked={draft.published}
                      onCheckedChange={(next) => setDraft({ ...draft, published: next })}
                      description={<bdi>Include documents published during this period.</bdi>}
                    />
                  </Stack>
                  <Divider decorative />
                  <Stack gap={12}>
                    <Title as="h3" size="body-m" weight="semibold">
                      Additional instructions
                    </Title>
                    <FormField label="Digest note" controlId={noteId}>
                      <Textarea
                        id={noteId}
                        name="note"
                        rows={3}
                        value={draft.note}
                        onChange={(event) =>
                          setDraft({ ...draft, note: event.currentTarget.value })
                        }
                      />
                    </FormField>
                  </Stack>
                </>
              )}
            </form>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose>Cancel</DrawerClose>
            <Button form={formId} type="submit">
              Save settings
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <Modal open={confirm} onOpenChange={setConfirm}>
        <ModalContent
          {...ctx.subject}
          role="alertdialog"
          size="s"
          width="s"
          described
          className="dialog-discard-confirmation"
          initialFocus={keepRef}
          returnFocus={returnRef}
        >
          <ModalHeader closeLabel={false}>
            <ModalTitle>Discard unsaved changes?</ModalTitle>
            <ModalDescription>Your edits to delivery settings will be lost.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose ref={keepRef}>Keep editing</ModalClose>
            <Button
              tone="danger"
              onClick={() => {
                returnRef.current = null;
                setConfirm(false);
                setOpen(false);
              }}
            >
              Discard changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DialogStudy>
  );
}
