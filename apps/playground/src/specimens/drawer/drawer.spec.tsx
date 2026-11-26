import { defineComponent } from '../../workbench/types.js';
import { choice, eventProp, toggle } from '../control-props.js';
import {
  dialogRootConstraints,
  dialogRootControls,
  dialogRootProps,
} from '../shared/dialog-controls.js';
import { DialogStudy } from '../shared/dialog-study.js';
import { ActivityFilters } from './activity-filters.js';
import { DeliverySettings } from './delivery-settings.js';
import { ActivityDetailsPanel } from './drawer-preview.js';

const sizes = ['s', 'm', 'l'] as const;
const sides = ['start', 'end', 'top', 'bottom'] as const;
const adaptiveSide = { narrow: 'bottom', wide: 'end' } as const;
const filtersExample = `import { useId, useRef, useState } from 'react';
import {
  Button, Checkbox, Drawer, DrawerBody, DrawerClose, DrawerContent,
  DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger, Input, Select,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

const actions = [
  { value: 'all', label: 'All actions' },
  { value: 'publication', label: 'Publication' },
  { value: 'review', label: 'Reviews' },
];

export function ActivityFilters() {
  const [open, setOpen] = useState(true);
  const [filters, setFilters] = useState({ action: 'all', actor: '', scheduled: true });
  const formId = useId();
  const opener = useRef(null);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild ref={opener}><Button variant="secondary">Activity filters</Button></DrawerTrigger>
      <DrawerContent side={{ narrow: 'bottom', wide: 'end' }} width="s" returnFocus={opener}>
        <DrawerHeader><DrawerTitle>Activity filters</DrawerTitle><DrawerClose /></DrawerHeader>
        <DrawerBody>
          <form id={formId} onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setFilters({
              action: String(data.get('action')),
              actor: String(data.get('actor')),
              scheduled: data.has('scheduled'),
            });
            setOpen(false);
          }}>
            <Select aria-label="Action" name="action" options={actions} defaultValue={filters.action} />
            <Input aria-label="Actor" name="actor" defaultValue={filters.actor} />
            <Checkbox name="scheduled" defaultChecked={filters.scheduled} label="Include scheduled events" />
          </form>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild><Button variant="secondary" tone="neutral">Cancel</Button></DrawerClose>
          <Button type="submit" form={formId}>Apply filters</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}`;

export default defineComponent({
  id: 'drawer',
  title: 'Drawer',
  category: 'Overlays',
  status: 'UI',
  form: 'inline',
  summary:
    'A task panel attached to a workspace edge. Placement, panel width and content density can vary independently.',
  defaultSurface: 'overlay',
  props: {
    size: choice(
      'Geometry',
      'DrawerContent density. Changes the panel insets and spacing.',
      sizes,
      'm',
    ),
    width: choice(
      'Geometry',
      'DrawerContent width ceiling. S, M and L use 24, 36 and 52rem, within the available workspace.',
      sizes,
      'm',
    ),
    side: {
      ...choice(
        'Geometry',
        'DrawerContent edge. Start and end follow the reading direction. An adaptive pair uses narrow at 600px or less.',
        sides,
        'end',
      ),
      publicType: 'DrawerSide | { readonly narrow: DrawerSide; readonly wide: DrawerSide }',
    },
    ...dialogRootControls,
    dismissOnBackdrop: toggle(
      'Interaction',
      'Dismiss DrawerContent when a primary press and release both land on the backdrop.',
    ),
    swipeToClose: toggle(
      'Interaction',
      'Adds a drag handle to a bottom drawer. Close and Escape remain available.',
      true,
    ),
    onOpenChange: eventProp(
      'Drawer reports a request to open or close. The owner decides whether to accept it.',
      '(open) => console.log(open)',
      '(open: boolean) => void',
    ),
  },
  constraints: [
    ...dialogRootConstraints,
    ...(['start', 'end', 'top'] as const).map((side) => ({
      kind: 'ignored' as const,
      when: { side, swipeToClose: true },
      affects: ['swipeToClose'],
      reason: 'The drag handle is available on the bottom edge.',
    })),
  ],
  render: ({ values, ctx }) => (
    <DialogStudy ctx={ctx} height={320} title="Activity details example">
      <ActivityDetailsPanel
        key={values.open === 'unset' ? String(values.defaultOpen) : 'controlled'}
        contentProps={{
          size: values.size,
          width: values.width,
          side: values.side,
          dismissOnBackdrop: values.dismissOnBackdrop,
          swipeToClose: values.swipeToClose,
        }}
        rootProps={{ ...dialogRootProps(values), onOpenChange: ctx.action('onOpenChange') }}
        subject={ctx.subject}
      />
    </DialogStudy>
  ),
  code: ({ size, width, side, dismissOnBackdrop, swipeToClose, open, defaultOpen }) =>
    `import { useRef } from 'react';
import { Button, Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ActivityDetails() {
  const opener = useRef(null);
  return (
    <Drawer {...${JSON.stringify(dialogRootProps({ open, defaultOpen }))}}>
      <DrawerTrigger asChild ref={opener}><Button variant="secondary">View activity details</Button></DrawerTrigger>
      <DrawerContent {...${JSON.stringify({ size, width, side, dismissOnBackdrop, swipeToClose })}} returnFocus={opener}>
        <DrawerHeader>
          <div>
            <DrawerTitle>Release notes</DrawerTitle>
            <DrawerDescription>QA approved version 3.</DrawerDescription>
          </div>
          <DrawerClose />
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}`,
  states: [
    {
      id: 'dimensions',
      title: 'Panel edges and width',
      caption:
        'Each width group shows the four edges. Wider panels stop at the workspace boundary. These panels stay open for inspection. Use the Playground trigger to open a live panel.',
      rows: 'side',
      group: 'width',
      fixed: { open: 'true' },
    },
  ],
  cases: [
    {
      id: 'sheet',
      title: 'Bottom sheet and draft guard',
      overlayStage: true,
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: {
        presentation: {
          kind: 'enum',
          label: 'Presentation',
          default: 'bottom',
          choices: [
            { value: 'bottom', label: 'Bottom sheet' },
            { value: 'adaptive', label: 'Adaptive' },
            { value: 'no-swipe', label: 'Swipe disabled' },
          ],
        },
      },
      caption:
        'Drag the handle or use Cancel to close the sheet. Changed settings ask for confirmation. Keep editing returns to the draft. Save settings accepts the form and restores those choices when reopened.',
      render: DeliverySettings,
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
          default: 'standard',
          choices: [
            { value: 'standard', label: 'Reading area' },
            { value: 'short', label: 'Short window' },
            { value: 'keyboard', label: 'Keyboard inset' },
          ],
        },
      },
      caption:
        'Scroll the longer form with the header and actions in view. When less than 96px of reading space remains, the whole panel scrolls so every field and action stays reachable.',
      render: ({ ctx }) => <DeliverySettings ctx={ctx} long />,
    },
  ],
  compositions: [
    {
      id: 'placement',
      title: 'Activity filters',
      overlayStage: true,
      mode: 'live',
      reset: true,
      controls: {
        side: {
          kind: 'enum',
          label: 'Side',
          default: 'end',
          choices: [
            { value: 'end', label: 'Inline end' },
            { value: 'start', label: 'Inline start' },
            { value: 'top', label: 'Top' },
            { value: 'bottom', label: 'Bottom' },
            { value: 'adaptive', label: 'Adaptive' },
          ],
        },
        width: {
          kind: 'enum',
          label: 'Width',
          default: 's',
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
      },
      caption:
        'Choose an action type, an actor and whether to include scheduled events. Apply filters shows the accepted criteria. Cancel drops edits and the next opening restores the last applied values. The adaptive panel moves from inline end to bottom at 600px.',
      render: ({ ctx }) => {
        const controls = ctx.story?.controls;
        const side = controls?.side;
        return (
          <DialogStudy ctx={ctx} height={540} title="Activity filters example">
            <ActivityFilters
              subject={ctx.subject}
              formProps={ctx.form}
              contentProps={{
                size: sizes.find((size) => size === controls?.size) ?? 'm',
                width: sizes.find((width) => width === controls?.width) ?? 's',
                side:
                  side === 'adaptive'
                    ? adaptiveSide
                    : (sides.find((edge) => edge === side) ?? 'end'),
              }}
            />
          </DialogStudy>
        );
      },
      code: filtersExample,
    },
  ],
});
