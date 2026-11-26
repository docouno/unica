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
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@docouno/unica';
import { activeDialogControl } from '../shared/dialog-controls.js';
import { DialogStudy, DiscardChanges } from '../shared/dialog-study.js';
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
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
    if (next) {
      setDraft(delivery);
      setSaved(false);
      setOpen(true);
      return;
    }

    const dialog = dialogRef.current;
    if (dirty && dialog?.isConnected && dialog.matches(':modal')) {
      returnRef.current = activeDialogControl(dialog) ?? emailRef.current;
      setConfirm(true);
      return;
    }

    setConfirm(false);
    setOpen(false);
  };

  return (
    <DialogStudy
      ctx={ctx}
      title="Delivery settings example"
      height={height === 'keyboard' ? 250 : height === 'short' ? 365 : long ? 490 : 535}
    >
      <Drawer open={open} onOpenChange={requestOpen}>
        <div className="dialog-study-launch" data-open={open || undefined}>
          <DrawerTrigger {...(!open ? ctx.subject : {})} ref={triggerRef} asChild>
            <Button variant="secondary" tone="neutral">
              Edit delivery settings
            </Button>
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
          returnFocus={triggerRef}
          {...ctx.subject}
          side={long ? 'end' : mode === 'adaptive' ? adaptiveSide : 'bottom'}
          swipeToClose={mode !== 'no-swipe'}
          width="m"
          ref={dialogRef}
        >
          <DrawerHeader>
            <div>
              <DrawerTitle>
                {long ? 'Delivery and notification preferences' : 'Delivery settings'}
              </DrawerTitle>
              <DrawerDescription>
                Choose what arrives in the project’s review digest.
              </DrawerDescription>
            </div>
            <DrawerClose aria-label="Close delivery settings" />
          </DrawerHeader>
          <DrawerBody>
            <form
              {...ctx.form}
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
            <DrawerClose asChild>
              <Button variant="secondary" tone="neutral">
                Cancel
              </Button>
            </DrawerClose>
            <Button form={formId} type="submit">
              Save settings
            </Button>
          </DrawerFooter>
          <DiscardChanges
            open={confirm}
            onOpenChange={setConfirm}
            returnFocus={returnRef}
            onDiscard={() => {
              setConfirm(false);
              setOpen(false);
            }}
          >
            Your edits to delivery settings will be lost.
          </DiscardChanges>
        </DrawerContent>
      </Drawer>
    </DialogStudy>
  );
}
