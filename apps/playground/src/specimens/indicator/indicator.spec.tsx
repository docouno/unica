import { BellIcon } from '@phosphor-icons/react';
import { Indicator } from '../../prototypes/indicator/indicator.proto.js';
import { IconButton } from '../../prototypes/button/button.proto.js';
import { previewProps } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
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
} from '../../prototypes/indicator/indicator.examples.js';

export default defineComponent({
  id: 'indicator',
  title: 'Indicator',
  category: 'Feedback & Status',
  status: 'Proto',
  summary: 'Quiet corner signals: a known quantity or new activity, attached to its source.',
  componentName: 'Indicator',
  props: {
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'm',
      description: 'Diameter of the marker.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    status: {
      kind: 'enum',
      group: 'Appearance',
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
    placement: {
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
    dot: {
      kind: 'boolean',
      group: 'Content',
      default: false,
      description: 'Show a dot instead of a count.',
    },
    count: {
      kind: 'number',
      group: 'Content',
      default: 3,
      description: 'Unread count shown beside the host.',
      examples: [0, 3, 120],
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { dot: true },
      affects: ['count'],
      reason: 'A dot signals activity without displaying a count.',
    },
  ],
  render: ({ ctx, values }) => (
    <Indicator {...ctx.subject} {...values}>
      <IconButton
        icon={BellIcon}
        aria-label={values.dot ? 'Notifications' : `Notifications, ${values.count} unread`}
      />
    </Indicator>
  ),
  code: (values) =>
    `<Indicator${previewProps(values, { size: 'm', status: 'accent', placement: 'top-end', dot: false })}>\n  <IconButton icon={BellIcon} aria-label="Notifications" />\n</Indicator>`,
  matrixViews: [
    {
      id: 'scale',
      rows: 'size',
      cols: 'dot',
      title: 'Dot & count · S / M / L',
      caption: '16 / 20 / 24px counters; 6 / 8 / 12px dots. Match the marker to its host.',
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
      rows: 'placement',
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
  ],
  usage: [
    {
      id: 'overview',
      code: `<Indicator count={3} status="info">
  <IconButton icon={BellIcon} aria-label="Notifications, 3 unread" />
</Indicator>`,
      title: 'Small signals, clear meaning',
      render: () => <IndicatorOverview />,
    },
  ],
});
