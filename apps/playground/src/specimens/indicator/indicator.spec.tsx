import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { indicatorCode } from './indicator-code.js';
import { IndicatorPlayground } from './indicator-playground.js';
import { UnreadNotifications } from './indicator-notifications.examples.js';
import notificationsSource from './indicator-notifications.examples.tsx?raw';
import { IndicatorData, IndicatorHostStates } from './indicator.behavior.examples.js';
import {
  IndicatorBoundaries,
  IndicatorCorners,
  IndicatorOverlay,
  IndicatorOverview,
  IndicatorScale,
  IndicatorSurfaces,
} from './indicator.examples.js';

const props = {
  children: {
    kind: 'slot',
    group: 'Host',
    default: 'button',
    label: 'Host element',
    publicType: 'ReactElement',
    description:
      'Required. This example starts with a button. Supply one measurable host that keeps its own semantics and interaction.',
    choices: [
      { value: 'button', label: 'Native button' },
      { value: 'avatar', label: 'Fixed-size avatar' },
    ],
  },
  width: {
    kind: 'enum',
    group: 'Host',
    default: 'auto',
    description:
      'Use the host’s natural width or fill the space available after reserving room for the marker at its corner.',
    choices: [{ value: 'auto' }, { value: 'full' }],
  },
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description: 'The dot diameter or the minimum counter size.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  status: {
    kind: 'enum',
    group: 'Role',
    default: 'accent',
    description: 'The semantic color of the signal.',
    choices: [
      { value: 'neutral' },
      { value: 'accent' },
      { value: 'info' },
      { value: 'success' },
      { value: 'warning' },
      { value: 'danger' },
    ],
  },
  withBorder: {
    kind: 'boolean',
    group: 'Geometry',
    default: true,
    description: 'Paint a 2px separator outside the marker.',
  },
  visible: {
    kind: 'boolean',
    group: 'Availability',
    default: true,
    description: 'Display the marker while leaving the host in place.',
  },
  position: {
    kind: 'enum',
    group: 'Geometry',
    default: 'top-end',
    description: 'Attach to a logical corner of the host.',
    choices: [
      { value: 'top-start' },
      { value: 'top-end' },
      { value: 'bottom-start' },
      { value: 'bottom-end' },
    ],
  },
  overlap: {
    kind: 'enum',
    group: 'Geometry',
    default: 'rectangular',
    description: 'Anchor to a rectangular corner or inset along a theme-shaped avatar.',
    choices: [{ value: 'rectangular' }, { value: 'circular' }],
  },
  dot: {
    kind: 'boolean',
    group: 'Content',
    default: false,
    description: 'Show a dot for new activity. Dot mode excludes count, max and showZero.',
  },
  count: {
    kind: 'number',
    group: 'Content',
    default: 3,
    publicType: 'number | null | undefined',
    description:
      'This example starts at 3. An omitted count or null means the quantity is unavailable. Supply the actual non-negative safe integer before applying a visual cap.',
    examples: [0, 3, 120],
  },
  max: {
    kind: 'number',
    group: 'Content',
    default: 99,
    publicType: 'number',
    description: 'A positive safe integer. Larger counts show the cap followed by a plus sign.',
    examples: [9, 99],
  },
  showZero: {
    kind: 'boolean',
    group: 'Content',
    default: false,
    description: 'Display a zero count.',
  },
} as const satisfies PropSchema;

export type IndicatorValues = ComponentValues<typeof props>;

export default defineComponent({
  id: 'indicator',
  title: 'Indicator',
  category: 'Feedback & Status',
  status: 'UI',
  summary: 'A count or activity dot attached to a corner of its host.',
  componentName: 'Indicator',
  props,
  constraints: [
    {
      kind: 'ignored',
      when: { dot: true },
      affects: ['count', 'max', 'showZero'],
      reason: 'A dot signals activity without displaying a quantity.',
    },
    {
      kind: 'forbidden',
      when: { children: 'avatar' },
      affects: [{ key: 'width', value: 'full' }],
      reason:
        'The avatar in this preview is a fixed square. Use the native button to try full width.',
    },
    {
      kind: 'precedence',
      when: { visible: false },
      affects: [
        'dot',
        'count',
        'max',
        'showZero',
        'position',
        'overlap',
        'status',
        'size',
        'withBorder',
      ],
      reason: 'Hiding the marker takes priority over its content, appearance and placement.',
    },
  ],
  render: withOverlaySurface(IndicatorPlayground, 'border-box'),
  code: indicatorCode,
  states: [
    {
      id: 'scale',
      rows: 'size',
      cols: 'dot',
      title: 'Dot and count sizes',
      caption:
        'Counters start at 16, 20 and 24 pixels and grow with text. Dots keep their 6, 8 and 12 pixel diameters.',
    },
    {
      id: 'status',
      rows: 'status',
      cols: 'dot',
      title: 'Semantic signals',
      caption:
        'Compare the same counter and activity dot in each status. Use warning or danger for a signal that needs attention.',
    },
    {
      id: 'corners',
      rows: 'position',
      cols: 'size',
      title: 'Four logical corners',
      caption:
        'Compare how far each size extends past the button at the four logical corners. Inline start and end follow the writing direction.',
    },
  ],
  cases: [
    {
      id: 'hosts-at-scale',
      title: 'Choosing a size for the host',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Compare one digit, a capped counter and a presence dot on their icon button and avatar hosts at each size.',
      render: withOverlaySurface(IndicatorScale, 'border-box'),
    },
    {
      id: 'host-contours',
      title: 'Button and avatar contours',
      kind: 'content',
      mode: 'pinned',
      controls: {
        dot: { kind: 'boolean', label: 'Show dots', default: false },
      },
      caption:
        'Switch between dots and counters at all four corners. The avatar anchor moves inward along a rounded outline and follows a square corner in Pixel.',
      render: withOverlaySurface(IndicatorCorners, 'border-box'),
    },
    {
      id: 'data',
      title: 'Counts, zero and absence',
      kind: 'behavior',
      mode: 'live',
      controls: {
        visible: { kind: 'boolean', label: 'Show marker', default: true },
        showZero: { kind: 'boolean', label: 'Show zero', default: false },
        hostVisible: { kind: 'boolean', label: 'Show host', default: true },
      },
      actions: [
        { id: 'increment', label: 'Add one' },
        { id: 'limit', label: 'Set 99' },
        { id: 'capped', label: 'Set 105' },
        { id: 'unavailable', label: 'No data' },
      ],
      reset: true,
      caption:
        'Compare unavailable, invalid, zero and capped counts. The example treats invalid data as unavailable. Change the shared sample count, then activate one bell to mark its notifications as read.',
      render: withOverlaySurface(IndicatorData, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Separation on each surface',
      kind: 'surface',
      mode: 'pinned',
      caption:
        'Each host sits on the shell, canvas or surface pigment. Compare the marker with and without the two-pixel separator on the same background.',
      render: withOverlaySurface(IndicatorSurfaces, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      kind: 'surface',
      mode: 'pinned',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'The separator takes its pigment from the floating panel. The presence labels stay visible for available, away and offline collaborators.',
      render: IndicatorOverlay,
    },
    {
      id: 'host-states',
      title: 'The host keeps its interaction',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Activate an available host by pointer or keyboard and follow focus to its neighbor. Busy and disabled hosts retain their last known quantity.',
      render: withOverlaySurface(IndicatorHostStates, 'border-box'),
    },
    {
      id: 'boundaries',
      title: 'Space, wrapping and direction',
      kind: 'content',
      mode: 'pinned',
      caption:
        'A full-width button can wrap while its count stays on one line. Compare an inline Badge in a constrained row, a bare glyph and the top-end anchor in both directions.',
      render: withOverlaySurface(IndicatorBoundaries, 'border-box'),
    },
    {
      id: 'overview',
      title: 'Choosing a signal',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Use an accent counter for unread activity, a presence dot with a visible label for availability and a neutral counter for an ordinary quantity.',
      render: withOverlaySurface(IndicatorOverview, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'overview',
      title: 'Unread notifications',
      mode: 'live',
      reset: true,
      caption:
        'Open the notification list to read the three messages. The counter clears and the same button closes or reopens the list.',
      code: notificationsSource,
      render: withOverlaySurface(
        ({ ctx }) => (
          <div data-example-disclosure="">
            <UnreadNotifications indicatorProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
    },
  ],
});
