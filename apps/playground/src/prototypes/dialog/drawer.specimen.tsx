import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';
import { defineSpecimen } from '../../workbench/types.js';
import { Button } from '../button/button.proto.js';
import { CheckboxCard, SwitchCard } from '../choice-card/choice-card.proto.js';
import { Input } from '../input/input.proto.js';
import { Select } from '../select/select.proto.js';
import { Textarea } from '../textarea/textarea.proto.js';
import { DialogSizeControls, DialogStudy, StudySelect } from './dialog.examples.js';
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
} from './dialog.proto.js';
import type { DialogSize, DrawerSide } from './dialog.proto.js';

const adaptiveSide = { wide: 'end', narrow: 'bottom' } as const;
const activity = [
  { value: 'all', label: 'All actions' },
  { value: 'publication', label: 'Publication' },
  { value: 'access', label: 'Access changes' },
  { value: 'review', label: 'Reviews' },
];
const schedules = [
  { value: 'daily', label: 'Daily summary' },
  { value: 'weekly', label: 'Weekly summary' },
  { value: 'monthly', label: 'Monthly summary' },
];

function FilterActivity(): ReactElement {
  const formId = useId();
  const [size, setSize] = useState<DialogSize>('m');
  const [width, setWidth] = useState<DialogSize>('s');
  const [side, setSide] = useState<DrawerSide | 'adaptive'>('end');
  const [open, setOpen] = useState(true);
  const [applied, setApplied] = useState(false);
  return (
    <DialogStudy
      height={540}
      controls={
        <>
          <StudySelect
            label="Side"
            value={side}
            options={[
              ['end', 'Inline end'],
              ['start', 'Inline start'],
              ['top', 'Top'],
              ['bottom', 'Bottom'],
              ['adaptive', 'Adaptive'],
            ]}
            onChange={setSide}
          />
          <DialogSizeControls
            size={size}
            width={width}
            onSizeChange={setSize}
            onWidthChange={setWidth}
          />
        </>
      }
    >
      <Drawer open={open} onOpenChange={setOpen}>
        <div className="dialog-drawer-launch" inert={open}>
          <DrawerTrigger variant="secondary" tone="neutral" iconLeft={SlidersHorizontalIcon}>
            Filter activity
          </DrawerTrigger>
          {applied && <p role="status">Filters applied</p>}
        </div>
        <DrawerContent
          side={side === 'adaptive' ? adaptiveSide : side}
          size={size}
          width={width}
          described
        >
          <DrawerHeader closeLabel="Close activity filters">
            <DrawerTitle>Filter activity</DrawerTitle>
            <DrawerDescription>Narrow the events shown in the activity log.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <form
              id={formId}
              className="dialog-study-form"
              onSubmit={(event) => {
                event.preventDefault();
                setApplied(true);
                setOpen(false);
              }}
            >
              <Select label="Action type" options={activity} defaultValue="all" />
              <Input label="Actor" placeholder="All people and services" />
              <CheckboxCard
                label="Include scheduled events"
                description={<bdi>Show changes made by automation.</bdi>}
                defaultChecked
              />
            </form>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose>Cancel</DrawerClose>
            <Button form={formId} type="submit">
              Apply filters
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </DialogStudy>
  );
}

function DeliverySettings({ long = false }: { readonly long?: boolean }): ReactElement {
  const formId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const returnRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [mode, setMode] = useState<'bottom' | 'adaptive' | 'no-swipe'>('bottom');
  const [height, setHeight] = useState<'standard' | 'short' | 'keyboard'>('standard');
  const [saved, setSaved] = useState(false);
  const [delivery, setDelivery] = useState({
    schedule: 'weekly',
    email: 'reviews@example.com',
    preview: true,
    reviews: true,
    published: false,
    note: 'Highlight any deadlines in the upcoming week.',
  });

  const requestOpen = (next: boolean): void => {
    if (next || !dirty) {
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
    <DialogStudy
      height={height === 'keyboard' ? 250 : height === 'short' ? 365 : long ? 490 : 535}
      controls={
        long ? (
          <StudySelect
            label="Available height"
            value={height}
            options={[
              ['standard', 'Reading area'],
              ['short', 'Short window'],
              ['keyboard', 'Keyboard inset'],
            ]}
            onChange={setHeight}
          />
        ) : (
          <StudySelect
            label="Presentation"
            value={mode}
            options={[
              ['bottom', 'Bottom sheet'],
              ['adaptive', 'Adaptive'],
              ['no-swipe', 'Button close only'],
            ]}
            onChange={setMode}
          />
        )
      }
    >
      <Drawer open={open} onOpenChange={requestOpen}>
        <div className="dialog-drawer-launch" inert={open}>
          <DrawerTrigger variant="secondary" tone="neutral">
            Edit delivery settings
          </DrawerTrigger>
          {saved && <p role="status">Delivery settings saved</p>}
        </div>
        <DrawerContent
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
              onChange={() => setDirty(true)}
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const schedule = data.get('schedule');
                const email = data.get('email');
                const note = data.get('note');
                setDelivery({
                  schedule: typeof schedule === 'string' ? schedule : delivery.schedule,
                  email: typeof email === 'string' ? email : delivery.email,
                  preview: data.has('preview'),
                  reviews: long ? data.has('reviews') : delivery.reviews,
                  published: long ? data.has('published') : delivery.published,
                  note: typeof note === 'string' ? note : delivery.note,
                });
                setDirty(false);
                setSaved(true);
                setOpen(false);
              }}
            >
              <Select
                label="Delivery schedule"
                name="schedule"
                options={schedules}
                defaultValue={delivery.schedule}
                onValueChange={() => setDirty(true)}
              />
              <Input
                ref={emailRef}
                label="Send to"
                type="email"
                name="email"
                defaultValue={delivery.email}
                required
              />
              <SwitchCard
                label="Include a preview"
                description={<bdi>Add a short summary of each pending review.</bdi>}
                name="preview"
                defaultChecked={delivery.preview}
              />
              {long && (
                <>
                  <div className="dialog-study-form-section">
                    <h3>Scope</h3>
                    <CheckboxCard
                      label="Open reviews"
                      name="reviews"
                      defaultChecked={delivery.reviews}
                      description={<bdi>Include reviews waiting for a response.</bdi>}
                    />
                    <CheckboxCard
                      label="Published work"
                      name="published"
                      defaultChecked={delivery.published}
                      description={<bdi>Include documents published during this period.</bdi>}
                    />
                  </div>
                  <div className="dialog-study-form-section">
                    <h3>Additional instructions</h3>
                    <Textarea
                      label="Digest note"
                      name="note"
                      rows={3}
                      defaultValue={delivery.note}
                    />
                  </div>
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
                setDirty(false);
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

export default defineSpecimen({
  id: 'drawer',
  title: 'Drawer',
  group: 'Overlays',
  summary:
    'A workspace task at the edge. See Page Properties & Relations under Folio for a responsive form.',
  defaultSurface: 'overlay',
  sections: [
    {
      id: 'placement',
      title: 'Activity filters · Side, width and density',
      kind: 'matrix',
      overlayStage: true,
      render: () => <FilterActivity />,
    },
    {
      id: 'sheet',
      title: 'Bottom sheet · Drag the handle or edit before closing',
      kind: 'states',
      overlayStage: true,
      render: () => <DeliverySettings />,
    },
    {
      id: 'overflow',
      title: 'Long form · Pinned actions and short-window fallback',
      kind: 'context',
      overlayStage: true,
      render: () => <DeliverySettings long />,
    },
  ],
});
