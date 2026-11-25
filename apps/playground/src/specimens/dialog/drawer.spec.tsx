import { DialogStudy } from '../../prototypes/dialog/dialog.examples.js';
import { defineComponent } from '../../workbench/types.js';
import { choice, eventProp, toggle } from '../control-props.js';
import { ActivityFilters } from './activity-filters.js';
import filtersSource from './activity-filters.tsx?raw';
import { DeliverySettings } from './delivery-settings.js';
import { ActivityFilterPanel } from './drawer-preview.js';
import panelSource from './drawer-preview.tsx?raw';

const sizes = ['s', 'm', 'l'] as const;
const sides = ['start', 'end', 'top', 'bottom'] as const;
const adaptiveSide = { narrow: 'bottom', wide: 'end' } as const;
const editablePanel = panelSource
  .replaceAll('../../prototypes/', './prototypes/')
  .replace('export function ActivityFilterPanel', 'function ActivityFilterPanel');

export default defineComponent({
  id: 'drawer',
  title: 'Drawer',
  category: 'Overlays',
  status: 'Proto',
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
    presentation: {
      ...choice(
        'Host',
        'Launch the panel or pin it for comparison. The standalone example opens from its trigger.',
        ['live', 'pinned'],
        'live',
      ),
      demo: true,
    },
    dismissOnBackdrop: toggle(
      'Interaction',
      'Dismiss DrawerContent when a primary press and release both land on the backdrop.',
    ),
    onOpenChange: eventProp(
      'Drawer reports a request to open or close. The owner decides whether to accept it.',
      '(open) => console.log(open)',
      '(open: boolean) => void',
    ),
  },
  render: ({ values, ctx }) => (
    <DialogStudy height={320}>
      <ActivityFilterPanel
        contentProps={{
          size: values.size,
          width: values.width,
          side: values.side,
          dismissOnBackdrop: values.dismissOnBackdrop,
        }}
        subject={ctx.subject}
        pinned={values.presentation === 'pinned'}
        onOpenChange={ctx.action('onOpenChange')}
      />
    </DialogStudy>
  ),
  code: ({ size, width, side, dismissOnBackdrop }) => `${editablePanel}

export function FilterPanel() {
  return <ActivityFilterPanel contentProps={${JSON.stringify({ size, width, side, dismissOnBackdrop })}} />;
}`,
  states: [
    {
      id: 'dimensions',
      title: 'Panel edges and width',
      caption:
        'Each width group shows the four edges. Wider panels stop at the workspace boundary. These panels stay open for inspection. Use the Playground trigger to open a live panel.',
      rows: 'side',
      group: 'width',
      fixed: { presentation: 'pinned' },
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
        return (
          <DialogStudy height={540}>
            <ActivityFilters
              subject={ctx.subject}
              contentProps={{
                size: controls?.size ?? 'm',
                width: controls?.width ?? 's',
                side: controls?.side === 'adaptive' ? adaptiveSide : (controls?.side ?? 'end'),
              }}
            />
          </DialogStudy>
        );
      },
      code: filtersSource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
