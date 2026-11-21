import { Indicator } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { previewProps, previewText } from '../preview-code.js';
import {
  IndicatorBoundaries,
  IndicatorCorners,
  IndicatorData,
  IndicatorHostStates,
  IndicatorOverlay,
  IndicatorOverview,
  IndicatorScale,
  IndicatorStatuses,
  IndicatorSurfaces,
} from './indicator.examples.js';

const props = {
  children: {
    kind: 'slot',
    group: 'Host',
    default: 'button',
    label: 'Host element',
    description: 'One measurable element keeps its own semantics and interaction.',
    choices: [
      { value: 'button', label: 'Native button' },
      { value: 'avatar', label: 'Fixed-size avatar' },
    ],
  },
  width: {
    kind: 'enum',
    group: 'Host',
    default: 'auto',
    description: 'Use the host’s natural width or fill the available space.',
    choices: [{ value: 'auto' }, { value: 'full' }],
  },
  size: {
    kind: 'enum',
    group: 'Marker',
    default: 'm',
    description: 'The dot diameter or the minimum counter size.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  status: {
    kind: 'enum',
    group: 'Marker',
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
    group: 'Marker',
    default: true,
    description: 'Paint a 2px separator outside the marker.',
  },
  visible: {
    kind: 'boolean',
    group: 'Marker',
    default: true,
    description: 'Display the marker while leaving the host in place.',
  },
  position: {
    kind: 'enum',
    group: 'Placement',
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
    group: 'Placement',
    default: 'rectangular',
    description: 'Anchor to a rectangular corner or inset along a theme-shaped avatar.',
    choices: [{ value: 'rectangular' }, { value: 'circular' }],
  },
  dot: {
    kind: 'boolean',
    group: 'Content',
    default: false,
    description: 'Show a dot for new activity.',
  },
  count: {
    kind: 'number',
    group: 'Content',
    default: 3,
    description: 'The actual unread count, before applying the visual cap.',
    examples: [0, 3, 120],
  },
  max: {
    kind: 'number',
    group: 'Content',
    default: 99,
    description: 'Numbers above this positive integer are shown with a plus sign.',
    examples: [9, 99],
  },
  showZero: {
    kind: 'boolean',
    group: 'Content',
    default: false,
    description: 'Display a zero count.',
  },
} as const satisfies PropSchema;

const libraryDefaults = {
  position: 'top-end',
  size: 'm',
  status: 'accent',
  overlap: 'rectangular',
  width: 'auto',
  withBorder: true,
  visible: true,
  dot: false,
  max: 99,
  showZero: false,
} as const;
const avatarStyle = {
  display: 'inline-grid',
  placeItems: 'center',
  inlineSize: 40,
  blockSize: 40,
  borderRadius: 'var(--radius-full)',
  backgroundColor: 'var(--bg-surface-raised)',
  color: 'var(--fg-primary)',
} as const;
const hostLabels = { button: 'Notifications', avatar: 'Sample collaborator' };

function indicatorPreview({
  children: host,
  dot,
  count,
  max,
  showZero,
  ...shared
}: ComponentValues<typeof props>) {
  const text = hostLabels[host];
  let activity = 'count unavailable';
  if (dot) {
    activity = 'new activity';
  } else if (Number.isSafeInteger(count) && count >= 0) {
    activity = `${count} unread`;
  }
  return {
    host,
    text,
    name: `${text}, ${activity}`,
    marker: dot ? { ...shared, dot: true as const } : { ...shared, count, max, showZero },
  };
}

const usageCount = 3;
const usageName = `Notifications, ${usageCount} unread`;

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
  render: ({ ctx, values }) => {
    const { host, text, name, marker } = indicatorPreview(values);
    return (
      <Indicator {...ctx.subject} {...marker}>
        {host === 'avatar' ? (
          <span role="img" aria-label={name} style={avatarStyle}>
            AL
          </span>
        ) : (
          <button type="button" aria-label={name}>
            {text}
          </button>
        )}
      </Indicator>
    );
  },
  code: (values) => {
    const { host, text, name, marker } = indicatorPreview(values);
    const hostCode =
      host === 'avatar'
        ? `<span role="img" aria-label=${previewText(name)} style={${JSON.stringify(avatarStyle)}}>AL</span>`
        : `<button type="button" aria-label=${previewText(name)}>${text}</button>`;
    return `<Indicator${previewProps(marker, libraryDefaults)}>\n  ${hostCode}\n</Indicator>`;
  },
  matrixViews: [
    {
      id: 'scale',
      rows: 'size',
      cols: 'dot',
      title: 'Dot & count · S / M / L',
      caption: '16 / 20 / 24px counters and 6 / 8 / 12px dots. Match the marker to its host.',
      reference: () => <IndicatorScale />,
    },
    {
      id: 'status',
      rows: 'status',
      cols: 'dot',
      title: 'Semantic signals',
      caption:
        'Accent for new activity, neutral for quantity. Reserve warning and danger for their meaning.',
      reference: () => <IndicatorStatuses />,
    },
    {
      id: 'corners',
      rows: 'position',
      cols: 'size',
      title: 'Four logical corners',
      reference: () => <IndicatorCorners />,
    },
  ],
  cases: [
    {
      id: 'data',
      title: 'Counts, zero & absence',
      kind: 'behavior',
      render: () => <IndicatorData />,
    },
    {
      id: 'surfaces',
      title: 'Separation on each surface',
      kind: 'surface',
      render: () => <IndicatorSurfaces />,
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <IndicatorOverlay />,
    },
    {
      id: 'host-states',
      title: 'The host keeps its interaction',
      kind: 'behavior',
      render: () => <IndicatorHostStates />,
    },
    {
      id: 'boundaries',
      title: 'Space, wrapping & direction',
      kind: 'content',
      render: () => <IndicatorBoundaries />,
    },
    {
      id: 'overview',
      title: 'Choosing a signal',
      kind: 'content',
      render: () => <IndicatorOverview />,
    },
  ],
  usage: [
    {
      id: 'overview',
      code: `import { Indicator } from '@docouno/unica';
import '@docouno/unica/styles.css';

<Indicator count={${usageCount}} size="s">
  <button type="button" aria-label="${usageName}">Notifications</button>
</Indicator>`,
      title: 'Unread notifications',
      render: () => (
        <Indicator count={usageCount} size="s">
          <button type="button" aria-label={usageName}>
            Notifications
          </button>
        </Indicator>
      ),
    },
  ],
});
